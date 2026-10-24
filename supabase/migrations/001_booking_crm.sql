-- Apply once as a database administrator. Never expose the service role key.
-- Uses built-in PostgreSQL UUID and SHA-256 functions; no extension schema dependency.
create table public.staff_memberships(user_id uuid references auth.users(id) on delete cascade,branch_id text not null check(branch_id in ('s','p')),role text not null check(role in ('staff','owner')),primary key(user_id,branch_id));
create table public.bookings(
 id uuid primary key default gen_random_uuid(),reference text not null unique default ('TG-'||upper(replace(gen_random_uuid()::text,'-',''))),
 branch_id text not null check(branch_id in ('s','p')),service_id text not null check(service_id in ('cut','reset','root','balayage','gloss','smooth','spa','style','men','express','family','bridal')),
 stylist_preference text not null default '' check(stylist_preference in ('','precision','colour','texture','groom','occasion','family','creative')),occasion text not null default '' check(occasion in ('','meeting','monday','wedding','date','party','celebration','holiday','weekend','event')),preferred_date date not null,preferred_window text not null check(preferred_window in ('am','noon','pm')),
 customer_name text not null check(length(customer_name) between 2 and 100),customer_phone text not null check(customer_phone ~ '^\+91[6-9][0-9]{9}$'),notes text not null default '' check(length(notes)<=1000),contact_consent boolean not null check(contact_consent),
 status text not null default 'pending' check(status in ('pending','contacted','confirmed','declined','cancelled','completed','no_show')),appointment_at timestamptz,
 version integer not null default 1,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),idempotency_key uuid not null unique,payload_hash text not null,
 check(service_id<>'express' or branch_id='p'),check(service_id<>'family' or branch_id='s'),check(status<>'confirmed' or appointment_at is not null));
create index bookings_branch_date on public.bookings(branch_id,preferred_date);
create table public.booking_events(id uuid primary key default gen_random_uuid(),booking_id uuid not null references public.bookings(id),actor_id uuid references auth.users(id),kind text not null,old_status text,new_status text,old_appointment_at timestamptz,new_appointment_at timestamptz,note text,created_at timestamptz not null default now());
create table public.booking_rate_limits(key text primary key,window_start timestamptz not null default now(),count integer not null default 1);
create function public.can_access_branch(p_branch text) returns boolean language sql stable security definer set search_path=public,pg_temp as $$select exists(select 1 from staff_memberships where user_id=auth.uid() and (branch_id=p_branch or role='owner'))$$;
revoke all on function public.can_access_branch(text) from public;grant execute on function public.can_access_branch(text) to authenticated;
alter table public.staff_memberships enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_events enable row level security;
alter table public.booking_rate_limits enable row level security;
create policy memberships_self on public.staff_memberships for select to authenticated using(user_id=auth.uid());
create policy bookings_visible on public.bookings for select to authenticated using(public.can_access_branch(branch_id));
create policy events_visible on public.booking_events for select to authenticated using(exists(select 1 from public.bookings b where b.id=booking_id and public.can_access_branch(b.branch_id)));
revoke all on public.bookings,public.booking_events,public.staff_memberships,public.booking_rate_limits from anon,authenticated;
grant select on public.bookings,public.booking_events,public.staff_memberships to authenticated;
create function public.create_booking(p_payload jsonb,p_hash text,p_rate_key text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare b bookings; n integer; d date; rate_bucket text; rate_limit integer;
begin
 -- Serialize requests sharing the key so duplicates cannot race the rate limiter.
 perform pg_advisory_xact_lock(hashtextextended(p_payload->>'idempotencyKey',0));
 select * into b from bookings where idempotency_key=(p_payload->>'idempotencyKey')::uuid;
 if found then if b.payload_hash<>p_hash then raise sqlstate 'PT409' using message='Idempotency mismatch';end if;return jsonb_build_object('reference',b.reference,'replayed',true);end if;
 d:=(p_payload->>'preferredDate')::date;
 if d<((now() at time zone 'Asia/Kolkata')::date+1) or d>((now() at time zone 'Asia/Kolkata')::date+90) or length(coalesce(p_payload->>'notes',''))>1000 or p_payload->>'contactConsent'<>'true' then raise sqlstate 'PT400' using message='Invalid booking';end if;
 -- Lock the IP bucket first and phone second on every transaction.
 for rate_bucket,rate_limit in select 'ip:'||p_rate_key,30 union all select 'phone:'||encode(sha256(convert_to(p_payload->>'customerPhone','UTF8')),'hex'),5 loop
 insert into booking_rate_limits as r(key) values(rate_bucket) on conflict(key) do update set count=case when r.window_start<now()-interval '1 hour' then 1 else r.count+1 end,window_start=case when r.window_start<now()-interval '1 hour' then now() else r.window_start end returning count into n;
 if n>rate_limit then raise sqlstate 'PT429' using message='Rate limited';end if;
 end loop;
 insert into bookings(branch_id,service_id,stylist_preference,occasion,preferred_date,preferred_window,customer_name,customer_phone,notes,contact_consent,idempotency_key,payload_hash)
 values(p_payload->>'branchId',p_payload->>'serviceId',coalesce(p_payload->>'stylistPreference',''),coalesce(p_payload->>'occasion',''),d,p_payload->>'preferredWindow',p_payload->>'customerName',p_payload->>'customerPhone',coalesce(p_payload->>'notes',''),true,(p_payload->>'idempotencyKey')::uuid,p_hash) returning * into b;
 insert into booking_events(booking_id,kind,new_status)values(b.id,'created','pending');return jsonb_build_object('reference',b.reference,'replayed',false);
end$$;
revoke all on function public.create_booking(jsonb,text,text) from public,anon,authenticated;grant execute on function public.create_booking(jsonb,text,text) to service_role;
create function public.update_booking(p_id uuid,p_version integer,p_status text default null,p_appointment timestamptz default null,p_note text default null) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare b bookings;old text; old_appointment timestamptz;
begin
 select * into b from bookings where id=p_id for update;
 if not found or not can_access_branch(b.branch_id) then raise sqlstate 'PT403' using message='Access denied';end if;
 if b.version<>p_version then raise sqlstate 'PT409' using message='Version conflict';end if;
 if p_note is not null and (length(trim(p_note))=0 or length(p_note)>2000) then raise sqlstate 'PT400' using message='Invalid note';end if;
 old:=b.status; old_appointment:=b.appointment_at;
 if p_status is not null then
 if p_status<>b.status and not ((b.status='pending' and p_status in ('contacted','confirmed','declined','cancelled')) or (b.status='contacted' and p_status in ('confirmed','declined','cancelled')) or (b.status='confirmed' and p_status in ('cancelled','completed','no_show'))) then raise sqlstate 'PT400' using message='Invalid transition';end if;
 if p_status='confirmed' and p_appointment is null then raise sqlstate 'PT400' using message='Appointment time required';end if;
 if p_status not in ('pending','contacted','confirmed','declined','cancelled','completed','no_show') then raise sqlstate 'PT400' using message='Invalid status';end if;
 else if p_note is null then raise sqlstate 'PT400' using message='Empty update';end if;end if;
 update bookings set status=coalesce(p_status,status),appointment_at=case when p_status is null then appointment_at else p_appointment end,version=version+1,updated_at=now() where id=p_id returning * into b;
 insert into booking_events(booking_id,actor_id,kind,old_status,new_status,old_appointment_at,new_appointment_at,note) values(p_id,auth.uid(),case when p_status is null then 'note' else 'updated' end,old,b.status,old_appointment,b.appointment_at,p_note);
 return to_jsonb(b);
end$$;
revoke all on function public.update_booking(uuid,integer,text,timestamptz,text) from public,anon;grant execute on function public.update_booking(uuid,integer,text,timestamptz,text) to authenticated;
create function public.list_customers(p_branch text default null,p_q text default '',p_page integer default 1) returns table(customer_phone text,customer_name text,last_request_at timestamptz,booking_count bigint) language sql stable security invoker set search_path=public,pg_temp as $$
 select b.customer_phone,(array_agg(b.customer_name order by b.created_at desc))[1],max(b.created_at),count(*) from bookings b where (p_branch is null or b.branch_id=p_branch) and (b.customer_name ilike '%'||p_q||'%' or b.customer_phone ilike '%'||p_q||'%') group by b.customer_phone order by max(b.created_at) desc limit 51 offset (greatest(p_page,1)-1)*50
$$;
revoke all on function public.list_customers(text,text,integer) from public,anon;grant execute on function public.list_customers(text,text,integer) to authenticated;
