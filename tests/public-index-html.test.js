'use strict';

/**
 * Tests for the public/index.html change in this PR: swapping the
 * client-side Vercel Web Analytics `inject()` ES module import for the
 * Vercel-hosted `/_vercel/insights/script.js` script tag.
 */

const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indexHtmlPath = path.join(__dirname, '..', 'public', 'index.html');

describe('public/index.html Vercel Web Analytics script', () => {
  let content;

  before(() => {
    content = fs.readFileSync(indexHtmlPath, 'utf8');
  });

  test('uses the Vercel-hosted insights script tag under the Web Analytics comment', () => {
    const match = content.match(/<!-- Vercel Web Analytics -->\s*\n\s*(<script[\s\S]*?<\/script>)/);
    assert.ok(match, 'expected a <script> tag immediately following the Vercel Web Analytics comment');
    assert.equal(match[1].trim(), '<script defer src="/_vercel/insights/script.js"></script>');
  });

  test('loads the insights script with the defer attribute', () => {
    assert.match(content, /<script\s+defer\s+src="\/_vercel\/insights\/script\.js"><\/script>/);
  });

  test('does not use an ES module import for @vercel/analytics anymore', () => {
    assert.ok(!content.includes('type="module"'), 'no <script type="module"> tags should remain');
    assert.ok(!content.includes("import { inject }"), 'the inject() module import should be removed');
    assert.ok(!content.includes('inject();'), 'the inject() call should be removed');
  });

  test('does not reference the jsdelivr CDN for @vercel/analytics', () => {
    assert.ok(
      !content.includes('cdn.jsdelivr.net/npm/@vercel/analytics'),
      'the jsdelivr ESM CDN URL should no longer be present'
    );
  });

  test('keeps the Vercel Speed Insights script untouched alongside the analytics change', () => {
    assert.match(content, /<script defer src="\/_vercel\/speed-insights\/script\.js"><\/script>/);
  });

  test('contains exactly the expected number of <script> tags (no leftover duplicate injectors)', () => {
    const scriptOpenTags = content.match(/<script[\s>]/g) || [];
    // Speed Insights, Web Analytics, and the inline chat application script.
    assert.equal(scriptOpenTags.length, 3);
  });
});