import localCorpus from '../docs/methodology-corpus-v1.json' with { type: 'json' };
import { createHash } from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pqprtkdvzyhqlidlcpxg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Q6fk9upY99j9Lsak222YPA_Cz-VGaZI';
let cachedRelease = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

function validCorpus(payload) {
  return payload && typeof payload.corpusVersion === 'string'
    && Array.isArray(payload.sources) && Array.isArray(payload.targets)
    && Array.isArray(payload.generalRules) && Array.isArray(payload.specificTargets)
    && Array.isArray(payload.examples) && Array.isArray(payload.statusVocabulary)
    && Array.isArray(payload.runtimePolicy?.allowedStatuses) && payload.runtimePolicy.allowedStatuses.length > 0
    && Array.isArray(payload.runtimePolicy?.precedence) && payload.runtimePolicy.precedence.length > 0
    && Number.isInteger(payload.runtimePolicy?.examples?.maximum)
    && Number.isInteger(payload.runtimePolicy?.examples?.maximumCharacters);
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

export async function loadCanonicalMethodology({ fetchImpl = fetch, allowLocalFallback = true } = {}) {
  if (cachedRelease && Date.now() - cachedRelease.cachedAt < CACHE_TTL_MS) return cachedRelease;
  try {
    const response = await fetchImpl(`${SUPABASE_URL}/rest/v1/methodology_releases?status=eq.active&select=version,payload,content_sha256&order=published_at.desc&limit=1`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
      signal: AbortSignal.timeout(1500),
    });
    if (!response.ok) throw new Error('canonical_release_unavailable');
    const [release] = await response.json();
    if (!release || !validCorpus(release.payload)) throw new Error('canonical_release_invalid');
    const checksum = createHash('sha256').update(canonicalJson(release.payload)).digest('hex');
    if (checksum !== release.content_sha256) throw new Error('canonical_release_checksum_mismatch');
    cachedRelease = { corpus: release.payload, origin: 'supabase', version: release.version, checksum: release.content_sha256, cachedAt: Date.now() };
    return cachedRelease;
  } catch (error) {
    if (!allowLocalFallback) throw error;
    const checksum = createHash('sha256').update(canonicalJson(localCorpus)).digest('hex');
    return { corpus: localCorpus, origin: 'versioned-safe-fallback', version: localCorpus.corpusVersion, checksum, cachedAt: Date.now() };
  }
}

export function clearCanonicalMethodologyCache() { cachedRelease = null; }
