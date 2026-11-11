import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  validatePack,
  selectQuestions,
  grade,
  summary,
  emptyProgress,
  loadProgress,
  saveProgress,
  KEY,
} from "../src/humanities/engine.mjs";
const read = (name) =>
  JSON.parse(
    fs.readFileSync(
      new URL(
        `../content/humanities/year-8/cycle-6/shogunate-japan/data/${name}.json`,
        import.meta.url,
      ),
    ),
  );
const pack = validatePack({
  topics: read("topics"),
  questions: read("questions"),
  cards: read("flashcards"),
  assessment: read("assessment"),
  sources: read("sources"),
  timeline: read("timeline"),
});
const settings = {
  topics: pack.topics.map((t) => t.id),
  types: ["multiple_choice", "short_answer"],
  difficulty: "Mixed",
  count: "10",
};
test("pack inventory, source dependencies and assessment marks validate", () => {
  assert.equal(pack.topics.length, 7);
  assert.equal(pack.questions.length, 56);
  assert.equal(pack.cards.length, 48);
  assert.equal(pack.assessment.questions.length, 11);
  assert.equal(
    pack.assessment.questions.reduce((n, q) => n + q.marks, 0),
    28,
  );
  assert.ok(pack.assessment.sources.A);
  assert.ok(pack.assessment.sources.B);
});
test("filters respect topics, difficulty and formats", () => {
  const s = {
    ...settings,
    topics: ["TERMS"],
    types: ["multiple_choice"],
    difficulty: "Easy",
  };
  const r = selectQuestions(pack, s);
  assert.equal(r.questions.length, 3);
  assert.match(r.notice, /Only/);
  for (const q of r.questions) {
    assert.equal(q.topic, "TERMS");
    assert.equal(q.type, "multiple_choice");
    assert.equal(q.difficulty, "Easy");
  }
});
test("unique bounded selection avoids recent questions when possible", () => {
  const first = selectQuestions(pack, settings).questions;
  const next = selectQuestions(
    pack,
    settings,
    first.map((q) => q.id),
  ).questions;
  assert.equal(new Set(next.map((q) => q.id)).size, 10);
  assert.ok(next.every((q) => !first.some((p) => p.id === q.id)));
  assert.ok(new Set(next.map((q) => q.topic)).size >= 6);
  const all = selectQuestions(pack, { ...settings, count: "all" });
  assert.equal(all.questions.length, 56);
  assert.match(
    selectQuestions(
      pack,
      { ...settings, count: "all" },
      all.questions.map((q) => q.id),
    ).notice,
    /recent/,
  );
});
test("no matching selection fails with a useful message", () => {
  assert.throws(
    () => selectQuestions(pack, { ...settings, topics: [] }),
    /Select/,
  );
  assert.throws(
    () =>
      selectQuestions(pack, {
        ...settings,
        types: ["multiple_choice"],
        difficulty: "Hard",
      }),
    /No questions/,
  );
});
test("automatic MC marking uses zero-based correctIndex and blank answers are zero", () => {
  const q = pack.questions[0];
  assert.equal(grade(q, { choice: q.correctIndex }).earned, 1);
  assert.equal(grade(q, { choice: (q.correctIndex + 1) % 4 }).earned, 0);
  assert.equal(grade(q, {}).skipped, true);
});
test("written answers remain pending until a valid self assessment", () => {
  const q = pack.questions.find((q) => q.type === "short_answer");
  assert.equal(grade(q, { text: "An explanation" }).pending, true);
  assert.equal(grade(q, { text: "An explanation" }, q.marks + 1).pending, true);
  assert.equal(grade(q, { text: "An explanation" }, q.marks).self, q.marks);
  assert.equal(grade(q, { text: "An explanation" }, 0).pending, false);
});
test("assessment summary separates automatic, self-assessed, skipped and pending", () => {
  const s = {
    questions: pack.assessment.questions,
    answers: { P01: { choice: 3 }, P11: { text: "A reasoned answer" } },
    marks: {},
  };
  let r = summary(s);
  assert.equal(r.total, 28);
  assert.equal(r.pending, 1);
  assert.equal(r.skipped, 9);
  assert.equal(r.auto, 1);
  s.marks.P11 = 6;
  r = summary(s);
  assert.equal(r.pending, 0);
  assert.equal(r.earned, 7);
  assert.equal(r.self, 6);
});
test("malformed content, duplicate IDs, missing sources and incorrect totals reject", () => {
  for (const change of [
    (p) => (p.questions[0].correctIndex = 99),
    (p) => (p.questions[0].choices[0] = p.questions[0].choices[1]),
    (p) => p.cards.push(p.cards[0]),
    (p) => (p.assessment.totalMarks = 99),
    (p) => delete p.assessment.sources.A,
    (p) => (p.questions[0].topic = "BAD"),
  ]) {
    const p = structuredClone(pack);
    change(p);
    assert.throws(() => validatePack(p));
  }
});
test("local progress roundtrip isolates Science; corrupt storage is preserved", () => {
  const m = new Map([["jadens-cycle6-v1", "science"]]);
  const storage = {
    getItem: (k) => m.get(k) || null,
    setItem: (k, v) => m.set(k, v),
  };
  const data = emptyProgress();
  data.ratings.F01 = "known";
  data.session = {
    id: "session",
    status: "active",
    started: "2026-11-11",
    questions: [pack.questions[0]],
    answers: { Q01: { choice: 0 } },
    marks: {},
    index: 0,
  };
  assert.equal(saveProgress(storage, data), "");
  const loaded = loadProgress(storage, pack);
  assert.equal(loaded.error, "");
  assert.deepEqual(loaded.data.session, data.session);
  assert.equal(m.get("jadens-cycle6-v1"), "science");
  storage.setItem(KEY, '{"version":99}');
  assert.ok(loadProgress(storage, pack).error);
  assert.equal(m.get(KEY), '{"version":99}');
  assert.match(
    saveProgress(
      {
        setItem() {
          throw Error();
        },
      },
      data,
    ),
    /could not/,
  );
});
