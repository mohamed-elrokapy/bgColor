// Pure colour helpers. No DOM access, so they can be unit tested with `node --test`.

/** Accepts "#abc", "abc", "#aabbcc" or "AABBCC". Returns "#aabbcc" or null. */
function normalizeHex(input) {
  if (typeof input !== "string") return null;
  let value = input.trim().replace(/^#/, "").toLowerCase();
  if (!/^[0-9a-f]+$/.test(value)) return null;
  if (value.length === 3) {
    value = value
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return value.length === 6 ? "#" + value : null;
}

function hexToRgb(hex) {
  const n = normalizeHex(hex);
  if (!n) return null;
  return [1, 3, 5].map((i) => parseInt(n.slice(i, i + 2), 16));
}

/** WCAG 2.x relative luminance, 0 (black) to 1 (white). */
function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colours, 1 to 21. */
function contrastRatio(hexA, hexB) {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  if (a === null || b === null) return null;
  const [hi, lo] = a >= b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** Black or white, whichever has the higher contrast against the background. */
function readableTextColor(backgroundHex) {
  const onWhite = contrastRatio(backgroundHex, "#ffffff");
  const onBlack = contrastRatio(backgroundHex, "#000000");
  return onBlack >= onWhite ? "#000000" : "#ffffff";
}

/** Returns a new history array: colour moved to the front, no duplicates, capped. */
function pushHistory(history, hex, max = 8) {
  const n = normalizeHex(hex);
  if (!n) return history.slice(0, max);
  return [n, ...history.filter((h) => h !== n)].slice(0, max);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    normalizeHex,
    hexToRgb,
    relativeLuminance,
    contrastRatio,
    readableTextColor,
    pushHistory,
  };
}
