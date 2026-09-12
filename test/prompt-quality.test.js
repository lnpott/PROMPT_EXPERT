import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';

test('quality evaluation passes every versioned briefing and profile', () => {
  const output = execFileSync(process.execPath, ['scripts/evaluate-prompts.js'], { encoding: 'utf8' });
  const report = JSON.parse(output);

  assert.equal(report.cases, 192);
  assert.equal(report.passed, 192);
  assert.equal(report.failed, 0);
  assert.equal(report.methodologyCases, 24);
  assert.equal(report.methodologyPassed, 24);
  assert.equal(report.methodologyFailed, 0);
});
