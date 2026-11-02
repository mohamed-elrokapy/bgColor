(function () {
  const PRESETS = [
    { name: "Red", hex: "#ff0000" },
    { name: "Blue", hex: "#0000ff" },
    { name: "Green", hex: "#008000" },
    { name: "Black", hex: "#000000" },
    { name: "Gray", hex: "#808080" },
  ];
  const STORAGE_KEY = "bgcolor:v1";
  const MAX_HISTORY = 8;

  const root = document.documentElement;
  const hexValue = document.querySelector("#hex-value");
  const contrastNote = document.querySelector("#contrast-note");
  const copyBtn = document.querySelector("#copy");
  const copyStatus = document.querySelector("#copy-status");
  const presetsEl = document.querySelector("#presets");
  const historyEl = document.querySelector("#history");
  const historyEmpty = document.querySelector("#history-empty");
  const clearBtn = document.querySelector("#clear-history");
  const form = document.querySelector("#custom-form");
  const picker = document.querySelector("#picker");
  const hexInput = document.querySelector("#hex-input");
  const hexError = document.querySelector("#hex-error");

  let current = "#ffffff";
  let history = [];
  let copyTimer;

  // localStorage can throw (private mode, blocked storage). The app works without it.
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (Array.isArray(saved.history)) {
        history = saved.history.map(normalizeHex).filter(Boolean).slice(0, MAX_HISTORY);
      }
      if (normalizeHex(saved.current)) current = normalizeHex(saved.current);
    } catch (_) {
      /* ignore */
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ current, history }));
    } catch (_) {
      /* ignore */
    }
  }

  function ratingFor(ratio) {
    if (ratio >= 7) return "AAA";
    if (ratio >= 4.5) return "AA";
    return "below AA";
  }

  function apply(hex, { remember = true } = {}) {
    const normalized = normalizeHex(hex);
    if (!normalized) return false;
    current = normalized;
    const fg = readableTextColor(current);
    root.style.setProperty("--bg", current);
    root.style.setProperty("--fg", fg);

    const ratio = contrastRatio(current, fg);
    hexValue.textContent = current;
    contrastNote.textContent = `${fg === "#000000" ? "Black" : "White"} text, contrast ${ratio.toFixed(1)}:1 (${ratingFor(ratio)})`;
    picker.value = current;
    hexInput.value = "";
    setError("");

    if (remember) history = pushHistory(history, current, MAX_HISTORY);
    save();
    renderSwatches();
    return true;
  }

  function setError(message) {
    hexError.textContent = message;
    if (message) hexInput.setAttribute("aria-invalid", "true");
    else hexInput.removeAttribute("aria-invalid");
  }

  function swatchButton(hex, label, extraClass) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "swatch " + (extraClass || "");
    btn.setAttribute("aria-pressed", String(hex === current));
    btn.setAttribute("aria-label", label ? `${label}, ${hex}` : hex);
    btn.dataset.hex = hex;

    const chip = document.createElement("span");
    chip.className = "swatch__chip";
    chip.style.background = hex;
    chip.setAttribute("aria-hidden", "true");

    const text = document.createElement("span");
    text.textContent = label || hex;
    text.setAttribute("aria-hidden", "true");

    btn.append(chip, text);
    return btn;
  }

  function renderSwatches() {
    presetsEl.replaceChildren(
      ...PRESETS.map((p) => swatchButton(p.hex, p.name, ""))
    );
    historyEl.replaceChildren(
      ...history.map((hex) => {
        const li = document.createElement("li");
        li.append(swatchButton(hex, "", "swatch--hex"));
        return li;
      })
    );
    historyEmpty.hidden = history.length > 0;
    clearBtn.hidden = history.length === 0;
  }

  function onSwatchClick(event) {
    const btn = event.target.closest(".swatch");
    if (btn) apply(btn.dataset.hex);
  }

  presetsEl.addEventListener("click", onSwatchClick);
  historyEl.addEventListener("click", onSwatchClick);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = hexInput.value.trim();
    if (!value) {
      setError("Enter a hex code such as #1a2b3c or #abc.");
      return;
    }
    if (!apply(value)) {
      setError(`"${value}" is not a valid hex colour. Use 3 or 6 hex digits, for example #1a2b3c.`);
    }
  });

  hexInput.addEventListener("input", () => setError(""));

  // Live preview while dragging in the native picker, remember the colour once it is committed.
  picker.addEventListener("input", () => apply(picker.value, { remember: false }));
  picker.addEventListener("change", () => apply(picker.value));

  clearBtn.addEventListener("click", () => {
    history = [];
    save();
    renderSwatches();
  });

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    if (!ok) throw new Error("copy failed");
  }

  copyBtn.addEventListener("click", async () => {
    clearTimeout(copyTimer);
    try {
      await copyText(current);
      copyStatus.textContent = `Copied ${current}`;
    } catch (_) {
      copyStatus.textContent = "Could not copy. Select the code above and copy it manually.";
    }
    copyTimer = setTimeout(() => (copyStatus.textContent = ""), 2500);
  });

  load();
  apply(current, { remember: false });
})();
