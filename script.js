// ===== Theme Persist =====
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const themeLabel = document.getElementById('themeLabel');

(function initTheme() {
  const saved = localStorage.getItem('riya_calc_theme') || 'dark';
  if (saved === 'light') {
    root.classList.add('light');
    themeToggle.checked = true;
    themeLabel.textContent = 'Light';
  } else {
    themeLabel.textContent = 'Dark';
  }
})();

themeToggle.addEventListener('change', () => {
  const isLight = themeToggle.checked;
  root.classList.toggle('light', isLight);
  localStorage.setItem('riya_calc_theme', isLight ? 'light' : 'dark');
  themeLabel.textContent = isLight ? 'Light' : 'Dark';
});

// ===== Calculator Logic =====
const display = document.getElementById('display');
const historyEl = document.getElementById('history');
const grid = document.querySelector('.grid');

let expr = '0';          // expression shown on display
let lastResult = null;   // last evaluated result (for history)

// Allowed characters for security (when using eval-like evaluation)
const SAFE = /^[0-9+\-*/.%() ]+$/;

function updateDisplay() {
  display.value = expr;
}

function setExpr(v) {
  expr = v;
  updateDisplay();
}

function append(val) {
  // Avoid leading zeros like "0" followed by number (except decimal)
  if (expr === '0' && /[0-9]/.test(val)) {
    setExpr(val);
    return;
  }
  // Prevent two operators in a row (except minus for negative)
  const last = expr.slice(-1);
  if (/[+\-*/.%]/.test(last) && /[+\*/.%]/.test(val)) {
    // replace last op with new op (except allow '-' after an operator)
    if (val !== '-') {
      setExpr(expr.slice(0, -1) + val);
      return;
    }
  }
  setExpr(expr + val);
}

function clearAll() {
  setExpr('0');
  historyEl.textContent = '';
  lastResult = null;
}

function backspace() {
  if (expr.length <= 1) { setExpr('0'); return; }
  setExpr(expr.slice(0, -1));
}

function toPercent() {
  // Converts last number to percent (divide by 100)
  const m = expr.match(/(-?\d+(\.\d+)?)$/);
  if (m) {
    const num = parseFloat(m[0]);
    const pct = (num / 100).toString();
    setExpr(expr.slice(0, -m[0].length) + pct);
  } else {
    // If nothing matches, apply to whole expr if numeric
    if (!isNaN(parseFloat(expr))) {
      setExpr((parseFloat(expr) / 100).toString());
    }
  }
}

function sanitize(s) {
  // Replace unicode ÷ × if user typed somehow
  s = s.replace(/÷/g, '/').replace(/×/g, '*');
  return s;
}

function calculate() {
  const raw = sanitize(expr);
  if (!SAFE.test(raw)) {
    setExpr('Error');
    return;
  }
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${raw});`)();
    if (result === Infinity || result === -Infinity || Number.isNaN(result)) {
      throw new Error('Invalid math');
    }
    historyEl.textContent = `${expr} =`;
    lastResult = result;
    setExpr(String(result));
  } catch (e) {
    setExpr('Error');
  }
}

// ===== Click Handling =====
grid.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  // Visual press feedback
  btn.classList.add('pressed');
  setTimeout(() => btn.classList.remove('pressed'), 120);

  const val = btn.dataset.val;
  const action = btn.dataset.action;

  if (val !== undefined) {
    append(val);
    return;
  }
  if (action === 'clear') { clearAll(); return; }
  if (action === 'backspace') { backspace(); return; }
  if (action === 'percent') { toPercent(); return; }
  if (action === 'equals') { calculate(); return; }
});

// ===== Keyboard Support =====
window.addEventListener('keydown', (e) => {
  const k = e.key;

  if (/\d/.test(k)) { append(k); return; }
  if (['+', '-', '*', '/'].includes(k)) { append(k); return; }
  if (k === '.') { append('.'); return; }
  if (k === 'Enter' || k === '=') { e.preventDefault(); calculate(); return; }
  if (k === 'Backspace') { backspace(); return; }
  if (k === 'Escape') { clearAll(); return; }
  if (k === '%') { toPercent(); return; }
});

// Initialize display once
updateDisplay();
