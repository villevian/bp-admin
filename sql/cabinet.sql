-- Student cabinet: current topic, homework, next lesson, private payment balance + lesson log.
-- Run once in Supabase (project "Business Partner") → SQL Editor → New query → paste → Run.
create table if not exists public.student_cabinet (
  slug text primary key references public.students(slug) on delete cascade,
  site_url text,
  current_lesson text,          -- e.g. "1.2 Events management"
  current_url text,
  homework text,                -- what to do, free text
  homework_url text,
  homework_due date,
  next_lesson timestamptz,
  schedule text,                -- e.g. "Wed, Fri 18:00"
  meet_url text,                -- Zoom / Meet link
  payment text not null default 'private',   -- private | company
  lessons_left integer,         -- only for private
  lesson_price text,            -- optional, e.g. "€25"
  note text,                    -- message to the student
  private_note text,            -- teacher only, never shown to the student
  updated_at timestamptz not null default now()
);
alter table public.student_cabinet enable row level security;
revoke all on public.student_cabinet from anon, authenticated;

create table if not exists public.lesson_log (
  id bigint generated always as identity primary key,
  slug text not null references public.students(slug) on delete cascade,
  kind text not null,           -- done | paid | adjust | missed
  delta integer not null default 0,
  note text,
  at timestamptz not null default now()
);
alter table public.lesson_log enable row level security;
revoke all on public.lesson_log from anon, authenticated;

-- ===== student =====
drop function if exists public.get_my_cabinet(text);
create function public.get_my_cabinet(p_code text)
returns table(name text, level text, current_lesson text, current_url text, homework text, homework_url text, homework_due date,
              next_lesson timestamptz, schedule text, meet_url text, payment text, lessons_left integer, note text, last_done timestamptz)
language sql security definer set search_path = public as $$
  select s.name, s.level, c.current_lesson, c.current_url, c.homework, c.homework_url, c.homework_due,
         c.next_lesson, c.schedule, c.meet_url, coalesce(c.payment,'private'), c.lessons_left, c.note,
         (select max(l.at) from public.lesson_log l where l.slug = s.slug and l.kind = 'done')
  from public.students s left join public.student_cabinet c on c.slug = s.slug
  where s.code = p_code;
$$;

-- ===== admin =====
drop function if exists public.admin_cabinets(text);
create function public.admin_cabinets(p_key text)
returns table(slug text, name text, level text, code text, site_url text, current_lesson text, current_url text, homework text, homework_url text,
              homework_due date, next_lesson timestamptz, schedule text, meet_url text, payment text, lessons_left integer, lesson_price text,
              note text, private_note text, updated_at timestamptz, last_done timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_key) then raise exception 'not allowed'; end if;
  return query select s.slug, s.name, s.level, s.code, c.site_url, c.current_lesson, c.current_url, c.homework, c.homework_url, c.homework_due,
    c.next_lesson, c.schedule, c.meet_url, coalesce(c.payment,'private'), c.lessons_left, c.lesson_price, c.note, c.private_note, c.updated_at,
    (select max(l.at) from public.lesson_log l where l.slug = s.slug and l.kind = 'done')
  from public.students s left join public.student_cabinet c on c.slug = s.slug order by s.name;
end $$;

create or replace function public.admin_cabinet_save(p_key text, p_slug text, p jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_key) then raise exception 'not allowed'; end if;
  insert into public.student_cabinet(slug) values (p_slug) on conflict (slug) do nothing;
  update public.student_cabinet set
    site_url       = case when p ? 'site_url'       then nullif(p->>'site_url','') else site_url end,
    current_lesson = case when p ? 'current_lesson' then nullif(p->>'current_lesson','') else current_lesson end,
    current_url    = case when p ? 'current_url'    then nullif(p->>'current_url','') else current_url end,
    homework       = case when p ? 'homework'       then nullif(p->>'homework','') else homework end,
    homework_url   = case when p ? 'homework_url'   then nullif(p->>'homework_url','') else homework_url end,
    homework_due   = case when p ? 'homework_due'   then nullif(p->>'homework_due','')::date else homework_due end,
    next_lesson    = case when p ? 'next_lesson'    then nullif(p->>'next_lesson','')::timestamptz else next_lesson end,
    schedule       = case when p ? 'schedule'       then nullif(p->>'schedule','') else schedule end,
    meet_url       = case when p ? 'meet_url'       then nullif(p->>'meet_url','') else meet_url end,
    payment        = case when p ? 'payment'        then coalesce(nullif(p->>'payment',''),'private') else payment end,
    lessons_left   = case when p ? 'lessons_left'   then nullif(p->>'lessons_left','')::int else lessons_left end,
    lesson_price   = case when p ? 'lesson_price'   then nullif(p->>'lesson_price','') else lesson_price end,
    note           = case when p ? 'note'           then nullif(p->>'note','') else note end,
    private_note   = case when p ? 'private_note'   then nullif(p->>'private_note','') else private_note end,
    updated_at = now()
  where slug = p_slug;
end $$;

-- lesson done (delta -1), payment (+N), correction (±N), missed (0, just logged)
create or replace function public.admin_lessons(p_key text, p_slug text, p_kind text, p_delta integer, p_note text)
returns integer language plpgsql security definer set search_path = public as $$
declare left_now integer;
begin
  if not public.is_admin(p_key) then raise exception 'not allowed'; end if;
  insert into public.student_cabinet(slug) values (p_slug) on conflict (slug) do nothing;
  update public.student_cabinet set lessons_left = coalesce(lessons_left,0) + coalesce(p_delta,0), updated_at = now()
  where slug = p_slug returning lessons_left into left_now;
  insert into public.lesson_log(slug, kind, delta, note) values (p_slug, p_kind, coalesce(p_delta,0), nullif(p_note,''));
  return left_now;
end $$;

create or replace function public.admin_log(p_key text, p_slug text)
returns table(id bigint, kind text, delta integer, note text, at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_key) then raise exception 'not allowed'; end if;
  return query select l.id, l.kind, l.delta, l.note, l.at from public.lesson_log l where l.slug = p_slug order by l.at desc limit 30;
end $$;

grant execute on function public.get_my_cabinet(text) to anon;
grant execute on function public.admin_cabinets(text) to anon;
grant execute on function public.admin_cabinet_save(text,text,jsonb) to anon;
grant execute on function public.admin_lessons(text,text,text,integer,text) to anon;
grant execute on function public.admin_log(text,text) to anon;
