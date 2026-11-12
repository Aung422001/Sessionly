begin;

create table public.hotels (
 id text primary key, city text not null, city_name text not null, country text not null,
 name text not null, description text not null, photo text not null, amenities text[] not null,
 rating numeric(2,1) not null check(rating between 0 and 5),
 timezone text not null, check_in_time time not null default '14:00'
);
create table public.room_types (
 id text primary key, hotel_id text not null references public.hotels(id), name text not null,
 capacity integer not null check(capacity between 1 and 3),
 nightly_cents bigint not null check(nightly_cents between 1 and 10000000),
 fee_cents bigint not null check(fee_cents between 0 and 10000000)
);
create table public.room_inventory (
 room_id text not null references public.room_types(id), night date not null,
 total integer not null check(total >= 0), reserved integer not null default 0,
 primary key(room_id,night), check(reserved >= 0 and reserved <= total)
);
create table public.exchange_rate_sets (
 id uuid primary key default gen_random_uuid(), source_at timestamptz not null unique,
 fetched_at timestamptz not null default clock_timestamp(), rates jsonb not null
);
create table public.bookings (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 request_id uuid not null, fingerprint jsonb not null, room_id text not null references public.room_types(id),
 status text not null default 'confirmed' check(status in ('confirmed','cancelled')),
 check_in date not null, check_out date not null, guests integer not null check(guests between 1 and 3),
 contact_name text not null check(length(contact_name) between 2 and 100),
 contact_email text not null check(length(contact_email) between 3 and 254),
 quote jsonb not null, snapshot jsonb not null, deadline timestamptz not null,
 created_at timestamptz not null default clock_timestamp(), cancelled_at timestamptz,
 unique(owner_id,request_id), check(check_out > check_in and check_out - check_in <= 30)
);
create index bookings_owner_created on public.bookings(owner_id,created_at desc);
create table public.booking_notifications (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id),
 owner_id uuid not null references auth.users(id), kind text not null check(kind in ('booking','cancellation')),
 recipient text not null, payload jsonb not null,
 status text not null default 'pending' check(status in ('pending','sending','sent','failed','attention')),
 attempts integer not null default 0 check(attempts >= 0), first_attempt timestamptz,
 lease_id uuid, lease_until timestamptz, next_attempt timestamptz not null default clock_timestamp(),
 unique(booking_id,kind)
);
create index notification_due on public.booking_notifications(next_attempt) where status in ('pending','failed','sending');

alter table public.hotels enable row level security;
alter table public.room_types enable row level security;
alter table public.room_inventory enable row level security;
alter table public.exchange_rate_sets enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_notifications enable row level security;
revoke all on public.hotels,public.room_types,public.room_inventory,public.exchange_rate_sets,public.bookings,public.booking_notifications from anon,authenticated;
grant select on public.hotels,public.room_types to anon,authenticated;
grant select on public.bookings to authenticated;
grant select(id,booking_id,kind,status,owner_id) on public.booking_notifications to authenticated;
grant all on public.hotels,public.room_types,public.room_inventory,public.exchange_rate_sets,public.bookings,public.booking_notifications to service_role;
create policy public_hotels on public.hotels for select to anon,authenticated using(true);
create policy public_rooms on public.room_types for select to anon,authenticated using(true);
create policy own_bookings on public.bookings for select to authenticated using(owner_id = (select auth.uid()));
create policy own_notifications on public.booking_notifications for select to authenticated using(owner_id = (select auth.uid()));

create function public.stay_quote(p_room text,p_in date,p_out date,p_guests integer,p_currency text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 r public.room_types; h public.hotels; fx public.exchange_rate_sets;
 code text := p_currency; rate numeric := 1; precision integer; n integer;
 subtotal numeric; fee numeric; nightly numeric; deadline timestamptz; available boolean;
begin
 select * into r from public.room_types where id=p_room;
 if not found then raise exception 'ROOM_NOT_FOUND'; end if;
 select * into strict h from public.hotels where id=r.hotel_id;
 n := p_out-p_in;
 deadline := (p_in+h.check_in_time) at time zone h.timezone;
 if p_in is null or p_out is null or n not between 1 and 30 or p_guests is null
  or p_guests < 1 or p_guests > r.capacity or p_in < (clock_timestamp() at time zone h.timezone)::date
  or deadline <= clock_timestamp() then raise exception 'INVALID_STAY'; end if;
 if code is null or code not in ('USD','THB','VND','KHR','MYR','SGD','IDR') then raise exception 'INVALID_CURRENCY'; end if;
 if code <> 'USD' then
  select * into fx from public.exchange_rate_sets order by source_at desc limit 1;
  if not found then code := 'USD'; else rate := (fx.rates->>code)::numeric; end if;
 end if;
 precision := case when code='VND' then 0 else 2 end;
 nightly := round(r.nightly_cents::numeric/100*rate,precision);
 subtotal := round(r.nightly_cents::numeric*n/100*rate,precision);
 fee := round(r.fee_cents::numeric/100*rate,precision);
 select count(*)=n and coalesce(bool_and(total>reserved),false) into available
 from public.room_inventory where room_id=p_room and night>=p_in and night<p_out;
 return jsonb_build_object('room_id',r.id,'currency',code,'nights',n,'nightly',nightly::text,
  'subtotal',subtotal::text,'fee',fee::text,'total',(subtotal+fee)::text,
  'usd_total',((r.nightly_cents::numeric*n+r.fee_cents)/100)::text,
  'rate',rate::text,'rate_id',case when code='USD' then null else fx.id end,
  'rate_at',case when code='USD' then null else fx.source_at end,
  'fallback',case when code='USD' then p_currency<>'USD' else fx.source_at<clock_timestamp()-interval '24 hours' or fx.fetched_at<clock_timestamp()-interval '24 hours' end,
  'available',available,'deadline',deadline,'timezone',h.timezone);
end $$;
revoke all on function public.stay_quote(text,date,date,integer,text) from public;
grant execute on function public.stay_quote(text,date,date,integer,text) to anon,authenticated;

create function public.confirm_booking(p_request uuid,p_room text,p_in date,p_out date,p_guests integer,
 p_currency text,p_reviewed jsonb,p_name text,p_email text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
 uid uuid := auth.uid(); verified_email text; previous public.bookings; r public.room_types;
 h public.hotels; q jsonb; fingerprint jsonb; bid uuid; saved jsonb;
begin
 if uid is null then raise exception 'SIGN_IN_REQUIRED'; end if;
 select email into verified_email from auth.users where id=uid and email_confirmed_at is not null;
 if verified_email is null then raise exception 'VERIFY_EMAIL_REQUIRED'; end if;
 if p_request is null or p_name is null or length(btrim(p_name)) not between 2 and 100
  or p_email is null or length(p_email)>254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  then raise exception 'INVALID_CONTACT'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 fingerprint := jsonb_build_object('room',p_room,'in',p_in,'out',p_out,'guests',p_guests,
  'currency',p_currency,'reviewed',p_reviewed,'name',btrim(p_name),'email',lower(btrim(p_email)));
 select * into previous from public.bookings where owner_id=uid and request_id=p_request;
 if found then
  if previous.fingerprint is distinct from fingerprint then raise exception 'REQUEST_CONFLICT'; end if;
  return previous.id;
 end if;
 if (select count(*) from public.bookings where owner_id=uid and created_at>clock_timestamp()-interval '10 minutes')>=10
 then raise exception 'TOO_MANY_BOOKINGS'; end if;
 select * into r from public.room_types where id=p_room for share;
 if not found then raise exception 'ROOM_NOT_FOUND'; end if;
 select * into strict h from public.hotels where id=r.hotel_id for share;
 perform 1 from public.room_inventory where room_id=p_room and night>=p_in and night<p_out order by night for update;
 q := public.stay_quote(p_room,p_in,p_out,p_guests,p_currency);
 if not (q->>'available')::boolean then raise exception 'ROOM_UNAVAILABLE'; end if;
 if p_reviewed is null or p_reviewed is distinct from
  jsonb_build_object('currency',q->'currency','total',q->'total','rate',q->'rate','rate_id',q->'rate_id')
  then raise exception 'QUOTE_CHANGED'; end if;
 saved := jsonb_build_object('hotel',h.name,'room',r.name,'city',h.city_name,'photo',h.photo,'timezone',h.timezone,
  'terms','Free cancellation strictly before '||to_char(p_in+h.check_in_time,'YYYY-MM-DD HH24:MI')||' ('||h.timezone||'). Date changes require cancellation and rebooking.');
 insert into public.bookings(owner_id,request_id,fingerprint,room_id,check_in,check_out,guests,
  contact_name,contact_email,quote,snapshot,deadline)
 values(uid,p_request,fingerprint,p_room,p_in,p_out,p_guests,btrim(p_name),lower(btrim(p_email)),q,saved,(q->>'deadline')::timestamptz)
 returning id into bid;
 update public.room_inventory set reserved=reserved+1 where room_id=p_room and night>=p_in and night<p_out;
 insert into public.booking_notifications(booking_id,owner_id,kind,recipient,payload)
 values(bid,uid,'booking',verified_email,jsonb_build_object('reference',bid,'snapshot',saved,'quote',q,'check_in',p_in,'check_out',p_out,'guests',p_guests));
 return bid;
end $$;
revoke all on function public.confirm_booking(uuid,text,date,date,integer,text,jsonb,text,text) from public;
grant execute on function public.confirm_booking(uuid,text,date,date,integer,text,jsonb,text,text) to authenticated;

create function public.cancel_booking(p_booking uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare b public.bookings; recipient text;
begin
 if auth.uid() is null then raise exception 'SIGN_IN_REQUIRED'; end if;
 select * into b from public.bookings where id=p_booking and owner_id=auth.uid() for update;
 if not found then raise exception 'BOOKING_NOT_FOUND'; end if;
 if b.status='cancelled' then return b.id; end if;
 if clock_timestamp()>=b.deadline then raise exception 'CANCELLATION_CLOSED'; end if;
 select email into recipient from auth.users where id=auth.uid() and email_confirmed_at is not null;
 if recipient is null then raise exception 'VERIFY_EMAIL_REQUIRED'; end if;
 perform 1 from public.room_inventory where room_id=b.room_id and night>=b.check_in and night<b.check_out order by night for update;
 update public.room_inventory set reserved=reserved-1 where room_id=b.room_id and night>=b.check_in and night<b.check_out;
 update public.bookings set status='cancelled',cancelled_at=clock_timestamp() where id=b.id;
 insert into public.booking_notifications(booking_id,owner_id,kind,recipient,payload)
 values(b.id,b.owner_id,'cancellation',recipient,jsonb_build_object('reference',b.id,'snapshot',b.snapshot,'quote',b.quote,'check_in',b.check_in,'check_out',b.check_out,'guests',b.guests));
 return b.id;
end $$;
revoke all on function public.cancel_booking(uuid) from public;
grant execute on function public.cancel_booking(uuid) to authenticated;

create function public.save_rates(p_at timestamptz,p_rates jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare code text; value numeric;
begin
 if p_at is null or p_at>clock_timestamp()+interval '5 minutes' or p_at<clock_timestamp()-interval '7 days'
  or p_rates is null or jsonb_typeof(p_rates)<>'object' then raise exception 'INVALID_RATES'; end if;
 foreach code in array array['USD','THB','VND','KHR','MYR','SGD','IDR'] loop
  if not (p_rates ? code) or (p_rates->>code) !~ '^[0-9]+(\.[0-9]+)?$' then raise exception 'INVALID_RATES'; end if;
  value := (p_rates->>code)::numeric;
  if value<=0 or value>100000000 or (code='USD' and value<>1) then raise exception 'INVALID_RATES'; end if;
 end loop;
 perform pg_advisory_xact_lock(hashtextextended('sessionly-rates',0));
 if exists(select 1 from public.exchange_rate_sets where source_at>p_at) then raise exception 'OLD_RATES'; end if;
 insert into public.exchange_rate_sets(source_at,rates) values(p_at,p_rates)
 on conflict(source_at) do update set fetched_at=clock_timestamp()
 where public.exchange_rate_sets.rates=excluded.rates;
end $$;
revoke all on function public.save_rates(timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.save_rates(timestamptz,jsonb) to service_role;

create function public.claim_notification()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e public.booking_notifications; lease uuid := gen_random_uuid();
begin
 update public.booking_notifications set status='attention'
 where status in ('failed','sending') and first_attempt<clock_timestamp()-interval '23 hours';
 select * into e from public.booking_notifications
 where (status in ('pending','failed') and next_attempt<=clock_timestamp())
 or (status='sending' and lease_until<clock_timestamp())
 order by next_attempt for update skip locked limit 1;
 if not found then return null; end if;
 update public.booking_notifications set status='sending',lease_id=lease,
  lease_until=clock_timestamp()+interval '5 minutes',first_attempt=coalesce(first_attempt,clock_timestamp()),attempts=attempts+1
 where id=e.id;
 return jsonb_build_object('id',e.id,'lease',lease,'kind',e.kind,'recipient',e.recipient,'payload',e.payload);
end $$;
revoke all on function public.claim_notification() from public,anon,authenticated;
grant execute on function public.claim_notification() to service_role;

create function public.finish_notification(p_id uuid,p_lease uuid,p_result text)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if p_result not in ('sent','failed','attention') then raise exception 'INVALID_DELIVERY_RESULT'; end if;
 update public.booking_notifications set status=p_result,lease_until=null,
  next_attempt=clock_timestamp()+make_interval(secs=>least(3600,60*power(2,least(attempts,6)))::integer)
 where id=p_id and lease_id=p_lease and status='sending';
end $$;
revoke all on function public.finish_notification(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.finish_notification(uuid,uuid,text) to service_role;

commit;
