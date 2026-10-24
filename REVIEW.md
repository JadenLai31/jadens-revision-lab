# Cycle 6 integration review

Branch: `feature/cycle6-revision-pack`.

The existing practice screen had a fixed 35-question layout and could not represent the pack's multiple-select questions, six-mark subparts, diagrams or 40-mark papers. The imported practice workflow now uses per-question metadata for selection, navigation, marking and review. Existing resources and storage remain accessible under Legacy resources.

## Included

- Comprehensive revision notes, formulas, checklist, source/QA details and printable offline workbook.
- 60 imported flashcards with filters and separate persistent ratings.
- Easy/Medium/Hard/Mixed custom practice by format, topic and count; finite template generation and repetition disclosures.
- Full Practice A/B and constrained newly assembled 21-question / 40-mark assessments.
- Question navigator, answered/unanswered counts, flags, skip/revisit, editable answers and incomplete-submission confirmation.
- Exact-set multiple-select marking, numerical units/tolerances, worked answers and guided criterion self-assessment.
- Results by topic/format/difficulty, pending grading, new/mistake/similar/harder/full follow-up controls.
- Refresh recovery, bounded local history, preferences, export and scoped reset controls.
- GitHub Pages relative loading; plain-text rendering for imported content; rejected-record and load/storage error reporting.

## Review steps

1. Enter the lab → Science → Year 8 Cycle 6 → either topic, or choose All Science Topics.
2. Open Practice test, select formats/topics/difficulty/count and generate a session. Answer, flag, skip and return using the numbered navigator. Refresh to check recovery.
3. Submit with unanswered questions; confirm the warning. Review answers and self-assess criteria. The overall score must stay pending until grading is complete.
4. Use the follow-up controls; unavailable harder/similar content must show a message rather than invent a new question.
5. Return to setup and open Full Practice A. Question 2 supports multiple selections; question 18 includes a graph and accessible data table.
6. Rate an imported flashcard; refresh and confirm it persists. Check that Legacy resources still exposes the old cards, tests and guide.
7. Open Revision resources, read the source corrections, tick a checklist item, and open/download the workbook.
8. Try phone and tablet widths and keyboard navigation. Export local progress before experimenting with reset.

## Source issues and limits

- E Q16: retain the documented diagram value of 30 cm instead of the inconsistent later 50 cm.
- E Q31: distinguish stored elastic potential energy from subsequent motion.
- C Q17: “push” is an analogy; voltage is energy per unit charge.
- Original STILE Energy Q8 graph and Q29 drawing remain unverified. Original replacement visuals from the pack are used; no claim of independent STILE visual verification is made.
- Both supplied papers contain 40% Hard marks, above the 30% preference. Actual distributions are displayed. They are proposed practice, not school-approved papers; timing and school policies remain unconfirmed.
- Fixed written questions only supply model responses; their marks remain self-assessed. Generated numerical final answers have machine-readable specifications; method marks remain self-assessed.
- Drawing tasks use paper plus an optional written description; no drawing editor or automatic diagram grading is included.
- No optional timer, accounts, cloud sync or guaranteed offline reopening is included.
- The supplied assessment selector specifically supports this blueprint's layout; another subject's assessment rules need their own reviewed selector.
- Real iOS Safari/Android device testing has not been performed. Chromium viewport checks are not device certification.

## Validation evidence

- 13 engine/storage tests pass, covering imported data, finite domains, filtering, diversity, exhaustion, blueprint compliance, marking, units, malformed content and recovery.
- Browser workflow checks pass under a GitHub Pages-style project prefix, including imported/legacy tools, self-assessment, numerical marking, storage failure, load retry, refresh recovery, mobile layout and loaded offline operation.
- Package validators pass for 83 fixed questions, 156 generated instances, both forms and 20 assessment-selection seeds; the independent checker covers all 102 numeric instances and 30 extended instances.
- Self-contained review export is tested over HTTP with additional resource requests blocked; direct file navigation could not be tested because this environment's Chromium policy blocks `file://` navigation.

No merge or deployment is authorised by this branch. The GitHub API returned Forbidden during the PR access check; a standalone preview and review bundle provide an alternative review path.
