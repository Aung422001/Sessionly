-- Run as the project database owner against a dedicated demo database after migration/seed.
-- All fixtures and mutations are rolled back. Never use a real customer database.
begin;
insert into auth.users(id,email,email_confirmed_at,aud,role) values
 ('f0000000-0000-4000-8000-000000000001','sessionly-a@example.test',now(),'authenticated','authenticated'),
 ('f0000000-0000-4000-8000-000000000002','sessionly-b@example.test',now(),'authenticated','authenticated'),
 ('f0000000-0000-4000-8000-000000000003','sessionly-unverified@example.test',null,'authenticated','authenticated');
insert into public.hotels(id,city,city_name,country,name,description,photo,amenities,rating,timezone,check_in_time)
 values('security-fixture','bangkok','Bangkok','Thailand','Test property','Fictional test','https://images.unsplash.com/test',array['Wi-Fi'],4.5,'Asia/Bangkok','14:00');
insert into public.room_types values('security-fixture-double','security-fixture','Double',2,4000,500);
insert into public.room_inventory(room_id,night,total)
 select 'security-fixture-double',d::date,1 from generate_series(current_date+7,current_date+9,interval '1 day') d;
select public.save_rates(clock_timestamp(),'{"USD":"1","THB":"35","VND":"25000","KHR":"4000","MYR":"4.4","SGD":"1.3","IDR":"16000"}');

set local role anon;
do $$ begin
 begin
  perform public.confirm_booking(gen_random_uuid(),'security-fixture-double',current_date+7,current_date+10,2,'USD','{}','Test Guest','test@example.test');
  raise exception 'Anonymous booking unexpectedly allowed';
 exception when insufficient_privilege then null; end;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub','f0000000-0000-4000-8000-000000000001',true);
do $$ declare q jsonb; reviewed jsonb; bid uuid; request uuid:=gen_random_uuid(); replay uuid; begin
 q:=public.stay_quote('security-fixture-double',current_date+7,current_date+10,2,'THB');
 assert q->>'subtotal'='4200.00','THB subtotal mismatch';
 assert q->>'fee'='175.00','THB fee mismatch';
 assert q->>'total'='4375.00','THB total mismatch';
 assert (q->>'deadline')::timestamptz=((current_date+7+time '14:00') at time zone 'Asia/Bangkok'),'Deadline timezone mismatch';
 reviewed:=jsonb_build_object('currency',q->'currency','total',q->'total','rate',q->'rate','rate_id',q->'rate_id');
 begin
  perform public.confirm_booking(request,'security-fixture-double',current_date+7,current_date+10,2,'THB',reviewed||'{"total":"1"}','Test Guest','test@example.test');
  raise exception 'Tampered total accepted';
 exception when raise_exception then if sqlerrm<>'QUOTE_CHANGED' then raise; end if; end;
 bid:=public.confirm_booking(request,'security-fixture-double',current_date+7,current_date+10,2,'THB',reviewed,'Test Guest','test@example.test');
 replay:=public.confirm_booking(request,'security-fixture-double',current_date+7,current_date+10,2,'THB',reviewed,'Test Guest','test@example.test');
 assert bid=replay,'Retry created another booking';
 assert (select count(*)=1 from public.booking_notifications where booking_id=bid),'Retry created duplicate event';
 perform set_config('test.booking',bid::text,true);
 begin
  perform public.confirm_booking(request,'security-fixture-double',current_date+7,current_date+10,2,'THB',reviewed,'Different Guest','test@example.test');
  raise exception 'Conflicting retry accepted';
 exception when raise_exception then if sqlerrm<>'REQUEST_CONFLICT' then raise; end if; end;
 begin
  perform public.confirm_booking(gen_random_uuid(),'security-fixture-double',current_date+7,current_date+10,2,'THB',reviewed,'Test Guest','test@example.test');
  raise exception 'Last room overbooked';
 exception when raise_exception then if sqlerrm<>'ROOM_UNAVAILABLE' then raise; end if; end;
 begin
  update public.bookings set status='cancelled' where id=bid;
  raise exception 'Direct status mutation allowed';
 exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claim.sub','f0000000-0000-4000-8000-000000000002',true);
do $$ begin
 assert (select count(*)=0 from public.bookings where id=current_setting('test.booking')::uuid),'Another customer can read a booking';
 begin
  perform public.cancel_booking(current_setting('test.booking')::uuid);
  raise exception 'Another customer cancelled a booking';
 exception when raise_exception then if sqlerrm<>'BOOKING_NOT_FOUND' then raise; end if; end;
end $$;

select set_config('request.jwt.claim.sub','f0000000-0000-4000-8000-000000000001',true);
do $$ begin
 perform public.cancel_booking(current_setting('test.booking')::uuid);
 perform public.cancel_booking(current_setting('test.booking')::uuid);
 assert (select count(*)=2 from public.booking_notifications where booking_id=current_setting('test.booking')::uuid),'Cancellation event duplicated';
 assert (public.stay_quote('security-fixture-double',current_date+7,current_date+10,2,'USD')->>'available')::boolean,'Inventory not restored';
end $$;

select set_config('request.jwt.claim.sub','f0000000-0000-4000-8000-000000000003',true);
do $$ begin
 begin
  perform public.confirm_booking(gen_random_uuid(),'security-fixture-double',current_date+7,current_date+10,2,'USD','{}','Test Guest','test@example.test');
  raise exception 'Unverified email booked';
 exception when raise_exception then if sqlerrm<>'VERIFY_EMAIL_REQUIRED' then raise; end if; end;
end $$;

reset role;
do $$ begin
 assert (select bool_and(reserved=0) from public.room_inventory where room_id='security-fixture-double'),'Inventory was restored more or less than once';
 assert (select bool_and(recipient='sessionly-a@example.test') from public.booking_notifications where owner_id='f0000000-0000-4000-8000-000000000001'),'Unverified contact email received transactional event';
end $$;
rollback;
