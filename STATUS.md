# STATUS — Recipe Card Scaler

**State: complete and verified.** Single-file, zero-dependency, offline-first recipe scaler.

## What was built

- **`index.html`** — the entire app in one file (HTML + CSS + JS inline, no dependencies, runs from `file://`):
  - Recipe paste box with tolerant parser (mixed numbers, decimals, vulgar fractions, bullets, "Serves/Yield/Makes" lines, common section headers).
  - Scale-to-servings control plus one-click **Halve** / **Double** / **Reset** modes; live factor badge.
  - Fraction-friendly math core (`RECIPE_MATH`, marked for tests): `fractionToDecimal`, `decimalToFracString`, `niceAmount`, `scaledNice`, `scaleLine`, pantry grouping, pan suggestions.
  - Ingredient table with scaled amount, unit (pluralized correctly: `2 cups`), item, and original amount; changed amounts highlighted.
  - Instruction lines scaled inline, with cook times and oven temperatures deliberately untouched (e.g. `20 minutes`, `1 hour`, `375°F`, `2-3 minutes` ranges are safe).
  - **Oven & time notes**: detected from the text, rendered as fully editable inputs (add/remove). Honest cook-time guidance at the current factor (sub-linear, e.g. ≈ +25% when doubling), never auto-scaled.
  - **Pan-size substitution hints**: detects `9x13`-style pans and `9-inch round` pans (area computed), suggests suited pans at the current factor ("almost exact fit", "fill ~3/4 full", "two 9x13 dishes").
  - **Grouped pantry list** for shopping, with **merge-format copy/download** (`# Pantry list — title`, `## Category` sections, plain bullets) that pastes directly into meal-rotation-planner.
  - **Keep-card library** in `localStorage`: save/load/update/delete cards, export all as JSON, import JSON, download pantry `.txt` and standalone card `.html`.
  - No network requests, no accounts, no tracking; local-first by design.

- **`tests/run-tests.js`** — ~140 zero-dependency unit tests covering fraction↔decimal conversion, fraction snapping, scaling math, unit normalization, ingredient-line parsing, instruction scaling (times/temps guarded), recipe parsing (title/servings/oven/pan), pan suggestions, pantry grouping, and merge format. Also compiles the full inline script to catch syntax errors.
- **`tests/smoke-dom.js`** — full-app smoke test that loads the real script against a minimal fake DOM and clicks the real event flow: parse → double → scale-to-servings → halve/reset → pantry merge → save → edit oven note → re-save → load → delete.
- **`README.md`** — plain-English overview, run instructions, privacy note, credits.
- **`LICENSE`** — MIT, `Copyright (c) 2026 Asdale Dynamics, LLC`.

## How to run

App: open `index.html` in any modern browser (double-click works; no server needed).

Tests:

```bash
node tests/run-tests.js
node tests/smoke-dom.js
```

## Verification results (as of this commit)

- `node tests/run-tests.js` → **142 passed, 0 failed** (script syntax compile: OK).
- `node tests/smoke-dom.js` → **38 passed, 0 failed**.
- No secrets, API keys, or personal data in any file.
- Verified fixes along the way: amount-token alternation order (mixed numbers like `1 1/2` now parse before bare digits), oven-note regex (no longer matches any word ending in "c"), unit pluralization (`2 cups`), zero/negative factor guards, fraction space variants (`2 / 4`), `gcd(0,n)` behavior documented by test.

## Known gaps

- Parser is heuristic: very unusual pasted layouts can misclassify a line between ingredients and instructions; the pantry list and oven notes are editable, and re-parsing fixes most issues.
- Ingredient category keywords cover common US pantry items; unfamiliar items land in "Other".
- Pan hints are area-based approximations (no pan-shape/depth modeling); muffin tins and loaf pans give rough fits.
- Cook-time advice is heuristic (power-law adjustment), labeled as guidance, and never applied automatically.
- localStorage may be unavailable in some private-browsing modes; the app shows a clear message instead of crashing.
- Export/import round-trip and clipboard on `file://` verified only against stubbed environments and standard browser APIs; a quick manual double-check in your browser is recommended when first opening the app.
