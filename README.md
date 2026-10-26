# Recipe Card Scaler

An offline web app for cooking at **any batch size**. Paste a recipe, tell it how many servings you want, and it does the fraction-friendly math for you — cups, tablespoons, mixed numbers and all.

Built to be friendly, in plain English, like a friend would explain it: step by step, never condescending. Works completely offline from a single file.

## Why this exists

Everyone eventually needs to cook for a different number of people than the recipe was written for. Most tools give you `6.53 cups` of flour and call it done. This app snaps amounts to the fractions real cookware understands — `1 1/2 cups`, `2 3/4 cups` — and keeps the recipe easy to read while it scales.

## Get started (no install)

1. Save `index.html` anywhere on your computer (or just keep the folder).
2. Double-click it, or open it with any modern browser. It runs from `file://` — no server, no internet, no account.
3. Paste a recipe into the box, click **Parse recipe**.

That's it. There is nothing to install and no dependencies to download.

## What it does

- **Scale to servings** — set the original and target servings; everything scales proportionally.
- **Halve & Double modes** — one click for the two most common batch changes, plus reset.
- **Fraction-friendly amounts** — scaled amounts snap to cook-friendly fractions (halves, thirds, quarters, eighths, sixteenths). `1.53 cups` becomes `1 1/2 cups`.
- **Smart instructions** — amounts inside step text scale too, but cook times (`20 minutes`) and oven temperatures (`375°F`) are deliberately left alone.
- **Editable oven & time notes** — detected oven/time lines stay fully editable, because bake time does *not* simply double with batch size. The app adds honest guidance instead of pretending it scales.
- **Pan-size substitution hints** — mentions like `9x13 dish` or `9-inch round` are detected; when you scale, you get pan suggestions based on pan area (e.g. "two 9x13 dishes" or "fill the 9x9 about 3/4 full").
- **Grouped pantry list** — ingredients grouped for shopping: produce, dairy & eggs, meat & seafood, pantry & dry goods, spices, frozen, other.
- **Merge format for meal-rotation-planner** — the pantry list copies/downloads in a clean `## Category` + bullet format that pastes straight into the [meal-rotation-planner](https://github.com/dylanasdale) tool or any plain-text list.
- **Keep-card library** — save recipes as cards in your browser's `localStorage`. Load, delete, export all as JSON, import JSON back. Nothing leaves your device.
- **Export** — download the pantry list as `.txt` or the whole scaled card as a standalone `.html` file.

## Privacy

Local-first and proud of it: no analytics, no network requests, no accounts, no cookies. Recipes and cards are stored only in your browser's localStorage (or files you explicitly download). No secrets or personal data are stored by the app beyond what you save yourself.

## Tests

Fraction conversion and scaling math are covered by a zero-dependency test suite:

```bash
node tests/run-tests.js     # unit tests: fraction <-> decimal, scaling, parsing
node tests/smoke-dom.js     # full-app smoke test against a fake DOM
```

Both suites need only Node.js — no packages to install.

## Tips for good parses

- Include a line like `Serves 4`, `Yield: 12`, or `Makes about 8` so base servings set themselves.
- Headers like `Ingredients:` and `Directions:` help the parser, but plain pasted text usually works.
- Amounts like `1 1/2`, `3/4`, `0.5`, `2.75`, or `½` all work.
- Peculiar layouts can scramble any parser — the pantry list and oven notes are editable, and you can always fix a line by editing the text and re-parsing.

## Known limits

- Pan hints are area-based and approximate; a bundt pan is not a sheet pan, and the app knows it's guessing that simply.
- Scaling works on amounts and proportional cook-time suggestions, not on baking chemistry. Large batch changes can still want recipe-specific judgment.
- Ingredient classification is keyword-based; an unknown item lands in "Other", ready to be moved by hand in your planner.

## Part of a family

This tool complements:

- **meal-rotation-planner** — plan meals across the week; merge this app's pantry lists right in.
- **free-kitchen-cheatsheet-pack** — quick reference cards for measurements, substitutions, and timings.

## Credits

Created by **Asdale Dynamics, LLC** for the [Massive AI Manual](https://dylanasdale.github.io) ecosystem of beginner-friendly tools.

Released under the [MIT License](LICENSE).

Copyright (c) 2026 Asdale Dynamics, LLC
