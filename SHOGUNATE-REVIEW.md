# Shogunate Japan review

The live website does not yet contain Humanities: its navigation and the resources in this branch require a separately approved merge and publication. This branch enables the existing Humanities subject tile, then adds Year 8 → Cycle 6 → Shogunate Japan without duplicating Science or its progress storage.

## Included

- Seven supplied study topics with recall prompts and persistent checklists: terminology, hierarchy, Dan-no-ura, artefacts, women, the end of the shogunate, and modern Japan.
- A chronological timeline, source-reading links and the original printable workbook.
- 48 proper vocabulary cards with Japanese text, optional romaji, flipping, shuffle, filters and persistent mastery ratings.
- Custom practice from 56 supplied bank questions, filtered by topics, formats and Easy/Medium/Hard/Mixed difficulty, with count and shortage handling.
- The unmodified 11-question / 28-mark assessment, including multiple choice, written responses, both original source-analysis passages, and an extended response.
- Question navigation, skip/revisit, flags, incomplete-submission confirmation, recovery after refresh, model answers, marking guides and honest written self-assessment.
- Separate automatic/self-assessed results with pending overall grades, topic breakdowns, saved history and scoped progress export/reset.
- Relative static loading compatible with GitHub Pages, safe plain-text rendering, data validation and failed-load retry.

## Content and limitations

The imported ZIP contains one workbook, six JSON files and a short README. It does not contain a separate QA report or procedural template library. No new historical questions, answer keys, procedural variations or historical source attribution have been invented. Some marking guides are general rather than point-by-point, so written marks remain a student judgement guided by the original text. Source A is an original museum-label exercise and Source B an original comparison of views. They are explicitly labelled as original practice exercises, not primary documents.

External source links may require personal school access. Japanese pronunciation uses the supplied romaji; no audio service is introduced. Offline interaction is supported after data loads; fresh offline reopening of the modular site is not guaranteed. No accounts, paid APIs, backend, drawing editor or AI grading are introduced. Historical accuracy has not been independently certified against the linked school resources.

## Validation

- 22 engine/storage tests pass: 13 existing Science checks and nine new Humanities checks.
- Humanities browser checks cover the navigation hierarchy, all seven guide sections, checklist persistence, timeline, pronunciation, vocabulary ratings, shuffled cards, custom practice, refresh recovery, incomplete submission, all 28 assessment marks, Sources A/B, pending/self-assessed results, source/workbook links, desktop/phone/tablet layout, loaded offline use, retry after load failure, and return to Science.
- Existing Science browser checks are run separately to preserve regression coverage.
- Original uploaded package files are retained byte for byte. Phone/tablet checks use Chromium viewports; real iOS/Android hardware has not been tested.

## Review

Open the standalone preview or serve this branch locally. Enter the Revision Lab → Humanities → Year 8 → Cycle 6 → Shogunate Japan. Try the six tools, then return through Topics/Cycles/Year levels/All subjects and confirm Science remains available.

For practice, answer one item, skip another and refresh. Submit and confirm that missing answers receive zero only after confirmation. Written answers must keep the overall result pending until self-assessed. In Full Practice, questions 9 and 10 show their matching original source exercises; question 11 is an extended response.

Do not merge or publish until the user approves this completed integration. GitHub API and public-site access have previously been blocked from this environment; a pushed development branch and downloadable standalone preview are the review path.
