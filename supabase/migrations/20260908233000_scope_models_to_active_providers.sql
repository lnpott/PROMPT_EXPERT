-- A model is public only while both it and its parent provider are public.
-- This follow-up narrows the Step 15.5 policy; it does not alter catalog data.
drop policy "public can read active ai models" on public.ai_models;

create policy "public can read active ai models"
on public.ai_models for select to anon, authenticated
using (
  is_active = true
  and is_public = true
  and is_deprecated = false
  and exists (
    select 1
    from public.api_providers
    where api_providers.id = ai_models.provider_id
      and api_providers.is_active = true
  )
);
