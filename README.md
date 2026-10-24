# Jaden's Revision Lab

Free static revision tools for GitHub Pages. Open Science → Year 8 Cycle 6 (or All Science Topics) to access practice, flashcards and revision resources. Existing tools remain under **Legacy resources**.

## Run locally

From this directory:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open the local server in a browser. The production site has no runtime package dependencies, backend, API key or build requirement. ES modules and JSON need HTTP serving; opening the modular `index.html` directly through `file://` is not supported. The supplied workbook is separately self-contained.

## Development checks

Use Node 22+ and Python 3. Install test-only dependencies with `npm ci` (or add `--cache /tmp/revision-npm-cache` in restricted cloud machines). Browser tests use system Chromium at `/usr/bin/chromium`, `CHROMIUM_PATH`, or Playwright's installed Chromium (`npx playwright install chromium`).

```sh
npm test
npm run validate:pack
```

For browser tests, keep the local server running, then in another terminal:

```sh
REVISION_TEST_URL=http://127.0.0.1:8000/ npm run test:browser
```

The test runner also supports serving the repository beneath a project prefix. Browser checks save review screenshots under `/tmp` and use isolated browser storage. They test Chromium phone/tablet layouts, not real iOS/Android hardware.

## Structure

- `index.html`: existing application and navigation integration.
- `src/cycle6/`: content validation, assembly, marking, storage, interface and styles.
- `content/science/year-8/cycle-6/`: versioned original Work package, source notes, Markdown guides, JSON, original SVGs, finite-domain generators and QA scripts.
- `tests/`: engine/storage tests and browser workflows.
- `scripts/build-review.py`: optional self-contained review export; not needed for production.

## Content and progress

The imported pack contains 83 authored questions, 60 flashcards, 19 templates and 156 permitted generated instances. Its proposed whole-unit assessment is 21 questions / 40 marks. Authored and generated questions retain IDs and source-alignment labels. Source-supported means the concept is supported, not school endorsement. See the package's QA report for source corrections and unverified original STILE visuals.

Imported progress uses `jadens-cycle6-v1`; existing `jadens-revision-lab-v2` data is preserved separately. The most recent 20 imported sessions, exact question snapshots, preferences, card ratings and checklists are retained locally. Export/reset controls explain their scope. Storage failures are reported; no cloud sync is provided. Revision and practice data can work without network access after loading, but fresh offline navigation/reopening is not guaranteed.

Numerical final-answer marks are automatic. Method, written-response and diagram marks require self-assessment. Blank submitted answers receive zero. Overall scores remain pending until required self-assessment is complete. Legacy generator and grading behaviour otherwise remains available for compatibility.

## Review export

```sh
python3 scripts/build-review.py /tmp/jadens-cycle6-review.html
```

This embeds the current modules, content and diagrams in a single HTML review file; the modular production files remain unchanged. The review copy offers the workbook as a download. Its local progress is independent when opened under a different origin. No publication is performed.
