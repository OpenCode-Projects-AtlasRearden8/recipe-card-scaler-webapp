"use strict";

/*
 * Test runner for Recipe Card Scaler.
 * Zero dependencies. Run with: node tests/run-tests.js
 *
 * Extracts the marked RECIPE_MATH block from index.html, evaluates it,
 * and tests fraction conversion + scaling math. Also compiles the full
 * inline <script> to catch syntax errors.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const HTML_PATH = path.join(ROOT, "index.html");

const html = fs.readFileSync(HTML_PATH, "utf8");
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("FAIL: no <script> block found in index.html");
  process.exit(1);
}
const fullScript = scriptMatch[1];

let scriptSyntaxOk = true;
try {
  new Function(fullScript);
} catch (e) {
  scriptSyntaxOk = false;
  console.error("FAIL: inline script does not compile:", e.message);
}

const start = html.indexOf("/*__PURE_MATH_START__*/");
const end = html.indexOf("/*__PURE_MATH_END__*/");
if (start === -1 || end === -1 || end <= start) {
  console.error("FAIL: PURE_MATH markers not found in index.html");
  process.exit(1);
}
const pureSource = html.slice(start + "/*__PURE_MATH_START__*/".length, end);

const context = {};
new Function("context", `${pureSource}; context.M = RECIPE_MATH;`)(context);
const M = context.M;

if (!M) {
  console.error("FAIL: RECIPE_MATH did not evaluate");
  process.exit(1);
}

let passed = 0;
let failed = 0;
const failures = [];

function check(name, actual, expected, tol) {
  const eq = (a, b) =>
    (typeof a === "number" && typeof b === "number" && tol !== undefined)
      ? Math.abs(a - b) <= tol
      : a === b;
  if (eq(actual, expected)) {
    passed++;
  } else {
    failed++;
    failures.push(
      `${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

function near(name, actual, expected, tol) {
  if (typeof actual === "number" && typeof expected === "number" && Math.abs(actual - expected) <= tol) {
    passed++;
  } else {
    failed++;
    failures.push(`${name}: expected ~${expected} (±${tol}), got ${actual}`);
  }
}

function truthy(name, condition, detail) {
  if (condition) passed++;
  else { failed++; failures.push(`${name}${detail ? " — " + detail : ""}`); }
}

/* ---------- fractionToDecimal ---------- */

check("fractionToDecimal '3/4'", M.fractionToDecimal("3/4"), 0.75);
check("fractionToDecimal '1 1/2'", M.fractionToDecimal("1 1/2"), 1.5);
check("fractionToDecimal '2 1/4'", M.fractionToDecimal("2 1/4"), 2.25);
check("fractionToDecimal '0.5'", M.fractionToDecimal("0.5"), 0.5);
check("fractionToDecimal '2'", M.fractionToDecimal("2"), 2);
check("fractionToDecimal '2.75'", M.fractionToDecimal("2.75"), 2.75);
check("fractionToDecimal '1/8'", M.fractionToDecimal("1/8"), 0.125);
check("fractionToDecimal '1/3'", M.fractionToDecimal("1/3"), 1 / 3, 1e-12);
near("fractionToDecimal '2 2/3'", M.fractionToDecimal("2 2/3"), 2.666666, 1e-6);
check("fractionToDecimal ''", M.fractionToDecimal(""), null);
check("fractionToDecimal 'abc'", M.fractionToDecimal("abc"), null);
check("fractionToDecimal null", M.fractionToDecimal(null), null);
check("fractionToDecimal '1/0'", M.fractionToDecimal("1/0"), null);
check("fractionToDecimal '-3/4'", M.fractionToDecimal("-3/4"), -0.75);
check("fractionToDecimal ' 2 / 4 ' (spaces around slash)", M.fractionToDecimal(" 2 / 4 "), 0.5);
check("fractionToDecimal '½'", M.fractionToDecimal("½"), 0.5);
check("fractionToDecimal '1 ¼'", M.fractionToDecimal("1 ¼"), 1.25);
check("fractionToDecimal '1½'", M.fractionToDecimal("1½"), 1.5);
check("fractionToDecimal '⅔'", M.fractionToDecimal("⅔"), 2 / 3, 1e-12);
check("fractionToDecimal '3 ½'", M.fractionToDecimal("3 ½"), 3.5);

/* ---------- decimalToFracString ---------- */

check("decimalToFracString 0", M.decimalToFracString(0), "0");
check("decimalToFracString 1", M.decimalToFracString(1), "1");
check("decimalToFracString 0.5", M.decimalToFracString(0.5), "1/2");
check("decimalToFracString 1.5", M.decimalToFracString(1.5), "1 1/2");
check("decimalToFracString 0.75", M.decimalToFracString(0.75), "3/4");
check("decimalToFracString 2.25", M.decimalToFracString(2.25), "2 1/4");
check("decimalToFracString 1/3", M.decimalToFracString(1 / 3), "1/3");
check("decimalToFracString 2/3", M.decimalToFracString(2 / 3), "2/3");
check("decimalToFracString 1/8", M.decimalToFracString(0.125), "1/8");
check("decimalToFracString 3/8", M.decimalToFracString(0.375), "3/8");
check("decimalToFracString 0.625", M.decimalToFracString(0.625), "5/8");
check("decimalToFracString 0.1875", M.decimalToFracString(0.1875), "3/16");
check("decimalToFracString -0.5", M.decimalToFracString(-0.5), "-1/2");
check("decimalToFracString 3", M.decimalToFracString(3), "3");
check("decimalToFracString null", M.decimalToFracString(null), null);
check("decimalToFracString non-third 1/3 allowThirds=false -> decimal", M.decimalToFracString(1 / 3, false) !== null, true);
truthy("decimalToFracString(1/3, false) avoids thirds", !/\b1\/3\b/.test(M.decimalToFracString(1 / 3, false)));
check("decimalToFracString 4.75", M.decimalToFracString(4.75), "4 3/4");

/* ---------- niceAmount / scaledNice ---------- */

check("niceAmount 1.5", M.niceAmount(1.5), 1.5);
near("niceAmount 1.3333", M.niceAmount(4 / 3), 4 / 3, 1e-9);
check("niceAmount 0.125", M.niceAmount(0.125), 0.125);
check("niceAmount 42.3 -> rounds", M.niceAmount(42.3), 42);
check("niceAmount 2.9", M.niceAmount(2.9), 2.9);
check("scaledNice 2 x 1.5", M.scaledNice(2, 1.5), 3);
check("scaledNice 0.5 x 2", M.scaledNice(0.5, 2), 1);
check("scaledNice 1.5 x 0.5", M.scaledNice(1.5, 0.5), 0.75);
check("scaledNice null", M.scaledNice(null, 2), null);
check("scaledNice 1 x 0", M.scaledNice(1, 0), null);

/* ---------- gcd ---------- */

check("gcd 12,18", M.gcd(12, 18), 6);
check("gcd 7,13", M.gcd(7, 13), 1);
check("gcd 0,5 (gcd(0,n)=n)", M.gcd(0, 5), 5);

/* ---------- unit normalization ---------- */

check("normalizeUnit 'cups'", M.normalizeUnit("cups"), "cup");
check("normalizeUnit 'tablespoons'", M.normalizeUnit("tablespoons"), "tbsp");
check("normalizeUnit 'tbsp'", M.normalizeUnit("tbsp"), "tbsp");
check("normalizeUnit 'tsp'", M.normalizeUnit("tsp"), "tsp");
check("normalizeUnit 'teaspoons.'", M.normalizeUnit("teaspoons."), "tsp");
check("normalizeUnit 'ounces'", M.normalizeUnit("ounces"), "oz");
check("normalizeUnit 'lbs'", M.normalizeUnit("lbs"), "lb");
check("normalizeUnit ''", M.normalizeUnit(""), "");
check("normalizeUnit 'Pale'", M.normalizeUnit("Pale"), "pale");

/* ---------- parseIngredientLine ---------- */

let ing = M.parseIngredientLine("2 cups flour");
check("parse '2 cups flour' amount", ing && ing.amount, 2);
check("parse '2 cups flour' unit", ing && ing.unit, "cup");
check("parse '2 cups flour' item", ing && ing.item, "flour");

ing = M.parseIngredientLine("1 1/2 cups chopped onion");
check("parse '1 1/2 cups chopped onion' amount", ing && ing.amount, 1.5);
check("parse '1 1/2 cups chopped onion' unit", ing && ing.unit, "cup");
check("parse '1 1/2 cups chopped onion' item", ing && ing.item, "chopped onion");

ing = M.parseIngredientLine("3 cloves garlic, minced");
check("parse '3 cloves garlic' amount", ing && ing.amount, 3);
check("parse '3 cloves garlic' unit", ing && ing.unit, "clove");
check("parse '3 cloves garlic' item", ing && ing.item, "garlic, minced");

ing = M.parseIngredientLine("0.5 tsp salt");
check("parse '0.5 tsp salt' amount", ing && ing.amount, 0.5);
check("parse '0.5 tsp salt' unit", ing && ing.unit, "tsp");

ing = M.parseIngredientLine("2 large eggs");
check("parse '2 large eggs' amount", ing && ing.amount, 2);
check("parse '2 large eggs' unit", ing && ing.unit, "large");
check("parse '2 large eggs' item", ing && ing.item, "eggs");

ing = M.parseIngredientLine("1/4 cup fresh basil, chopped");
check("parse '1/4 cup fresh basil' amount", ing && ing.amount, 0.25);
check("parse '1/4 cup fresh basil' item", ing && ing.item, "fresh basil, chopped");

ing = M.parseIngredientLine("- 3/4 cup sugar");
check("parse bullet '3/4 cup sugar' amount", ing && ing.amount, 0.75);

ing = M.parseIngredientLine("28 oz can crushed tomatoes");
check("parse '28 oz can crushed tomatoes' amount", ing && ing.amount, 28);
check("parse '28 oz ...' unit", ing && ing.unit, "oz");

check("parse non-quantity returns null", M.parseIngredientLine("Preheat oven to 375 degrees."), null);
check("parse empty returns null", M.parseIngredientLine(""), null);
check("parse 'Salt to taste' returns null", M.parseIngredientLine("Salt to taste"), null);

/* ---------- scaleLine (instructions) ---------- */

let scaled = M.scaleLine("Stir in 2 cups flour and 1/2 cup sugar.", 2);
check("scaleLine doubles 2 cups", /\b4 cups flour\b/.test(scaled.text), true);
check("scaleLine doubles 1/2 cup", /\b1 cup sugar\b/.test(scaled.text), true);
check("scaleLine changed flag", scaled.changed, true);

scaled = M.scaleLine("Bake at 375°F for 25 minutes.", 2);
check("scaleLine leaves °F untouched", /375/.test(scaled.text), true);
check("scaleLine leaves minutes untouched", /25 minutes/.test(scaled.text), true);
check("scaleLine unchanged flag", scaled.changed, false);

scaled = M.scaleLine("Simmer 20 minutes, then rest 1 hour.", 2);
check("scaleLine leaves '20 minutes'", /\b20 minutes\b/.test(scaled.text), true);
check("scaleLine leaves '1 hour'", /\b1 hour\b/.test(scaled.text), true);

scaled = M.scaleLine("Cook onion 5 minutes.", 3);
check("scaleLine unchanged factor=1-style times", /\b5 minutes\b/.test(scaled.text), true);

scaled = M.scaleLine("Mixture will thicken in 2-3 minutes.", 2);
check("scaleLine leaves time ranges", /\b2-3 minutes\b/.test(scaled.text), true);

scaled = M.scaleLine("Use 1 tbsp butter and 2 tsp vanilla.", 0.5);
check("scaleLine halves 1 tbsp", /1\/2 tbsp butter/.test(scaled.text.replace("1/2", "1/2")), true);
check("scaleLine halves 2 tsp", /\b1 tsp\b/.test(scaled.text), true);

scaled = M.scaleLine("Stir well.", 2);
check("scaleLine no-op string", scaled.text, "Stir well.");
check("scaleLine no-op changed", scaled.changed, false);

scaled = M.scaleLine("Whisk in 3 eggs and 1 cup milk.", 2);
truthy("scaleLine leaves bare '3 eggs'", /\b3 eggs\b/.test(scaled.text), scaled.text);
truthy("scaleLine scales '1 cup milk' to 2 cups", /\b2 cups milk\b/.test(scaled.text), scaled.text);

scaled = M.scaleLine("Whisk in 1 1/2 cups broth.", 4);
truthy("scaleLine scales mixed number up", /\b6 cups broth\b/.test(scaled.text), scaled.text);

scaled = M.scaleLine("Serve in 2 bowls.", 3);
truthy("scaleLine leaves bare numbers", /Serve in 2 bowls\./.test(scaled.text), scaled.text);

scaled = M.scaleLine("Blend in 0.5 cup cream.", 3);
truthy("scaleLine scales decimal 0.5 x3 to 1 1/2", /1 1\/2 cups cream/.test(scaled.text), scaled.text);

scaled = M.scaleLine("Toast 4 slices bread.", 2);
truthy("scaleLine scales '4 slices'", /\b8 slices\b/.test(scaled.text), scaled.text);

/* ---------- parseRecipe ---------- */

const sample = [
  "Homestyle Soup (serves 4)",
  "",
  "2 tbsp olive oil",
  "1 1/2 cups chopped onion",
  "",
  "Directions",
  "Heat oil. Cook onion 5 minutes.",
  "Simmer 20 minutes, then blend.",
  "Bake at 375°F for 25 minutes."
].join("\n");

const recipe = M.parseRecipe(sample);
check("parseRecipe title", recipe.title, "Homestyle Soup");
check("parseRecipe servings", recipe.servings, 4);
check("parseRecipe ingredient count", recipe.ingredients.length, 2);
check("parseRecipe instructions count", recipe.instructions.length, 3);
check("parseRecipe oven notes count", recipe.ovenNotes.length, 1);
check("parseRecipe oven note text", recipe.ovenNotes[0], "Bake at 375°F for 25 minutes.");

const noServings = M.parseRecipe("Some stew\n\n2 cups water\nSimmer 10 minutes.");
check("parseRecipe missing servings -> null", noServings.servings, null);

const oddServings = M.parseRecipe("Chili (serves 6)\n\n1 lb ground beef\n");
check("parseRecipe 'serves 6'", oddServings.servings, 6);
check("parseRecipe title strips serves", oddServings.title, "Chili");

const about = M.parseRecipe("Bread: makes about 8 rolls\n\n4 cups flour\n");
check("parseRecipe 'makes about 8'", about.servings, 8);

const empty = M.parseRecipe("");
check("parseRecipe empty text", empty.ingredients.length, 0);

/* ---------- pan detection + suggestPan ---------- */

const pans = M.parseRecipe("Brownies\n\n2 cups sugar\nPour into a 9x13 baking dish.\nBake 30 minutes.");
check("pan detected 9x13", pans.panMentions.length >= 1, true);
if (pans.panMentions.length >= 1) {
  check("pan area 9x13", Math.round(pans.panMentions[0].area), 117);
}

const roundPan = M.parseRecipe("Cheesecake\n\nBake in a 9-inch round springform.");
check("round pan detected", roundPan.panMentions.length, 1);
if (roundPan.panMentions.length) {
  check("round pan area ~= 63.6", Math.round(roundPan.panMentions[0].area), 64);
}

const suggestionsDouble = M.suggestPan(117, 2, "9x13");
truthy("suggestPan double 9x13 gives advice", suggestionsDouble.length > 0);
truthy(
  "suggestPan double 9x13 mentions two 9x13-type pans or a larger area",
  /two|2\u00d7|bigger|larger|sheet|fill/i.test(suggestionsDouble[0]) || suggestionsDouble.length > 1
);
const suggestionsSame = M.suggestPan(117, 1, "9x13");
truthy("suggestPan x1 gives advice", suggestionsSame.length > 0);

/* ---------- grouping + pantry merge format ---------- */

const items = [
  { amount: 2, unit: "cup", item: "chopped onion" },
  { amount: 1, unit: "cup", item: "milk" },
  { amount: 1, unit: "lb", item: "ground beef" },
  { amount: 1, unit: "tsp", item: "salt" },
  { amount: null, unit: "", item: "Salt to taste" },
  { amount: 2, unit: "cup", item: "frozen peas" }
];
const grouped = M.groupPantry(items);
truthy("groupPantry groups non-empty", grouped.length > 0);
const cats = grouped.map(g => g.cat);
truthy("groupPantry has Produce", cats.includes("Produce"));
truthy("groupPantry has Dairy & eggs", cats.includes("Dairy & eggs"));
truthy("groupPantry has Meat & seafood", cats.includes("Meat & seafood"));
truthy("groupPantry has Spices & seasonings", cats.includes("Spices & seasonings"));
const produceGroup = grouped.find(g => g.cat === "Produce");
truthy(
  "groupPantry produce item keeps fraction amount",
  produceGroup && produceGroup.items.some(i => /^\d+ cup/.test(i) && /onion/.test(i)),
  produceGroup && JSON.stringify(produceGroup.items)
);
truthy(
  "groupPantry plain line kept for no-amount item",
  grouped.some(g => g.items.includes("Salt to taste"))
);

const mergeText = M.pantryMergeFormat(grouped, "Weeknight Stew", 6);
truthy("mergeFormat has title", mergeText.includes("# Pantry list — Weeknight Stew"));
truthy("mergeFormat has servings", mergeText.includes("6 servings"));
truthy("mergeFormat has ## sections", /## [A-Z]/.test(mergeText));
truthy("mergeFormat has bullets", /^- /m.test(mergeText));

/* ---------- categorizeIngredient edge cases ---------- */

check("categorize 'garlic powder' not produce", M.categorizeIngredient("garlic powder"), "Spices & seasonings");
check("categorize 'chicken broth' not meat", M.categorizeIngredient("chicken broth"), "Pantry & dry goods");
check("categorize 'black pepper' not produce", M.categorizeIngredient("black pepper"), "Spices & seasonings");
check("categorize 'green pepper' produce", M.categorizeIngredient("green pepper"), "Produce");
check("categorize unknown", M.categorizeIngredient("mystery paste"), "Other");

/* ---------- scaleLine vs decimal unit variants ---------- */

scaled = M.scaleLine("Blend in 0.5 cup cream.", 3);
truthy("scaleLine decimal 0.5 x3", /1 1\/2 cups cream/.test(scaled.text), scaled.text);

scaled = M.scaleLine("Toast 4 slices bread.", 2);
truthy("scaleLine scales '4 slices'", /\b8 slices\b/.test(scaled.text), scaled.text);

/* ---------- factor math used by UI ---------- */
near("servings factor 6/4", 6 / 4, 1.5, 1e-9);
check("scaledNice 3/4 cup x2 = 1.5", M.scaledNice(0.75, 2), 1.5);
check("scaledNice 1.5 cup x2 = 3", M.scaledNice(1.5, 2), 3);
check("scaledNice 1/3 cup x0.5 -> non-null", M.scaledNice(1 / 3, 0.5) !== null, true);

/* ---------- report ---------- */

console.log("\nRecipe Card Scaler test results");
console.log(`  script syntax compile: ${scriptSyntaxOk ? "OK" : "FAILED"}`);
console.log(`  passed: ${passed}`);
console.log(`  failed: ${failed}`);
if (failures.length) {
  console.log("\nFailures:");
  failures.forEach(f => console.log("  - " + f));
}
process.exit(failed === 0 && scriptSyntaxOk ? 0 : 1);
