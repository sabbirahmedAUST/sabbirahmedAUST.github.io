// =====================
// WORD PICKER + HIGHLIGHT
// (Full script.js)
// =====================

// ---------- Default paragraph (replace with yours) ----------
const DEFAULT_TEXT =
  "The Fogg Behavior Model explains that behavior occurs when three elements converge at the same moment: motivation, ability, and a prompt. If any of these elements is missing, the behavior will not happen. Motivation refers to the user’s desire to perform an action, while ability reflects how easy or difficult the action is to complete. Prompts act as triggers that initiate behavior, such as notifications, reminders, or visual cues within an interface. The model emphasizes simplicity, suggesting that increasing ability can often be more effective than increasing motivation. By reducing friction and making actions easier, designers can encourage behavior change without relying solely on persuasion. This framework is widely used in user experience design and behavioral psychology to understand how digital systems guide user decisions. It highlights how structured interactions, subtle triggers, and usability choices can shape everyday behaviors in both physical and digital environments.";

// ---------- State ----------
let currentText = DEFAULT_TEXT;
let mode = "MY TEXT"; // or "YOUR TEXT"

// Token state for highlighting
let tokens = [];                // array of {text, type:"word"|"other"}
let wordTokenIndices = [];      // token indices that are words
let tokenIndexToWordPos = new Map(); // tokenIndex -> word position (0..wordCount-1)

// ---------- DOM ----------
const sourceTextEl = document.getElementById("sourceText");
const outputLineEl = document.getElementById("outputLine");
const chipsEl = document.getElementById("chips");
const modePill = document.getElementById("modePill");

const minWordsEl = document.getElementById("minWords");
const maxWordsEl = document.getElementById("maxWords");
const keepOrderEl = document.getElementById("keepOrder");

const pickBtn = document.getElementById("pickBtn");
const resetBtn = document.getElementById("resetBtn");
const copyBtn = document.getElementById("copyBtn");

const tryYoursBtn = document.getElementById("tryYoursBtn");
const userArea = document.getElementById("userArea");
const userInput = document.getElementById("userInput");
const useTextBtn = document.getElementById("useTextBtn");
const cancelBtn = document.getElementById("cancelBtn");

// ---------- Helpers ----------
function setMode(newMode) {
  mode = newMode;
  modePill.textContent = `MODE: ${mode}`;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min; // inclusive
}

function pickRandomUniqueIndices(total, count) {
  const set = new Set();
  while (set.size < count) set.add(Math.floor(Math.random() * total));
  return [...set];
}

// Keep punctuation/spaces so highlight matches exactly
function tokenize(text) {
  // word = letters/numbers/_ plus apostrophe
  const parts = text.match(/[\w']+|\s+|[^\w\s]+/g) || [];
  return parts.map(p => ({
    text: p,
    type: /^[\w']+$/.test(p) ? "word" : "other"
  }));
}

function buildTokenState(text) {
  tokens = tokenize(text);
  wordTokenIndices = [];
  tokenIndexToWordPos = new Map();

  let wp = 0;
  tokens.forEach((t, i) => {
    if (t.type === "word") {
      wordTokenIndices.push(i);
      tokenIndexToWordPos.set(i, wp);
      wp++;
    }
  });
}

function renderSourceWithHighlights(highlightWordPositions = []) {
  const highlightSet = new Set(highlightWordPositions);

  const html = tokens
    .map((t, tokenIndex) => {
      if (t.type !== "word") return t.text;

      const wordPos = tokenIndexToWordPos.get(tokenIndex);
      const cls = highlightSet.has(wordPos) ? "w hl" : "w";

      // data-wpos is optional (could be used later)
      return `<span class="${cls}" data-wpos="${wordPos}">${t.text}</span>`;
    })
    .join("");

  // sourceTextEl is a <p>, innerHTML is safe here since we generated it
  sourceTextEl.innerHTML = html;
}

function renderOutput(selectedWords) {
  chipsEl.innerHTML = "";
  outputLineEl.textContent = "";

  selectedWords.forEach(w => {
    const span = document.createElement("span");
    span.className = "chip";
    span.textContent = w;
    chipsEl.appendChild(span);
  });

  outputLineEl.textContent = selectedWords.join(" ");
}

function renderSource() {
  buildTokenState(currentText);
  renderSourceWithHighlights([]);
}

// ---------- Main action ----------
function doPick() {
  buildTokenState(currentText);

  const wordCount = wordTokenIndices.length;
  if (wordCount < 3) {
    renderOutput(["(Please enter a longer paragraph.)"]);
    renderSourceWithHighlights([]);
    return;
  }

  let minW = parseInt(minWordsEl.value || "1", 10);
  let maxW = parseInt(maxWordsEl.value || "1", 10);

  minW = isNaN(minW) ? 1 : minW;
  maxW = isNaN(maxW) ? 1 : maxW;
  if (minW > maxW) [minW, maxW] = [maxW, minW];

  minW = clamp(minW, 1, wordCount);
  maxW = clamp(maxW, 1, wordCount);

  const count = randomInt(minW, maxW);

  // Pick unique word positions (0..wordCount-1)
  const pickedWordPositions = pickRandomUniqueIndices(wordCount, count);

  // Build output list
  let outputWords = [];
  if (keepOrderEl.checked) {
    const sorted = [...pickedWordPositions].sort((a, b) => a - b);
    outputWords = sorted.map(pos => tokens[wordTokenIndices[pos]].text);
  } else {
    outputWords = pickedWordPositions.map(pos => tokens[wordTokenIndices[pos]].text);
    // Shuffle for remix feel
    for (let i = outputWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [outputWords[i], outputWords[j]] = [outputWords[j], outputWords[i]];
    }
  }

  // Render both output + highlight
  renderOutput(outputWords);
  renderSourceWithHighlights(pickedWordPositions);
}

// ---------- Events ----------
pickBtn.addEventListener("click", doPick);

resetBtn.addEventListener("click", () => {
  currentText = DEFAULT_TEXT;
  setMode("MY TEXT");
  userArea.classList.add("hidden");
  userInput.value = "";
  renderSource();
  renderOutput([]);
});

copyBtn.addEventListener("click", async () => {
  const textToCopy = outputLineEl.textContent.trim();
  if (!textToCopy) return;

  try {
    await navigator.clipboard.writeText(textToCopy);
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy Output"), 900);
  } catch (e) {
    alert("Copy failed. You can manually select and copy the output.");
  }
});

tryYoursBtn.addEventListener("click", () => {
  userArea.classList.remove("hidden");
  setMode("YOUR TEXT");
  userInput.focus();
});

useTextBtn.addEventListener("click", () => {
  const txt = userInput.value.trim();
  if (!txt) {
    alert("Paste a paragraph first.");
    return;
  }
  currentText = txt;
  renderSource();
  doPick(); // also highlight immediately
  userArea.classList.add("hidden");
});

cancelBtn.addEventListener("click", () => {
  userArea.classList.add("hidden");
  if (currentText === DEFAULT_TEXT) setMode("MY TEXT");
});

// ---------- Init ----------
renderSource();
renderOutput([]);