-- Service-only token lifecycle. A lease serializes OAuth and rotation across Vercel instances.
alter table public.user_connections add column if not exists token_lease_id uuid;
alter table public.user_connections add column if not exists token_lease_until timestamptz;
create schema if not exists bmod_internal;
revoke all on schema bmod_internal from public,anon,authenticated;
grant usage on schema bmod_internal to service_role;
create or replace function bmod_internal.bmod_token_transition(p_user_id uuid, p_action text, p_lease uuid default null, p_data jsonb default '{}'::jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
declare c public.user_connections%rowtype;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service role required'; end if;
  select * into c from public.user_connections where user_id=p_user_id and integration_key='bmod_tools' for update;
  if not found then return false; end if;
  if p_action='disconnect' then
    update public.user_connections set status='disabled',allowed_tools='[]',token_lease_id=null,token_lease_until=null,updated_at=now() where id=c.id;
    delete from public.connection_oauth_states where user_id=p_user_id and integration_key='bmod_tools';
    return true;
  end if;
  if c.status in ('disabled','disconnected') then return false; end if;
  if p_action='claim' then
    if p_lease is null then return false; end if;
    if c.token_lease_id is not null and c.token_lease_until>now() then return false; end if;
    update public.user_connections set token_lease_id=p_lease,token_lease_until=now()+interval '90 seconds' where id=c.id;
    return true;
  end if;
  if c.token_lease_id is distinct from p_lease or p_lease is null then return false; end if;
  if p_action='save' then
    if nullif(p_data->>'access_token','') is null or nullif(p_data->>'refresh_token','') is null or coalesce((p_data->>'expires_in')::numeric,0)<=0 then raise exception 'incomplete token response'; end if;
    perform public.store_connection_secret(p_user_id,'bmod_tools',p_data->>'access_token');
    perform public.store_connection_refresh_secret(p_user_id,'bmod_tools',p_data->>'refresh_token');
    if nullif(p_data->>'client_secret','') is not null then
      perform public.store_connection_client_secret(p_user_id,'bmod_tools',p_data->>'client_secret');
    end if;
    update public.user_connections set
      token_expires_at=now()+((p_data->>'expires_in')::numeric*interval '1 second'),
      oauth_scope=coalesce(nullif(p_data->>'scope',''),oauth_scope),
      provider_account_id=coalesce(nullif(p_data->>'location_id',''),provider_account_id),
      oauth_client_id=coalesce(nullif(p_data->>'client_id',''),oauth_client_id),
      oauth_provider='highlevel',oauth_token_auth_method='client_secret_post',
      oauth_token_endpoint='https://services.leadconnectorhq.com/oauth/token',
      oauth_authorization_endpoint='https://marketplace.gohighlevel.com/oauth/chooselocation',
      oauth_connected_at=case when p_data->>'mode'='callback' then now() else oauth_connected_at end,
      status='connected',read_only=true,last_error=null,
      allowed_tools='["search_contacts","search_opportunities","list_pipelines","list_workflows"]',
      discovered_tools='[{"name":"search_contacts","description":"Search contacts"},{"name":"search_opportunities","description":"Search opportunities"},{"name":"list_pipelines","description":"List pipelines"},{"name":"list_workflows","description":"List workflows"}]',
      updated_at=now()
    where id=c.id;
    return true;
  elsif p_action='revoke' then
    update public.user_connections set status='auth_required',last_error='HighLevel authorization is no longer valid. Please reconnect.',updated_at=now() where id=c.id;
    return true;
  elsif p_action='release' then
    update public.user_connections set token_lease_id=null,token_lease_until=null where id=c.id;
    return true;
  end if;
  raise exception 'unsupported token operation';
end $$;
revoke all on function bmod_internal.bmod_token_transition(uuid,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function bmod_internal.bmod_token_transition(uuid,text,uuid,jsonb) to service_role;

-- Exposed RPC delegates only for the service role; privileged code stays private.
create or replace function public.bmod_token_transition(p_user_id uuid, p_action text, p_lease uuid default null, p_data jsonb default '{}'::jsonb)
returns boolean language sql security invoker set search_path = '' as $$
  select bmod_internal.bmod_token_transition(p_user_id,p_action,p_lease,p_data);
$$;
revoke all on function public.bmod_token_transition(uuid,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.bmod_token_transition(uuid,text,uuid,jsonb) to service_role;
