# Jaden’s Revision Lab Cycle 6 revision resources

Start with **Revision-Workbook.html** for a readable offline workbook. Its navigation separates study notes, questions, answers, practice papers, sources and QA. No installation or paid API is needed to read it.

## Included

- 83 original questions: 32 multiple choice, 42 short answer and 9 extended-response scenarios.
- Separate answer explanations, proposed marking rubrics and common mistakes.
- Study guide, glossary, formula sheet, 60 flashcards and revision checklist.
- Two 40-mark practice papers with separate answers.
- 19 JavaScript-compatible templates with 156 validated instances and an example per template.
- Source coverage matrix, documented schemas, assessment blueprint, integration notes and QA evidence.

The `docs/` folder contains editable Markdown resources. `data/` contains website-ready JSON. `runtime/` contains the free generators, assessment selector and validation scripts. `assets/` contains original diagrams.

The school resources establish the core scope; additional explanations and practice details are labelled. These are practice resources, not school-approved assessments. Read `docs/Source-Analysis.md` and `docs/QA-Report.md` for known source issues and remaining uncertainties.

This package prepares content for the study website. It does not publish or alter the website. See `docs/Integration-Notes.md` for a safe import into either a hosted static site or the existing single-file HTML workflow.

Use `node runtime/validate.mjs` and `python3 runtime/independent_check.py` to rerun checks after changes. Their reports and generated examples are written into `data/`.
