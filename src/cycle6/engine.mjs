import {
  combinations,
  generate,
  checkNumeric,
  checkOptions,
} from "../../content/science/year-8/cycle-6/runtime/generator.mjs";
import {
  selectAssessment,
  validateAssessment,
} from "../../content/science/year-8/cycle-6/runtime/assessment.mjs";
export const FORMATS = ["multiple_choice", "short_answer", "extended_response"];
export const ENERGY = [
  "foundations",
  "forms",
  "kinetic",
  "potential",
  "transfers",
  "efficiency",
];
export const ELECTRICITY = ["circuits", "quantities", "ohm", "networks"];
export const label = (s) =>
  s.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
export function validateQuestion(q, topicIds) {
  const fail = (reason) => {
    throw Error(`${q?.id || "Unknown question"}: ${reason}`);
  };
  if (!q || typeof q !== "object" || typeof q.id !== "string" || !q.id)
    fail("Missing ID");
  for (const key of [
    "question_text",
    "explanation",
    "subject",
    "unit",
    "scenario_family",
    "cognitive_skill",
    "topic",
    "subtopic",
  ])
    if (typeof q[key] !== "string" || !q[key]) fail(`Missing ${key}`);
  if (
    q.schema_version !== "1.0.0" ||
    !Number.isInteger(q.year_level) ||
    !["Easy", "Medium", "Hard"].includes(q.difficulty) ||
    !FORMATS.includes(q.format)
  )
    fail("Unsupported metadata");
  if (topicIds && !topicIds.has(q.topic)) fail("Unknown topic");
  if (
    !Number.isInteger(q.marks) ||
    q.marks < 1 ||
    !Array.isArray(q.marking_rubric) ||
    !q.marking_rubric.length
  )
    fail("Invalid marks");
  if (
    q.marking_rubric.some(
      (r) =>
        !Number.isInteger(r.marks) ||
        r.marks < 1 ||
        typeof r.criterion !== "string",
    ) ||
    q.marking_rubric.reduce((s, r) => s + r.marks, 0) !== q.marks
  )
    fail("Rubric mismatch");
  if (
    !Array.isArray(q.source_reference) ||
    !q.source_reference.length ||
    q.source_reference.some((x) => typeof x !== "string") ||
    !["source_supported", "source_elaboration", "added_practice"].includes(
      q.source_alignment_status,
    )
  )
    fail("Invalid sources");
  if (!q.correct_answer) fail("Missing answer");
  if (q.format === "multiple_choice") {
    if (
      !Array.isArray(q.options) ||
      q.options.length < 2 ||
      q.options.some(
        (o) => typeof o.id !== "string" || typeof o.text !== "string",
      ) ||
      new Set(q.options.map((o) => o.id)).size !== q.options.length ||
      new Set(q.options.map((o) => o.text.trim().toLowerCase())).size !==
        q.options.length
    )
      fail("Invalid or duplicate options");
    const ids = q.correct_answer.option_ids;
    if (
      !Array.isArray(ids) ||
      !ids.length ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !q.options.some((o) => o.id === id)) ||
      !["single", "multiple"].includes(q.selection_mode) ||
      (q.selection_mode === "single") !== (ids.length === 1)
    )
      fail("Invalid correct options");
  } else if (typeof q.correct_answer.model_response !== "string")
    fail("Missing model");
  if (
    "value" in q.correct_answer &&
    (!Number.isFinite(q.correct_answer.value) ||
      !Number.isFinite(q.correct_answer.absolute_tolerance) ||
      q.correct_answer.absolute_tolerance < 0 ||
      typeof q.correct_answer.unit !== "string" ||
      q.format !== "short_answer" ||
      q.marking_rubric.length !== 2 ||
      q.marks !== 2)
  )
    fail("Invalid numeric marking contract");
  if (
    q.parts &&
    (!Array.isArray(q.parts) ||
      q.parts.reduce((n, p) => n + p.marks, 0) !== q.marks ||
      q.parts.some(
        (p) =>
          typeof p.text !== "string" ||
          !p.id ||
          q.marking_rubric
            .filter((r) => r.part === p.id)
            .reduce((n, r) => n + r.marks, 0) !== p.marks,
      ))
  )
    fail("Invalid parts");
  const d = q.supporting_data;
  if (d?.asset && !/^assets\/[a-z0-9-]+\.svg$/.test(d.asset))
    fail("Unsafe asset");
  if (
    d?.rows &&
    (!Array.isArray(d.columns) ||
      !Array.isArray(d.rows) ||
      d.rows.some(
        (row) =>
          !Array.isArray(row) ||
          row.length !== d.columns.length ||
          row.some((v) => !["string", "number"].includes(typeof v)),
      ))
  )
    fail("Invalid table");
  return q;
}
export function prepareContent(data) {
  const ids = new Set(),
    topicIds = new Set(data.topics.map((t) => t.id)),
    errors = [];
  const valid = (q) => {
    try {
      validateQuestion(q, topicIds);
      if (ids.has(q.id)) throw Error(`Duplicate ID ${q.id}`);
      ids.add(q.id);
      return true;
    } catch (e) {
      errors.push(e.message);
      return false;
    }
  };
  const fixed = [...data.questions, ...data.extended].filter(valid),
    generated = [];
  for (const t of data.templates) {
    try {
      const defs = Object.values(t.variable_definitions || {});
      if (
        !defs.length ||
        defs.some(
          (d) => !Array.isArray(d.allowed_values) || !d.allowed_values.length,
        ) ||
        defs.reduce((n, d) => n * d.allowed_values.length, 1) > 5000
      )
        throw Error("Invalid or excessive domain");
      for (const p of combinations(t)) {
        const q = generate(t, p);
        if (valid(q)) generated.push(q);
      }
    } catch (e) {
      errors.push(`${t.template_id}: ${e.message}`);
    }
  }
  const cardIds = new Set();
  const cards = data.cards.filter((c) => {
    if (
      typeof c.id !== "string" ||
      cardIds.has(c.id) ||
      !topicIds.has(c.topic) ||
      typeof c.front !== "string" ||
      typeof c.back !== "string"
    ) {
      errors.push(`Invalid card ${c.id}`);
      return false;
    }
    cardIds.add(c.id);
    return true;
  });
  return { ...data, fixed, generated, cards, errors };
}
export function filtered(content, settings) {
  return [...content.fixed, ...content.generated].filter(
    (q) =>
      settings.formats.includes(q.format) &&
      settings.topics.includes(q.topic) &&
      (settings.difficulty === "Mixed" || q.difficulty === settings.difficulty),
  );
}
export function assemble(
  content,
  settings,
  history = [],
  mode = "new",
  previous = null,
) {
  if (!settings.formats?.length || !settings.topics?.length)
    throw Error("Select at least one format and one topic.");
  if (mode === "full" || mode === "FORM-A" || mode === "FORM-B") {
    const bp = content.blueprint;
    if (mode !== "full") {
      const form = bp.forms.find((f) => f.id === mode);
      if (!form) throw Error("Unknown paper");
      const map = new Map(content.fixed.map((q) => [q.id, q]));
      const items = [...form.mc, ...form.sa, ...form.er].map((id) =>
        map.get(id),
      );
      if (items.some((x) => !x) || !validateAssessment(items, bp).valid)
        throw Error(
          "Paper is unavailable because required content is invalid.",
        );
      return {
        items,
        notice: "40-mark whole-unit practice; actual difficulty varies.",
        mode,
      };
    }
    const selected = selectAssessment(content.fixed, bp, {
      seed: Math.floor(Math.random() * 2 ** 32),
      history: history.flatMap((s) => s.questions.map((q) => q.id)),
    });
    return {
      items: selected.items,
      notice: "40-mark whole-unit practice; actual difficulty varies.",
      mode,
    };
  }
  let pool = filtered(content, settings),
    notice = "";
  if (["mistakes", "similar", "harder"].includes(mode) && previous) {
    const weak = previous.questions.filter((q) => {
      const m = markQuestion(q, previous.answers[q.id], previous.self[q.id]);
      return m.pending || m.earned < q.marks;
    });
    if (!weak.length)
      throw Error("No mistakes or incomplete responses to target.");
    if (mode === "mistakes")
      pool = pool.filter((q) => weak.some((w) => w.topic === q.topic));
    if (mode === "similar")
      pool = pool.filter((q) =>
        weak.some(
          (w) =>
            (w.template_id && w.template_id === q.template_id) ||
            w.scenario_family === q.scenario_family,
        ),
      );
    if (mode === "harder") {
      const ranks = { Easy: 0, Medium: 1, Hard: 2 };
      pool = [...content.fixed, ...content.generated].filter(
        (q) =>
          settings.formats.includes(q.format) &&
          settings.topics.includes(q.topic) &&
          weak.some(
            (w) =>
              w.topic === q.topic && ranks[q.difficulty] > ranks[w.difficulty],
          ),
      );
    }
  }
  const unique = new Map();
  for (const q of pool) {
    const key = q.question_text.trim().toLowerCase();
    if (!unique.has(key)) unique.set(key, q);
  }
  pool = [...unique.values()];
  if (!pool.length)
    throw Error(
      "No matching questions are available. Try broader topics, formats or difficulty.",
    );
  const requested =
    settings.count === "all" ? pool.length : Number(settings.count);
  if (!Number.isInteger(requested) || requested < 1)
    throw Error("Choose a valid question count.");
  const recent = history.slice(-10).flatMap((s) => s.questions),
    seen = new Set(recent.map((q) => q.id));
  if (previous) previous.questions.forEach((q) => seen.add(q.id));
  const recentFamilies = new Map();
  for (const q of recent)
    recentFamilies.set(
      q.scenario_family,
      (recentFamilies.get(q.scenario_family) || 0) + 1,
    );
  const chosen = [],
    families = new Map(),
    skills = new Map(),
    topics = new Map();
  while (pool.length && chosen.length < requested) {
    const score = (q) =>
      (seen.has(q.id) ? -100 : 0) -
      (recentFamilies.get(q.scenario_family) || 0) * 2 -
      (families.get(q.scenario_family) || 0) * 12 -
      (skills.get(q.cognitive_skill) || 0) * 3 -
      (topics.get(q.topic) || 0) * 4 +
      Math.random();
    const ranked = pool
      .map((q) => ({ q, score: score(q) }))
      .sort((a, b) => b.score - a.score);
    const q = ranked[0].q;
    chosen.push(q);
    pool = pool.filter((x) => x.id !== q.id);
    for (const [map, key] of [
      [families, q.scenario_family],
      [skills, q.cognitive_skill],
      [topics, q.topic],
    ])
      map.set(key, (map.get(key) || 0) + 1);
  }
  if (chosen.length < requested)
    notice = `Only ${chosen.length} unique matching questions are available; this session uses all of them. `;
  if (chosen.some((q) => seen.has(q.id)))
    notice +=
      "Some previously attempted questions are repeated because of the available content.";
  return { items: chosen, notice, mode };
}
export function hasAnswer(q, a) {
  return q.format === "multiple_choice"
    ? Array.isArray(a?.options) && a.options.length > 0
    : Boolean(String(a?.text || a?.value || "").trim());
}
export function normalizeUnit(value, unit, target) {
  const aliases = {
    joule: "J",
    joules: "J",
    j: "J",
    kj: "kJ",
    kilojoules: "kJ",
    amp: "A",
    amps: "A",
    ampere: "A",
    amperes: "A",
    a: "A",
    ma: "mA",
    volt: "V",
    volts: "V",
    v: "V",
    mv: "mV",
    ohm: "Ω",
    ohms: "Ω",
    omega: "Ω",
    percent: "%",
    percentage: "%",
    times: "",
    multiplier: "",
  };
  const u = aliases[unit.trim().toLowerCase()] ?? unit.trim(),
    factors = {
      J: ["energy", 1],
      kJ: ["energy", 1000],
      A: ["current", 1],
      mA: ["current", 0.001],
      V: ["voltage", 1],
      mV: ["voltage", 0.001],
      Ω: ["resistance", 1],
      kΩ: ["resistance", 1000],
    };
  if (
    u === target ||
    (target === "factor" &&
      ["", "times", "multiplier"].includes(unit.trim().toLowerCase()))
  )
    return { value, unit: target };
  if (
    factors[u] &&
    factors[target] &&
    factors[u][0] === factors[target][0] &&
    /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(String(value).trim())
  )
    return {
      value: String((Number(value) * factors[u][1]) / factors[target][1]),
      unit: target,
    };
  return { value, unit: u };
}
export function markQuestion(q, a, self = {}) {
  if (!hasAnswer(q, a))
    return {
      earned: 0,
      auto: 0,
      autoMax: q.marks,
      self: 0,
      selfMax: 0,
      pending: false,
      skipped: true,
    };
  if (q.format === "multiple_choice") {
    const earned = checkOptions(q, a.options) ? q.marks : 0;
    return {
      earned,
      auto: earned,
      autoMax: q.marks,
      self: 0,
      selfMax: 0,
      pending: false,
    };
  }
  const numeric = "value" in q.correct_answer,
    criteria = numeric ? q.marking_rubric.slice(0, -1) : q.marking_rubric;
  const normalized = numeric
    ? normalizeUnit(a.value || "", a.unit || "", q.correct_answer.unit)
    : null;
  const auto =
    numeric && checkNumeric(q, normalized.value, normalized.unit) ? 1 : 0;
  const awarded = criteria.reduce(
      (s, r, i) => s + (self[i] === true ? r.marks : 0),
      0,
    ),
    pending = criteria.some((r, i) => typeof self[i] !== "boolean");
  return {
    earned: auto + awarded,
    auto,
    autoMax: numeric ? 1 : 0,
    self: awarded,
    selfMax: criteria.reduce((n, r) => n + r.marks, 0),
    pending,
  };
}
export function summarize(session) {
  const out = {
    total: 0,
    earned: 0,
    auto: 0,
    autoMax: 0,
    self: 0,
    selfMax: 0,
    pending: 0,
    skipped: 0,
    topic: {},
    format: {},
    difficulty: {},
  };
  for (const q of session.questions) {
    const m = markQuestion(q, session.answers[q.id], session.self[q.id]);
    out.total += q.marks;
    for (const k of ["earned", "auto", "autoMax", "self", "selfMax"])
      out[k] += m[k];
    out.pending += Number(m.pending);
    out.skipped += Number(Boolean(m.skipped));
    for (const dimension of ["topic", "format", "difficulty"]) {
      const row = (out[dimension][q[dimension]] ??= {
        earned: 0,
        total: 0,
        pending: 0,
      });
      row.earned += m.earned;
      row.total += q.marks;
      row.pending += Number(m.pending);
    }
  }
  return out;
}
