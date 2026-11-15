-- Adds 4 guideline questions (g01-g04) to the eval set.
-- Run AFTER seed_guideline_docs.sql. Safe to re-run.

insert into public.eval_questions
  (external_id, question, category, should_refuse, expected_reason, expected_source_ids)
values
  ('g01', 'What exercises do Indian guidelines recommend for knee arthritis?', 'guideline', false, null, coalesce((select array_agg(d.id order by d.id) from public.documents d where d.title = any(array['Knee osteoarthritis: what Indian guidelines recommend at home']::text[])), '{}')),
  ('g02', 'I have hip arthritis. Should I avoid sitting cross-legged?', 'guideline', false, null, coalesce((select array_agg(d.id order by d.id) from public.documents d where d.title = any(array['Hip osteoarthritis: what Indian guidelines recommend at home']::text[])), '{}')),
  ('g03', 'My back pain is not getting better. After how many weeks should I see a doctor?', 'guideline', false, null, coalesce((select array_agg(d.id order by d.id) from public.documents d where d.title = any(array['Lower back pain: what Indian guidelines recommend at home']::text[])), '{}')),
  ('g04', 'Can I start neck strengthening exercises while the neck pain is fresh and severe?', 'guideline', false, null, coalesce((select array_agg(d.id order by d.id) from public.documents d where d.title = any(array['Neck pain: what Indian guidelines recommend at home']::text[])), '{}'))
on conflict (external_id) do update set
  question = excluded.question, category = excluded.category,
  should_refuse = excluded.should_refuse, expected_reason = excluded.expected_reason,
  expected_source_ids = excluded.expected_source_ids;

-- Every row should show a non-empty expected_source_ids
select external_id, expected_source_ids from public.eval_questions where external_id like 'g%' order by external_id;
