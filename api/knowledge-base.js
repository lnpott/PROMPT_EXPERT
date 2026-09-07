const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pqprtkdvzyhqlidlcpxg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Q6fk9upY99j9Lsak222YPA_Cz-VGaZI';

const headers = {
  apikey: SUPABASE_PUBLISHABLE_KEY,
  Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
};

export async function getModelKnowledge(slug) {
  const profileResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/model_profiles?slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&select=id,display_name,description,system_guidance,output_contract`,
    { headers },
  );

  if (!profileResponse.ok) throw new Error('Não foi possível carregar o perfil do modelo.');

  const [profile] = await profileResponse.json();
  if (!profile) return null;

  const rulesResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/prompt_rules?model_profile_id=eq.${profile.id}&is_active=eq.true&select=rule_text,priority&order=priority.asc`,
    { headers },
  );

  if (!rulesResponse.ok) throw new Error('Não foi possível carregar as regras do modelo.');

  return { profile, rules: await rulesResponse.json() };
}

export const getGrokKnowledge = () => getModelKnowledge('grok');

export async function getReviewedEvidenceSources() {
  const evidenceResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/evidence_sources?select=slug,title,organization,domain,authority_class,source_kind,canonical_url,repository_path,validation_status,reviewed_on,review_notes&order=organization.asc,title.asc`,
    { headers },
  );

  if (!evidenceResponse.ok) throw new Error('Não foi possível carregar a proveniência das regras.');
  return evidenceResponse.json();
}

export async function getActiveApiProviders() {
  const providersResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/api_providers?is_active=eq.true&select=slug,display_name,category,signup_url,api_key_url,docs_url,key_prefix_hint,supports_generation,supports_model_listing,is_active,sort_order&order=sort_order.asc`,
    { headers },
  );

  if (!providersResponse.ok) throw new Error('Não foi possível carregar o catálogo de provedores.');
  return providersResponse.json();
}
