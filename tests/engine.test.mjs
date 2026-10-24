import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  prepareContent,
  assemble,
  filtered,
  markQuestion,
  summarize,
  validateQuestion,
} from "../src/cycle6/engine.mjs";
import {
  readStore,
  writeStore,
  emptyStore,
  STORAGE_KEY,
} from "../src/cycle6/storage.mjs";
import { validateAssessment } from "../content/science/year-8/cycle-6/runtime/assessment.mjs";
import {
  generate,
  combinations,
} from "../content/science/year-8/cycle-6/runtime/generator.mjs";
const read = (n) =>
  JSON.parse(
    fs.readFileSync(
      new URL("../content/science/year-8/cycle-6/data/" + n, import.meta.url),
    ),
  );
const data = {
  topics: read("topics.json"),
  questions: read("questions.json"),
  extended: read("extended_responses.json"),
  cards: read("flashcards.json"),
  blueprint: read("assessment_blueprints.json"),
  templates: [
    "numerical_templates.json",
    "conceptual_templates.json",
    "extended_templates.json",
  ].flatMap(read),
};
const content = prepareContent(data);
const settings = {
  formats: ["multiple_choice", "short_answer", "extended_response"],
  topics: content.topics.map((t) => t.id),
  difficulty: "Mixed",
  count: "10",
};
const session = (questions) => ({
  id: "test",
  status: "active",
  questions,
  answers: {},
  self: {},
  index: 0,
  settings,
  started: new Date().toISOString(),
});
test("complete pack validates and keeps all authored/generated instances", () => {
  assert.deepEqual(content.errors, []);
  assert.equal(content.fixed.length, 83);
  assert.equal(content.generated.length, 156);
  assert.equal(content.cards.length, 60);
});
test("all finite parameter combinations give valid questions and invalid variables reject", () => {
  for (const template of data.templates) {
    const all = combinations(template);
    for (const p of all) assert.ok(validateQuestion(generate(template, p)));
    assert.throws(() => generate(template, {}));
    assert.throws(() => generate(template, { ...all[0], extra: 1 }));
    const k = Object.keys(all[0])[0];
    assert.throws(() => generate(template, { ...all[0], [k]: "invalid" }));
  }
});
test("filtering respects requested topic, format and metadata difficulty", () => {
  const s = {
    ...settings,
    formats: ["multiple_choice"],
    topics: ["kinetic"],
    difficulty: "Medium",
  };
  const pool = filtered(content, s);
  assert.ok(pool.length);
  for (const q of pool) {
    assert.equal(q.format, "multiple_choice");
    assert.equal(q.topic, "kinetic");
    assert.equal(q.difficulty, "Medium");
  }
});
test("assembly provides unique prompts and a range of scenario families", () => {
  for (let i = 0; i < 30; i++) {
    const { items } = assemble(content, { ...settings, count: "30" });
    assert.equal(items.length, 30);
    assert.equal(new Set(items.map((q) => q.question_text)).size, 30);
    assert.ok(new Set(items.map((q) => q.scenario_family)).size >= 15);
  }
});
test("shortages and exhausted unique variations terminate with disclosure", () => {
  const result = assemble(content, {
    ...settings,
    formats: ["multiple_choice"],
    topics: ["kinetic"],
    difficulty: "Easy",
    count: "30",
  });
  assert.ok(result.items.length < 30);
  assert.match(result.notice, /Only/);
  const all = assemble(content, { ...settings, count: "all" });
  const again = assemble(content, { ...settings, count: "all" }, [
    session(all.items),
  ]);
  assert.match(again.notice, /repeated/);
  assert.equal(again.items.length, all.items.length);
  assert.throws(() => assemble(content, { ...settings, topics: [] }), /Select/);
});
test("fixed and generated whole-unit assessments satisfy blueprint", () => {
  for (const mode of ["FORM-A", "FORM-B", "full"]) {
    const result = assemble(content, settings, [], mode);
    assert.equal(result.items.length, 21);
    assert.ok(validateAssessment(result.items, data.blueprint).valid);
  }
});
test("multi-select is exact-set and rejects duplicate/partial selections", () => {
  const q = content.fixed.find((q) => q.id === "MC03");
  assert.equal(
    markQuestion(q, { options: q.correct_answer.option_ids }).earned,
    1,
  );
  assert.equal(markQuestion(q, { options: ["A"] }).earned, 0);
  assert.equal(markQuestion(q, { options: ["A", "A"] }).earned, 0);
});
test("numeric conversion, tolerance, method assessment and invalid inputs", () => {
  const q = content.generated.find((q) => q.template_id === "N01");
  const c = q.correct_answer;
  assert.equal(
    markQuestion(q, { value: String(c.rounded_value), unit: "joules" }).auto,
    1,
  );
  assert.equal(
    markQuestion(q, { value: String(c.value / 1000), unit: "kJ" }, { 0: true })
      .earned,
    2,
  );
  assert.equal(
    markQuestion(q, {
      value: String(c.value + c.absolute_tolerance * 2 + 0.001),
      unit: "J",
    }).auto,
    0,
  );
  for (const value of ["", "NaN", "1garbage", "Infinity"])
    assert.equal(markQuestion(q, { value, unit: "J" }).auto, 0);
  assert.equal(markQuestion(q, { value: String(c.value), unit: "A" }).auto, 0);
  assert.equal(
    markQuestion(q, { value: String(c.value), unit: "J" }).pending,
    true,
  );
});
test("pending self assessment prevents complete overall score and unanswered receives zero", () => {
  const q = content.fixed.find((q) => q.id === "SA01");
  const s = session([q]);
  assert.equal(summarize(s).skipped, 1);
  s.answers[q.id] = { text: "answer" };
  assert.equal(summarize(s).pending, 1);
  s.self[q.id] = Object.fromEntries(q.marking_rubric.map((r, i) => [i, true]));
  assert.equal(summarize(s).pending, 0);
  assert.equal(summarize(s).earned, q.marks);
});
test("follow-up selection targets mistakes and uses higher metadata difficulty", () => {
  const q = content.fixed.find((q) => q.id === "MC04");
  const s = session([q]);
  for (const mode of ["mistakes", "similar", "harder"]) {
    const r = assemble(content, settings, [], mode, s);
    assert.ok(r.items.every((x) => x.topic === q.topic));
    if (mode === "harder")
      assert.ok(r.items.every((x) => x.difficulty !== "Easy"));
  }
  s.answers[q.id] = { options: q.correct_answer.option_ids };
  assert.throws(
    () => assemble(content, settings, [], "mistakes", s),
    /No mistakes/,
  );
});
test("malformed questions, duplicate IDs and unsafe paths reject", () => {
  const bad = structuredClone(data);
  bad.questions[0].options[0].text = bad.questions[0].options[1].text;
  bad.questions.push(data.questions[1]);
  bad.questions[2].supporting_data = { asset: "../evil.svg" };
  const r = prepareContent(bad);
  assert.ok(r.errors.length >= 3);
  assert.throws(() =>
    validateQuestion({ ...content.fixed[0], correct_answer: null }),
  );
  assert.throws(() => validateQuestion({ ...content.fixed[0], marks: 100 }));
});
test("storage roundtrip recovers exact answers and isolates legacy data", () => {
  const map = new Map([["jadens-revision-lab-v2", "legacy"]]);
  const storage = {
    getItem: (k) => map.get(k) || null,
    setItem: (k, v) => map.set(k, v),
  };
  const d = emptyStore();
  d.active = session([content.fixed[0]]);
  d.active.answers[d.active.questions[0].id] = { options: ["A"] };
  assert.equal(writeStore(storage, d), "");
  assert.deepEqual(readStore(storage).data.active, d.active);
  assert.equal(map.get("jadens-revision-lab-v2"), "legacy");
  storage.setItem(STORAGE_KEY, '{"version":99}');
  assert.ok(readStore(storage).error);
  assert.ok(
    writeStore(
      {
        setItem() {
          throw Error();
        },
      },
      d,
    ),
  );
});

test("dimensionless energy factors accept a unitless answer", () => {
  const q = content.generated.find((q) => q.template_id === "N12");
  assert.equal(
    markQuestion(q, { value: String(q.correct_answer.value), unit: "" }).auto,
    1,
  );
});
