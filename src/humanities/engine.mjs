export const TYPES = [
  "multiple_choice",
  "short_answer",
  "source_analysis",
  "extended_response",
];
export const KEY = "jadens-shogunate-japan-v1";
export function validatePack(pack) {
  if (
    !pack ||
    ["topics", "questions", "cards", "timeline", "sources"].some(
      (k) => !Array.isArray(pack[k]),
    )
  )
    throw Error("Invalid revision pack collections.");
  const unique = (records, name) => {
    const ids = new Set();
    for (const r of records) {
      if (typeof r.id !== "string" || !r.id || ids.has(r.id))
        throw Error(`Invalid or duplicate ${name} ID.`);
      ids.add(r.id);
    }
    return ids;
  };
  const topics = unique(pack.topics, "topic");
  for (const t of pack.topics)
    for (const k of ["title", "notes", "goal", "oxford"])
      if (typeof t[k] !== "string" || !t[k].trim())
        throw Error(`Invalid topic ${t.id}.`);
  const paper = pack.assessment;
  if (
    !paper ||
    !Array.isArray(paper.questions) ||
    !Number.isInteger(paper.totalMarks) ||
    typeof paper.title !== "string" ||
    typeof paper.sources?.A !== "string" ||
    typeof paper.sources?.B !== "string"
  )
    throw Error("Invalid assessment.");
  unique([...pack.questions, ...paper.questions], "question");
  for (const q of [...pack.questions, ...paper.questions]) {
    if (
      !topics.has(q.topic) ||
      !["Easy", "Medium", "Hard"].includes(q.difficulty) ||
      !TYPES.includes(q.type) ||
      !Number.isInteger(q.marks) ||
      q.marks < 1
    )
      throw Error(`Invalid question metadata: ${q.id}.`);
    for (const k of ["prompt", "answer", "markingGuide"])
      if (typeof q[k] !== "string" || !q[k].trim())
        throw Error(`Missing ${k}: ${q.id}.`);
    if (
      q.type === "multiple_choice" &&
      (!Array.isArray(q.choices) ||
        q.choices.length < 2 ||
        q.choices.some((v) => typeof v !== "string" || !v.trim()) ||
        new Set(q.choices.map((v) => v.trim().toLowerCase())).size !==
          q.choices.length ||
        !Number.isInteger(q.correctIndex) ||
        q.correctIndex < 0 ||
        q.correctIndex >= q.choices.length)
    )
      throw Error(`Invalid choices: ${q.id}.`);
    if (q.type === "source_analysis" && !["P09", "P10"].includes(q.id))
      throw Error(`Missing source mapping: ${q.id}.`);
  }
  if (paper.questions.reduce((sum, q) => sum + q.marks, 0) !== paper.totalMarks)
    throw Error("Assessment marks do not match.");
  unique(pack.cards, "flashcard");
  for (const c of pack.cards)
    for (const k of ["front", "back", "romaji", "context"])
      if (typeof c[k] !== "string" || !c[k].trim())
        throw Error(`Invalid flashcard ${c.id}.`);
  for (const pair of pack.timeline)
    if (
      !Array.isArray(pair) ||
      pair.length !== 2 ||
      pair.some((v) => typeof v !== "string")
    )
      throw Error("Invalid timeline.");
  for (const s of pack.sources) {
    if (typeof s.title !== "string" || !/^https:\/\//.test(s.url))
      throw Error("Invalid source link.");
    new URL(s.url);
  }
  return pack;
}
export function selectQuestions(pack, settings, previous = []) {
  if (!settings.topics?.length || !settings.types?.length)
    throw Error("Select at least one topic and question format.");
  const pool = pack.questions.filter(
    (q) =>
      settings.topics.includes(q.topic) &&
      settings.types.includes(q.type) &&
      (settings.difficulty === "Mixed" || q.difficulty === settings.difficulty),
  );
  if (!pool.length) throw Error("No questions match. Broaden your selection.");
  const count = settings.count === "all" ? pool.length : Number(settings.count);
  if (!Number.isInteger(count) || count < 1)
    throw Error("Choose a valid question count.");
  const seen = new Set(previous),
    families = new Map(),
    result = [];
  let available = [...pool];
  while (available.length && result.length < count) {
    const scores = available
      .map((q) => ({
        q,
        score:
          (seen.has(q.id) ? -100 : 0) -
          (families.get(q.topic) || 0) * 5 +
          Math.random(),
      }))
      .sort((a, b) => b.score - a.score);
    const q = scores[0].q;
    result.push(q);
    available = available.filter((x) => x.id !== q.id);
    families.set(q.topic, (families.get(q.topic) || 0) + 1);
  }
  return {
    questions: result,
    notice:
      (result.length < count
        ? `Only ${result.length} matching questions are available. `
        : "") +
      (result.some((q) => seen.has(q.id))
        ? "Some questions have appeared in recent practice."
        : ""),
  };
}
export function answered(q, answer) {
  return q.type === "multiple_choice"
    ? Number.isInteger(answer?.choice)
    : Boolean(answer?.text?.trim());
}
export function grade(q, answer, marks) {
  if (!answered(q, answer))
    return {
      earned: 0,
      pending: false,
      auto: 0,
      autoMax: q.marks,
      self: 0,
      selfMax: 0,
      skipped: true,
    };
  if (q.type === "multiple_choice") {
    const earned = answer.choice === q.correctIndex ? q.marks : 0;
    return {
      earned,
      pending: false,
      auto: earned,
      autoMax: q.marks,
      self: 0,
      selfMax: 0,
      skipped: false,
    };
  }
  const valid = Number.isInteger(marks) && marks >= 0 && marks <= q.marks;
  return {
    earned: valid ? marks : 0,
    pending: !valid,
    auto: 0,
    autoMax: 0,
    self: valid ? marks : 0,
    selfMax: q.marks,
    skipped: false,
  };
}
export function summary(session) {
  const result = {
    earned: 0,
    total: 0,
    auto: 0,
    autoMax: 0,
    self: 0,
    selfMax: 0,
    pending: 0,
    skipped: 0,
    topics: {},
  };
  for (const q of session.questions) {
    const g = grade(q, session.answers[q.id], session.marks[q.id]);
    result.total += q.marks;
    for (const k of ["earned", "auto", "autoMax", "self", "selfMax"])
      result[k] += g[k];
    result.pending += Number(g.pending);
    result.skipped += Number(g.skipped);
    const row = (result.topics[q.topic] ??= {
      earned: 0,
      total: 0,
      pending: 0,
    });
    row.earned += g.earned;
    row.total += q.marks;
    row.pending += Number(g.pending);
  }
  return result;
}
export const emptyProgress = () => ({
  version: 1,
  ratings: {},
  checks: {},
  preferences: null,
  session: null,
  history: [],
});
export function loadProgress(storage, pack) {
  const initial = emptyProgress();
  let raw;
  try {
    raw = storage.getItem(KEY);
    if (!raw) return { data: initial, error: "" };
    const d = JSON.parse(raw);
    if (
      d.version !== 1 ||
      !d.ratings ||
      Array.isArray(d.ratings) ||
      !d.checks ||
      Array.isArray(d.checks) ||
      !Array.isArray(d.history)
    )
      throw Error();
    const ids = new Map(
      [...pack.questions, ...pack.assessment.questions].map((q) => [q.id, q]),
    );
    const restore = (s) => {
      if (
        !s ||
        typeof s.id !== "string" ||
        !["active", "submitted"].includes(s.status) ||
        !Array.isArray(s.questions) ||
        !s.questions.length ||
        !Number.isInteger(s.index) ||
        s.index < 0 ||
        s.index >= s.questions.length ||
        !s.answers ||
        !s.marks ||
        s.questions.some((q) => !ids.has(q.id))
      )
        throw Error();
      return { ...s, questions: s.questions.map((q) => ids.get(q.id)) };
    };
    return {
      data: {
        ...d,
        session: d.session ? restore(d.session) : null,
        history: d.history.map(restore).slice(-20),
      },
      error: "",
    };
  } catch {
    return {
      data: initial,
      error:
        "Saved Humanities progress could not be read. It has not been overwritten. Export your data before resetting.",
    };
  }
}
export function saveProgress(storage, data) {
  try {
    storage.setItem(
      KEY,
      JSON.stringify({ ...data, history: data.history.slice(-20) }),
    );
    return "";
  } catch {
    return "Progress could not be saved. Export it before closing this page.";
  }
}
