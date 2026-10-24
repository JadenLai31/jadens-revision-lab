# Integration notes for Codex

## Package purpose

This is a content and generator package for Jaden’s Revision Lab. It does not replace or publish the existing website. It supports a static HTML/CSS/JavaScript site, including GitHub Pages, without an AI API, server account or paid service. Free generation is restricted to verified finite parameter domains; new domains or scenario wording require review.

## Files and loading

- `data/questions.json`: 32 multiple-choice and 42 short-answer questions.
- `data/extended_responses.json`: nine extended scenarios, six marks each.
- `data/flashcards.json`: 60 cards.
- `data/numerical_templates.json`: 12 numerical templates.
- `data/conceptual_templates.json`: four templates containing 24 complete scenario/task cases.
- `data/extended_templates.json`: three parameterised extended-response templates.
- `data/generated_examples.json`: one fully generated instance per template.
- `data/validated_instances.json`: all 156 permitted instances, convenient for an offline import.
- `data/assessment_blueprints.json`: proposed configurable blueprint and two exact papers.
- `runtime/generator.mjs`: pure generation and simple answer-checking functions.
- `runtime/assessment.mjs`: constrained assessment selection and diversity scoring.
- `runtime/validate.mjs`: Node validation and reproducible generation of example/validation data.
- `assets/`: original SVG diagrams and graphs.

Keep IDs stable when importing. Do not merge MC and SA records merely because they assess a shared concept. Keep their format and evidence demands distinct. If revising content, bump the schema/content version and preserve stable question identity where appropriate.

For hosting, copy the package beneath a path such as `/content/cycle6/`. Use relative URL resolution rather than hard-coded repository names:

```js
import { generate } from './content/cycle6/runtime/generator.mjs';
import { selectAssessment } from './content/cycle6/runtime/assessment.mjs';

const root = new URL('./content/cycle6/', document.baseURI);
const read = async name => {
  const response = await fetch(new URL('data/' + name, root));
  if (!response.ok) throw new Error('Content failed to load: ' + name);
  return response.json();
};
const questions = await read('questions.json');
const extended = await read('extended_responses.json');
const templates = await read('numerical_templates.json');
const sample = generate(templates.find(t => t.template_id === 'N01'), {m: 0.5, v: 4});
const blueprint = await read('assessment_blueprints.json');
const paper = selectAssessment([...questions, ...extended], blueprint, {seed: 12});
```

`fetch` may be blocked for a locally opened `file://` document. For the existing single-file HTML workflow, embed the JSON in `<script type="application/json">` elements during build, and bundle the module code into that file. Escape `<` as `\u003c` inside embedded JSON to prevent an accidental closing script tag. The included reading workbook embeds content and diagrams directly and requires no fetch requests.

## Question schema

Every question has `id`, `schema_version`, `subject`, `year_level`, `unit`, `topic`, `subtopic`, `format`, `difficulty`, `cognitive_skill`, `scenario_family`, `command_word`, `question_text`, `supporting_data`, `options`, `correct_answer`, `explanation`, `marks`, `marking_rubric`, `acceptable_alternative_answers`, `source_reference`, `source_alignment_status`, `rubric_status`, `common_mistakes` and `strong_answer_features`.

`question.schema.json` supplies a structural contract. Domain validation additionally checks rubric sums, option uniqueness, asset paths and generated validity; JSON Schema alone does not verify scientific truth.

- MC answers use stable `option_ids`. Shuffle displayed options without changing their IDs. Render single-choice as radio buttons and multiple-select as checkboxes. The proposed one-mark rule is exact-set correctness, no negative marking. This differs from some partial-credit marking in the source tests and is explicitly a practice design choice.
- Written answers use `model_response`; these need human/self marking. A keyword match cannot judge explanations, alternative reasoning or graph quality reliably. Display the rubric and allow users to record earned criteria.
- Generated numerical answers also have `value`, `rounded_value`, `unit` and `absolute_tolerance`. `checkNumeric` checks only a numeric value and explicit unit; it does not assign method marks. Inputs must be plain decimal/scientific-notation strings with units supplied separately. The caller may normalise recognised unit aliases before calling it; never silently guess a unit.
- `parts` holds subpart IDs, text and marks. Match rubric entries to those part IDs.
- `supporting_data` can hold `rows`/`columns`, an `asset` relative to the package root, and descriptive `alt` text. Provide the accessible table alternative alongside graphs. Render tables and diagrams before subquestions.

All user-visible text is plain text. Use `textContent` or equivalent safe text nodes, not untrusted `innerHTML`. Only the bundled, reviewed SVG assets should be inserted as images. Do not execute formula strings or text from question files.

## Source alignment

`source_supported`: the concept or skill appears in the provided resources; the question is still original.

`source_elaboration`: support relies on a labelled elaboration in the uploaded sheet.

`added_practice`: includes extra experimental detail, explanation or application not established as a school requirement.

Source references identify S headings or E/C question numbers. Never display a claim of school approval. The public/reusable data contains no copied personal grades or responses. Source links can require the user’s own STILE access.

## Procedural generation contract

`variable_definitions` contains discrete allowed values. `combinations(template)` returns every allowed combination. `generate(template, params)` rejects missing, extra or out-of-domain values, and returns a complete question object. IDs encode template ID and ordered parameters, so identical instances can be recognised.

Each `function_id` is a literal allow-listed registry key. There is no executable expression language, `eval`, dynamic function construction or network call. The registry implements:

| Function ID | Rule |
|---|---|
| kinetic_energy | 0.5 × m × v² |
| gpe | m × 9.8 × h |
| ohm_current | V/R |
| ohm_voltage | I × R |
| ohm_resistance | V/I |
| efficiency | useful/input × 100; useful is derived from input × percent/100 |
| rebound | rebound/drop × 100; rebound is derived from drop × percent/100 |
| waste | input − useful |
| kj_to_j | kJ × 1000 |
| series_drop | supply V − known drop |
| branch_sum | a + b |
| ke_factor | mass factor × speed factor² |
| verified_case | Select one complete matched prompt/answer/rubric case |
| extended_rebound | Height ratio plus energy explanation and release-method critique |
| extended_spring | Energy balance plus efficiency and friction reasoning |
| extended_parallel | Voltage/current balance plus switch consequences and design trade-off |

Numeric answers retain the full calculated value. Display rounding uses the requested decimal places; acceptance tolerance is half a last-place unit plus a tiny floating-point allowance. The tolerance is for final rounding, not a licence for wrong units or wrong methods. Validating every listed combination does not validate new values added later.

Generated examples and all validated instances are separate from the 83 authored questions. Numeric variations are tagged as numeric variations, not counted as new scenario families. Conceptual variants are complete matched bundles so a different context cannot accidentally inherit an invalid answer.

## Assessment assembly and repetition

The current selector supports the supplied 40-mark, 10 MC + 9 two-mark SA + 2 six-mark ER layout. It samples candidate sets, validates hard constraints, then ranks valid sets by cognitive diversity, difficulty proximity and recent IDs. It does not silently return a paper failing a hard rule; it throws if no valid candidate is found. Changing the layout requires changing the selector as well as the JSON blueprint.

Investigation marks are cross-cutting and can overlap energy/electricity topic marks; do not sum those categories as mutually exclusive totals. Pure calculation marks mean items whose primary cognitive skill is Calculation; multi-part scenarios can contain calculations alongside explanation.

Store recent question IDs and generated-instance IDs locally if desired. `diversityScore` also penalises recent scenario families, command words, cognitive skills and calculation structures. Select the highest-scoring valid candidate; do not just randomise numbers repeatedly. Common instruction words such as “Select” are a soft repetition preference so clarity is retained.

Always show the assembled paper’s actual difficulty/format/coverage summary. The target distribution is a preference, not a claim about your school’s exam. The packaged forms are somewhat more challenging than the target because they deliberately include reasoning tasks.

## Validation commands

With a modern Node installation, from the extracted package root:

```sh
node runtime/validate.mjs
python3 runtime/independent_check.py
```

These write reports and generated examples inside `data/`. They require no network, paid service or third-party package. Review the Markdown QA report for scientific and human-marking limitations.

## Future subjects and cycles

The metadata fields support other units. Add new topic and source records and separate content files rather than hard-coding Science into the UI. The specific formulas, schema version, asset conventions and selection rules need deliberate extension and validation; merely renaming a unit does not make these science generators suitable for another subject.
