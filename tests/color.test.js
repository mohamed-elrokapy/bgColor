const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeHex,
  contrastRatio,
  readableTextColor,
  pushHistory,
} = require("../color.js");

test("normalizeHex accepts short, long, prefixed and upper-case forms", () => {
  assert.equal(normalizeHex("#ABC"), "#aabbcc");
  assert.equal(normalizeHex("ff0000"), "#ff0000");
  assert.equal(normalizeHex("  #00FF7f "), "#00ff7f");
});

test("normalizeHex rejects invalid input", () => {
  for (const bad of ["", "#12", "#12345", "#1234567", "xyz", "#ggg", null, 42]) {
    assert.equal(normalizeHex(bad), null, String(bad));
  }
});

test("contrastRatio matches the WCAG reference values", () => {
  assert.equal(contrastRatio("#000000", "#ffffff").toFixed(2), "21.00");
  assert.equal(contrastRatio("#777777", "#777777").toFixed(2), "1.00");
  // #767676 on white is the well known 4.54:1 boundary for AA text.
  assert.equal(contrastRatio("#767676", "#ffffff").toFixed(2), "4.54");
});

test("readableTextColor picks the higher-contrast text colour", () => {
  assert.equal(readableTextColor("#ffffff"), "#000000");
  assert.equal(readableTextColor("#000000"), "#ffffff");
  assert.equal(readableTextColor("#ffff00"), "#000000");
  assert.equal(readableTextColor("#0000ff"), "#ffffff");
  // Mid grey: black wins (5.3:1) over white (3.9:1).
  assert.equal(readableTextColor("#808080"), "#000000");
});

test("pushHistory moves repeats to the front, dedupes and caps the list", () => {
  assert.deepEqual(pushHistory(["#111111", "#222222"], "#222222"), [
    "#222222",
    "#111111",
  ]);
  const full = Array.from({ length: 8 }, (_, i) => "#00000" + i);
  const next = pushHistory(full, "#ffffff");
  assert.equal(next.length, 8);
  assert.equal(next[0], "#ffffff");
  assert.ok(!next.includes("#000007"));
  assert.deepEqual(pushHistory(["#111111"], "nope"), ["#111111"]);
});
