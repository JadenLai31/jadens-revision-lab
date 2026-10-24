# Quality assurance report

Validation completed 24 October 2026. This report distinguishes automated checks, content review and unresolved source limitations. It is not school approval or a guarantee about an unknown final exam.

## Inventory

- 83 original questions: 32 MC, 42 short answer and 9 extended response.
- Difficulty by question count: Easy 28, Medium 38, Hard 17.
- 60 flashcards and glossary entries/prompts.
- 19 procedural templates; all 156 listed combinations generated and checked.
- Two complete 40-mark papers with separate answers.
- Four original SVG assets, visually inspected after rasterisation.

## Checks completed

| Check | Result and evidence |
|---|---|
| Structure and IDs | Required fields, known formats, source references and unique IDs checked for 83 fixed and 156 generated questions |
| Multiple choice | All 32 have four unique option texts; valid answer IDs; single/multiple mode consistency; correct-set and invalid-set checks passed |
| Rubrics | Marks sum to each question total; extended subpart rubrics each sum to their advertised marks |
| Numerical templates | All 102 combinations cross-checked with an independent Python arithmetic oracle |
| Extended templates | All 30 combinations generated; energy/current balances and six-mark structures checked |
| Conceptual cases | All 24 complete prompt-answer-rubric bundles generated and structurally checked; scientific wording reviewed |
| Numeric input checking | Correct rounding accepted; blank, malformed, incorrect-unit and deliberately wrong inputs rejected |
| Parameter constraints | Missing, extra and out-of-domain variables rejected for all 19 templates |
| Fixed arithmetic | 16 written numerical responses independently recomputed, plus numerical MC and extended energy/current calculations reviewed |
| Scientific review | Definitions, units, conservation, squared-speed scaling, source conditions, meter placement and circuit-path logic reviewed; identified source issues documented |
| Assessment coverage | Both fixed forms pass mark and coverage rules; selection tested with 20 deterministic seeds |
| Graphs and diagrams | Axes, values, units and circuit connectivity checked; readable images inspected |
| Duplicates | No exact prompt duplicates. One high-text-similarity pair retained intentionally: SA04 teaches direct KE substitution; SA05 adds gram-to-kilogram conversion |
| Reusability | Written questions made self-contained; fixed papers have valid IDs and no missing cross-question dependencies |

The similarity review also found a nearly repeated voltage-calculation prompt. It was changed to SA26, a critique of an incorrect equation, so it tests method evaluation rather than another direct substitution.

## Actual practice-paper balance

| Form | Total | Easy marks | Medium marks | Hard marks | Energy marks | Electricity marks | Investigation marks | Pure calculation marks |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| FORM-A | 40 | 7 | 17 | 16 | 21 | 16 | 5 | 7 |
| FORM-B | 40 | 10 | 14 | 16 | 18 | 16 | 8 | 8 |

Investigation is a cross-cutting category and overlaps topical coverage. Pure calculation counts only items primarily tagged Calculation. Each paper has 10 MC, 18 short-answer and 12 extended-response marks. The preferred difficulty target was 25/45/30%; actual papers deliberately contain 40% Hard marks to retain scenario reasoning, and that difference is reported rather than hidden.

## Cognitive coverage

| Primary skill | Number of fixed questions |
|---|---:|
| Analysis | 10 |
| Application | 7 |
| Calculation | 14 |
| Classification | 1 |
| Comparison | 5 |
| Data interpretation | 1 |
| Diagram interpretation | 2 |
| Evaluation | 6 |
| Experimental design | 3 |
| Explanation | 10 |
| Graph construction | 1 |
| Graph interpretation | 1 |
| Justification | 1 |
| Prediction | 3 |
| Reasoning | 6 |
| Recall | 8 |
| Understanding | 4 |

Extended responses combine several skills even when their primary tag is Analysis. Primary tags therefore undercount the total opportunities to explain, calculate, design and evaluate.

## Limits and review items

- Final school scope, timing, calculator policy and formula-sheet access remain unconfirmed. These do not prevent use as practice.
- Source E Q16 has an inconsistent 50 cm reference; the verified diagram shows 30 cm. Source E Q31’s spring-energy wording and C Q17’s voltage analogy are qualified rather than silently copied.
- The original E Q8 graph and Q29 drawing were not fully visually checked after the follow-up browser approval session failed. Their task text/model answers were read. The package uses its own checked graphs and does not reuse their unverified visual values.
- Detailed rebound methods, uncertainty reasoning and invented datasets are added practice. Do not present them as teacher-provided requirements.
- Written-response and diagram quality requires human/self assessment against rubrics. Numeric or option checks do not grade reasoning automatically.
- All allowed parameter combinations were checked; changing allowed values, formulas, scenarios or the assessment layout requires rerunning validation and content review.
- The included Python contract checker checks the JSON Schema keywords used by this package; it is not a general-purpose schema engine.
- The reading workbook is a static HTML document with embedded diagrams. It does not submit answers, track progress, or modify the existing study website.

## Reproducible evidence

`data/runtime_validation.json` records runtime checks and paper summaries. `data/independent_validation.json` records the independent arithmetic/contract checks. Run `node runtime/validate.mjs` and `python3 runtime/independent_check.py` after edits.
