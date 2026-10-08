/**
 * Tests for the pure layout math. Run with: node test/layout.test.js
 * No Google Docs needed, this is just the row-packing algorithm.
 */
const assert = require('assert');
const { packRows, clampAspect } = require('../src/layout.js');

const W = 468; // typical usable width on US Letter with 1in margins (points)
let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('  ok  ' + name);
}

// every full (stretched) row should fill the width: sum of widths + gaps ~= W
function rowFillsWidth(row, gap) {
  const widths = row.items.reduce((s, it) => s + it.width, 0);
  const gaps = gap * (row.items.length - 1);
  return Math.abs(widths + gaps - W) < 1.0; // within a point
}

test('empty input gives no rows', () => {
  assert.deepStrictEqual(packRows([], { usableWidth: W, targetHeight: 180, gap: 6 }), []);
});

test('a single image makes one row at the target height', () => {
  const rows = packRows([1.5], { usableWidth: W, targetHeight: 180, gap: 6 });
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].items.length, 1);
  // last/only row is not stretched, so it sits at the target height
  assert.ok(Math.abs(rows[0].height - 180) < 1);
});

test('full rows fill the page width exactly', () => {
  // 12 landscape-ish images, several rows, all but the last should fill width
  const aspects = Array.from({ length: 12 }, (_, i) => 1.3 + (i % 3) * 0.3);
  const gap = 6;
  const rows = packRows(aspects, { usableWidth: W, targetHeight: 150, gap });
  assert.ok(rows.length >= 3, 'should break into multiple rows');
  // every row except possibly the last is stretched to fill the width
  for (let r = 0; r < rows.length - 1; r++) {
    assert.ok(rowFillsWidth(rows[r], gap), 'row ' + r + ' should fill width');
  }
});

test('row heights stay near the target (not wild)', () => {
  const aspects = Array.from({ length: 20 }, (_, i) => 1.0 + (i % 5) * 0.4);
  const rows = packRows(aspects, { usableWidth: W, targetHeight: 160, gap: 6, maxHeight: 240 });
  for (const row of rows) {
    assert.ok(row.height > 60 && row.height <= 240, 'height in range: ' + row.height);
  }
});

test('every image appears exactly once, in order', () => {
  const aspects = [1.5, 0.7, 2.2, 1.0, 1.8, 0.9, 1.3];
  const rows = packRows(aspects, { usableWidth: W, targetHeight: 150, gap: 6 });
  const indices = [];
  rows.forEach((row) => row.items.forEach((it) => indices.push(it.index)));
  assert.deepStrictEqual(indices, aspects.map((_, i) => i));
});

test('aspect ratios keep each image undistorted', () => {
  const aspects = [1.5, 0.7, 2.0];
  const rows = packRows(aspects, { usableWidth: W, targetHeight: 150, gap: 6 });
  rows.forEach((row) => row.items.forEach((it) => {
    const ratio = it.width / it.height;
    const original = clampAspect(aspects[it.index]);
    assert.ok(Math.abs(ratio - original) < 0.02, 'ratio preserved for ' + it.index);
  }));
});

test('an ultra-wide image is clamped so the row still works', () => {
  const rows = packRows([50, 1.0, 1.0], { usableWidth: W, targetHeight: 150, gap: 6, maxHeight: 220 });
  rows.forEach((row) => assert.ok(row.height <= 220 && row.height > 0));
});

console.log('\n' + passed + ' tests passed');
