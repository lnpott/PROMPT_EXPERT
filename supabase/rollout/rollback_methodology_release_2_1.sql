-- Manual, reviewed rollback for release 2.1.0. DO NOT run through db push.
-- Restores both the active immutable payload and its global normalized projection.
begin;

do $$
declare
  p jsonb := (select payload from public.methodology_releases where version = '2.0.0');
  t jsonb;
  r jsonb;
  e jsonb;
  task text;
begin
  if p is null then raise exception 'methodology release 2.0.0 is unavailable'; end if;

  -- Applicability is a current projection, so rebuild it from the rollback payload.
  delete from public.methodology_rule_applicability;

  for r in
    select * from jsonb_array_elements(
      (p->'generalRules') ||
      (select coalesce(jsonb_agg(x), '[]') from jsonb_array_elements(p->'targets') a cross join lateral jsonb_array_elements(a->'rules') x)
    )
  loop
    insert into public.methodology_rules(rule_id,rule_text,rule_type,provenance,confidence,source_id,evidence_reference,conflict_group,supersedes,priority,is_active,notes)
    values(r->>'id',r->>'text',r->>'ruleType',r->>'status',r->>'confidence',r->>'sourceId',r->>'evidenceReference',r->>'conflictGroup',r->>'supersedes',(r->>'priority')::smallint,(r->>'active')::boolean,r->>'notes')
    on conflict(rule_id) do update set rule_text=excluded.rule_text,rule_type=excluded.rule_type,provenance=excluded.provenance,confidence=excluded.confidence,source_id=excluded.source_id,evidence_reference=excluded.evidence_reference,conflict_group=excluded.conflict_group,supersedes=excluded.supersedes,priority=excluded.priority,is_active=excluded.is_active,notes=excluded.notes;
  end loop;

  for t in select * from jsonb_array_elements(p->'targets') loop
    for r in select * from jsonb_array_elements(t->'rules') loop
      for task in select jsonb_array_elements_text(coalesce(r->'taskTypes','["cited"]')) loop
        insert into public.methodology_rule_applicability(rule_id,target_slug,task_type,platform,inheritance_level)
        values(r->>'id',t->>'slug',task,'','family');
      end loop;
    end loop;
  end loop;
  for r in select * from jsonb_array_elements(p->'generalRules') loop
    for task in select jsonb_array_elements_text(r->'taskTypes') loop
      insert into public.methodology_rule_applicability(rule_id,target_slug,task_type,platform,inheritance_level)
      values(r->>'id','general',task,'','general');
    end loop;
  end loop;

  delete from public.methodology_examples;
  for e in select * from jsonb_array_elements(p->'examples') loop
    insert into public.methodology_examples(example_id,target_slug,task_type,structure_reference,source_id,provenance,is_active,notes)
    values(e->>'id',e->>'target',e->>'taskType','objective/context/delivery/acceptance-criteria',e->>'sourceId',e->>'status',(e->>'active')::boolean,'Restored from immutable release 2.0.0');
  end loop;

  delete from public.methodology_rules mr where not exists (
    select 1 from jsonb_array_elements(
      (p->'generalRules') ||
      (select coalesce(jsonb_agg(x), '[]') from jsonb_array_elements(p->'targets') a cross join lateral jsonb_array_elements(a->'rules') x)
    ) r where r->>'id' = mr.rule_id
  );
  delete from public.methodology_sources ms where not exists (
    select 1 from jsonb_array_elements(p->'sources') s where s->>'id' = ms.source_id
  );
end $$;

update public.methodology_releases set status='archived' where status='active';
update public.methodology_releases set status='active', published_at=now() where version='2.0.0';
commit;
