import localCorpus from '../docs/methodology-corpus-v1.json' with { type: 'json' };
import { createHash } from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pqprtkdvzyhqlidlcpxg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Q6fk9upY99j9Lsak222YPA_Cz-VGaZI';
let cachedRelease = null;

function validCorpus(payload) {
  return payload && Array.isArray(payload.sources) && Array.isArray(payload.targets)
    && Array.isArray(payload.generalRules) && Array.isArray(payload.specificTargets)
    && payload.runtimePolicy?.allowedStatuses?.length > 0;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

export async function loadCanonicalMethodology({ fetchImpl = fetch, allowLocalFallback = true } = {}) {
  if (cachedRelease) return cachedRelease;
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
    cachedRelease = { corpus: release.payload, origin: 'supabase', version: release.version, checksum: release.content_sha256 };
    return cachedRelease;
  } catch (error) {
    if (!allowLocalFallback) throw error;
    cachedRelease = { corpus: localCorpus, origin: 'versioned-safe-fallback', version: localCorpus.corpusVersion, checksum: null };
    return cachedRelease;
  }
}

export function clearCanonicalMethodologyCache() { cachedRelease = null; }
