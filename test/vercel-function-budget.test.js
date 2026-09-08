import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

function javascriptFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? javascriptFiles(path) : path.endsWith('.js') ? [path] : [];
  });
}

test('Vercel Hobby deployment stays within twelve serverless functions', () => {
  const functions = javascriptFiles('api');
  assert.equal(functions.length, 12);
  for (const helper of [
    'server/credential-service.js',
    'server/knowledge-base.js',
    'server/security/credential-crypto.js',
    'server/security/supabase-user.js',
  ]) assert.ok(readFileSync(helper, 'utf8').length > 0);
});
