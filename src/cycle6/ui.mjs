import {
  prepareContent,
  filtered,
  assemble,
  hasAnswer,
  markQuestion,
  summarize,
  FORMATS,
  ENERGY,
  ELECTRICITY,
  label,
} from "./engine.mjs";
import { readStore, writeStore, emptyStore, STORAGE_KEY } from "./storage.mjs";
const root = new URL("../../content/science/year-8/cycle-6/", import.meta.url);
const read = async (name, json = true) => {
  const response = await fetch(new URL(name, root));
  if (!response.ok) throw Error(`Could not load ${name} (${response.status})`);
  return json ? response.json() : response.text();
};
let content,
  loadingError = "",
  host,
  section,
  topic = "all",
  store,
  error = "",
  locked = false,
  notice = "",
  cardIndex = 0,
  flipped = false,
  cardFilter = "all",
  showSetup = false;
try {
  const result = readStore(localStorage);
  store = result.data;
  error = result.error;
  locked = Boolean(error);
} catch {
  store = emptyStore();
  error =
    "Browser storage is unavailable. Progress will last only while this page is open.";
}
const h = (tag, text, attrs = {}) => {
  const el = document.createElement(tag);
  if (text !== null && text !== undefined) el.textContent = text;
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (v !== false && v !== undefined)
      el.setAttribute(k, v === true ? "" : String(v));
  }
  return el;
};
const add = (parent, ...children) => {
  parent.append(...children);
  return parent;
};
const button = (text, fn, secondary = false) =>
  h("button", text, {
    type: "button",
    class: `btn${secondary ? " secondary" : ""}`,
    onclick: fn,
  });
function save() {
  if (locked) return;
  error = writeStore(localStorage, store);
  let banner = document.getElementById("pack-storage-warning");
  if (banner) {
    banner.textContent = error;
    banner.hidden = !error;
  }
}
function finish() {
  store.history = store.history.filter((s) => s.id !== store.active.id);
  store.history.push(structuredClone(store.active));
  store.history = store.history.slice(-20);
  save();
}
function heading(text) {
  const title = h("h2", text, { tabindex: "-1" });
  host.append(title);
  return title;
}
function redraw(focus = false) {
  if (!host?.isConnected) return;
  const active = host.contains(document.activeElement)
    ? document.activeElement
    : null;
  const previous = active
    ? {
        text: active.textContent,
        label: active.getAttribute("aria-label"),
        flash: active.classList.contains("flash"),
      }
    : null;
  render();
  if (focus) host.querySelector("h2")?.focus();
  else if (previous) {
    const candidates = [...host.querySelectorAll("button, select, input")];
    const match = previous.flash
      ? host.querySelector(".flash")
      : candidates.find((el) =>
          previous.label
            ? el.getAttribute("aria-label") === previous.label
            : el.tagName === "BUTTON" && el.textContent === previous.text,
        );
    match?.focus();
  }
}
function selectedTopics() {
  return topic === "energy"
    ? ENERGY
    : topic === "electricity"
      ? ELECTRICITY
      : content.topics.map((t) => t.id);
}
function defaults() {
  const p = store.preferences;
  return {
    formats: Array.isArray(p?.formats)
      ? p.formats.filter((f) => FORMATS.includes(f))
      : [...FORMATS],
    difficulty: ["Easy", "Medium", "Hard", "Mixed"].includes(p?.difficulty)
      ? p.difficulty
      : "Mixed",
    count: ["5", "10", "20", "30", "all"].includes(String(p?.count))
      ? String(p.count)
      : "10",
    topics:
      p?.contextTopic === topic && Array.isArray(p.topics)
        ? p.topics.filter((id) => content.topics.some((t) => t.id === id))
        : selectedTopics(),
  };
}
function makeSession(settings, mode = "new", previous = store.active) {
  store.preferences = settings;
  try {
    const result = assemble(content, settings, store.history, mode, previous);
    store.preferences = settings;
    store.active = {
      id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
      status: "active",
      settings,
      mode,
      questions: structuredClone(result.items),
      answers: {},
      self: {},
      index: 0,
      started: new Date().toISOString(),
    };
    notice = result.notice;
    showSetup = false;
    save();
    redraw(true);
  } catch (e) {
    notice = e.message;
    redraw();
  }
}
function summaryText(questions) {
  const counts = {};
  for (const q of questions)
    counts[q.difficulty] = (counts[q.difficulty] || 0) + q.marks;
  return `${questions.length} questions · ${questions.reduce((s, q) => s + q.marks, 0)} marks · ${Object.entries(
    counts,
  )
    .map(([k, v]) => `${k}: ${v} marks`)
    .join(" · ")}`;
}
function management() {
  const details = h("details");
  details.append(h("summary", "Progress, history and data"));
  details.append(
    h(
      "p",
      "Progress is stored in this browser only. Clearing browser data or switching devices can lose it. The most recent 20 sessions are retained. Legacy progress is stored separately.",
    ),
  );
  details.append(
    button(
      "Export progress",
      () => {
        const blob = new Blob(
          [
            JSON.stringify(
              {
                pack: store,
                rawImported: localStorage.getItem(STORAGE_KEY),
                legacy: localStorage.getItem("jadens-revision-lab-v2"),
              },
              null,
              2,
            ),
          ],
          { type: "application/json" },
        );
        const url = URL.createObjectURL(blob),
          a = h("a", "", {
            href: url,
            download: "jadens-revision-progress.json",
          });
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      true,
    ),
  );
  details.append(
    button(
      "Clear question history",
      () => {
        if (
          confirm(
            "Clear completed imported sessions and repetition history? Flashcards and your current session will remain.",
          )
        ) {
          store.history = [];
          save();
          redraw();
        }
      },
      true,
    ),
  );
  details.append(
    button(
      "Reset imported progress",
      () => {
        if (
          confirm(
            "Delete imported sessions, preferences, flashcard ratings and checklists? Legacy progress will remain.",
          )
        ) {
          store = emptyStore();
          locked = false;
          showSetup = false;
          save();
          redraw();
        }
      },
      true,
    ),
  );
  if (store.history.length) {
    const list = h("ul");
    for (const s of [...store.history].reverse()) {
      const score = summarize(s);
      const row = h("li");
      row.append(
        button(
          `${new Date(s.started).toLocaleDateString("en-AU")} · ${score.pending ? "Awaiting self-assessment" : Math.round((score.earned / score.total) * 100) + "%"} · ${s.questions.length} questions`,
          () => {
            if (
              store.active?.status === "active" &&
              !confirm(
                "Replace the current unfinished session with this saved review?",
              )
            )
              return;
            store.active = structuredClone(s);
            showSetup = false;
            save();
            redraw(true);
          },
          true,
        ),
      );
      list.append(row);
    }
    details.append(list);
  }
  host.append(details);
}
function setup() {
  heading("Create your practice");
  host.append(
    h(
      "p",
      "Choose the formats and topics you want. Questions come from the Cycle 6 pack and its finite procedural templates.",
    ),
  );
  if (store.active) {
    host.append(
      button(
        store.active.status === "active"
          ? "Resume saved session"
          : "Return to results",
        () => {
          showSetup = false;
          redraw(true);
        },
        true,
      ),
    );
  }
  let settings = defaults();
  const form = h("form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    start("new");
  });
  const fields = {};
  const group = (legend, items, values) => {
    const fieldset = h("fieldset");
    fieldset.append(h("legend", legend));
    fields[legend] = [];
    for (const [id, text] of items) {
      const input = h("input", null, { type: "checkbox", value: id });
      input.checked = values.includes(id);
      input.addEventListener("change", available);
      fields[legend].push(input);
      fieldset.append(
        add(
          h("label", null, { class: "pack-choice" }),
          input,
          document.createTextNode(" " + text),
        ),
      );
    }
    form.append(fieldset);
  };
  group(
    "Question formats",
    FORMATS.map((f) => [f, label(f)]),
    settings.formats,
  );
  group(
    "Topics",
    content.topics.map((t) => [t.id, t.title]),
    settings.topics,
  );
  const difficulty = h("select", null, { id: "pack-difficulty" });
  for (const d of ["Easy", "Medium", "Hard", "Mixed"])
    difficulty.append(h("option", d, { value: d }));
  difficulty.value = settings.difficulty;
  difficulty.addEventListener("change", available);
  const count = h("select", null, { id: "pack-count" });
  for (const n of ["5", "10", "20", "30", "all"])
    count.append(h("option", n === "all" ? "All available" : n, { value: n }));
  count.value = settings.count;
  form.append(
    add(h("label", "Difficulty "), difficulty),
    add(h("label", "Question count "), count),
  );
  const availability = h("p", null, { "aria-live": "polite" });
  form.append(availability);
  const collect = () => ({
    contextTopic: topic,
    formats: fields["Question formats"]
      .filter((i) => i.checked)
      .map((i) => i.value),
    topics: fields.Topics.filter((i) => i.checked).map((i) => i.value),
    difficulty: difficulty.value,
    count: count.value,
  });
  function available() {
    settings = collect();
    availability.textContent = `${filtered(content, settings).length} matching instances available. Numerical variants may share the same scenario family.`;
  }
  function start(mode) {
    if (
      store.active?.status === "active" &&
      !confirm(
        "Replace the unfinished session? Its current answers will be removed.",
      )
    )
      return;
    makeSession(collect(), mode);
  }
  form.append(
    h("button", "Generate New Practice", { type: "submit", class: "btn" }),
  );
  host.append(form);
  available();
  const full = h("section", null, { class: "panel" });
  full.append(
    h("h3", "Full Practice — whole unit"),
    h(
      "p",
      "21 questions · 40 marks. Ten multiple choice, nine short answers and two extended responses. Suggested time: 45–55 minutes. These are proposed practice assessments, not school-approved exams. Full Practice uses all formats and unit coverage independently of the custom filters.",
    ),
  );
  for (const [mode, text] of [
    ["FORM-A", "Full Practice A"],
    ["FORM-B", "Full Practice B"],
    ["full", "Generate Full Practice"],
  ])
    full.append(button(text, () => start(mode), true));
  full.append(
    h(
      "p",
      "Forms A and B each contain 40% Hard marks. Difficulty targets are preferences; actual marks are shown before answering.",
    ),
  );
  host.append(full);
  management();
}
function supporting(parent, q) {
  const d = q.supporting_data;
  if (!d) return;
  if (d.asset)
    parent.append(
      h("img", null, {
        src: new URL(d.asset, root),
        alt: d.alt || "Supporting science diagram",
        class: "pack-diagram",
      }),
    );
  if (d.rows) {
    const wrap = h("div", null, { class: "pack-table-wrap" }),
      table = h("table");
    table.append(h("caption", "Question data"));
    const head = h("tr");
    for (const c of d.columns) head.append(h("th", c, { scope: "col" }));
    table.append(add(h("thead"), head));
    const body = h("tbody");
    for (const row of d.rows) {
      const tr = h("tr");
      for (const cell of row) tr.append(h("td", String(cell)));
      body.append(tr);
    }
    table.append(body);
    wrap.append(table);
    parent.append(wrap);
  }
  if (d.type === "energy_bar_task") {
    const table = h("table");
    table.append(h("caption", "Energy budget (J)"));
    for (const [name, values] of Object.entries({
      Initial: d.initial,
      "Final known": d.final_known,
    })) {
      for (const [k, v] of Object.entries(values)) {
        table.append(
          add(
            h("tr"),
            h("th", `${name}: ${label(k)}`, { scope: "row" }),
            h("td", String(v)),
          ),
        );
      }
    }
    parent.append(table);
  }
}
function takeTest() {
  const s = store.active,
    q = s.questions[s.index];
  heading(`Question ${s.index + 1} of ${s.questions.length}`);
  host.append(h("p", summaryText(s.questions), { class: "note" }));
  const stats = h("p", null, { "aria-live": "polite" });
  host.append(stats);
  const updateStats = () => {
    const answered = s.questions.filter((x) =>
      hasAnswer(x, s.answers[x.id]),
    ).length;
    stats.textContent = `${answered} answered · ${s.questions.length - answered} unanswered · ${q.marks} marks · ${q.difficulty} · ${label(q.format)}`;
  };
  updateStats();
  const nav = h("nav", null, {
    "aria-label": "Question navigation",
    class: "pack-navigator",
  });
  for (const [i, item] of s.questions.entries()) {
    const a = hasAnswer(item, s.answers[item.id]);
    const b = button(
      `${i + 1}${a ? " ✓" : ""}${s.flags?.[item.id] ? " ⚑" : ""}`,
      () => {
        s.index = i;
        save();
        redraw(true);
      },
      true,
    );
    b.setAttribute(
      "aria-label",
      `Question ${i + 1}, ${a ? "answered" : "unanswered"}${s.flags?.[item.id] ? ", flagged" : ""}`,
    );
    if (i === s.index) b.setAttribute("aria-current", "step");
    nav.append(b);
  }
  host.append(nav);
  host.append(h("h3", q.question_text));
  supporting(host, q);
  if (q.parts) {
    const list = h("ol", null, { type: "a" });
    for (const part of q.parts)
      list.append(h("li", `${part.text} (${part.marks} marks)`));
    host.append(list);
  }
  const inputArea = h("div", null, { class: "pack-answer" });
  const answer = s.answers[q.id] || {};
  const record = (a) => {
    s.answers[q.id] = a;
    delete s.self[q.id];
    save();
    updateStats();
    const b = nav.children[s.index];
    b.textContent = `${s.index + 1}${hasAnswer(q, a) ? " ✓" : ""}${s.flags?.[q.id] ? " ⚑" : ""}`;
    b.setAttribute(
      "aria-label",
      `Question ${s.index + 1}, ${hasAnswer(q, a) ? "answered" : "unanswered"}`,
    );
  };
  if (q.format === "multiple_choice") {
    const fieldset = h("fieldset");
    fieldset.append(
      h(
        "legend",
        q.selection_mode === "multiple"
          ? "Select all correct answers. Exact-set marking: one mark only if the complete selection is correct."
          : "Select one answer.",
      ),
    );
    for (const option of q.options) {
      const input = h("input", null, {
        type: q.selection_mode === "multiple" ? "checkbox" : "radio",
        name: "pack-options",
        value: option.id,
      });
      input.checked = answer.options?.includes(option.id) || false;
      input.addEventListener("change", () =>
        record({
          options: [...fieldset.querySelectorAll("input:checked")].map(
            (x) => x.value,
          ),
        }),
      );
      fieldset.append(
        add(
          h("label", null, { class: "option" }),
          input,
          document.createTextNode(option.text),
        ),
      );
    }
    inputArea.append(fieldset);
  } else if ("value" in q.correct_answer) {
    const value = h("input", null, {
      type: "text",
      inputmode: "decimal",
      id: "pack-value",
      autocomplete: "off",
    });
    value.value = answer.value || "";
    const unit = h("input", null, {
      type: "text",
      id: "pack-unit",
      autocomplete: "off",
    });
    unit.value = answer.unit || "";
    const working = h("textarea", null, { id: "pack-working" });
    working.value = answer.text || "";
    const change = () =>
      record({ value: value.value, unit: unit.value, text: working.value });
    for (const el of [value, unit, working])
      el.addEventListener("input", change);
    inputArea.append(
      add(h("label", "Numerical answer "), value),
      add(
        h(
          "label",
          `Unit${["", "factor"].includes(q.correct_answer.unit) ? " (dimensionless; leave blank)" : ""} `,
        ),
        unit,
      ),
      add(h("label", "Working (for method self-assessment) "), working),
    );
  } else {
    const response = h("textarea", null, {
      id: "pack-response",
      "aria-label": "Your answer",
    });
    response.value = answer.text || "";
    response.addEventListener("input", () => record({ text: response.value }));
    inputArea.append(response);
    if (
      q.cognitive_skill === "Graph construction" ||
      q.question_text.toLowerCase().includes("draw")
    )
      inputArea.append(
        h(
          "p",
          "Draw on paper if needed. Record a description here, then compare your drawing with the model during self-assessment.",
        ),
      );
  }
  host.append(inputArea);
  const actions = h("div", null, { class: "buttons" });
  const move = (delta) => {
    s.index = Math.max(0, Math.min(s.questions.length - 1, s.index + delta));
    save();
    redraw(true);
  };
  const prev = button("Previous", () => move(-1), true);
  prev.disabled = s.index === 0;
  actions.append(prev);
  if (s.index < s.questions.length - 1)
    actions.append(
      button("Next", () => move(1)),
      button("Skip / revisit later", () => move(1), true),
    );
  actions.append(
    button(
      s.flags?.[q.id] ? "Remove flag" : "Flag for review",
      () => {
        s.flags ??= {};
        s.flags[q.id] = !s.flags[q.id];
        save();
        redraw();
      },
      true,
    ),
  );
  actions.append(
    button("Submit practice", () => {
      const missing = s.questions.filter(
        (x) => !hasAnswer(x, s.answers[x.id]),
      ).length;
      if (
        !confirm(
          missing
            ? `Submit with ${missing} unanswered questions? They will receive zero marks. You can review every question afterwards.`
            : "Submit this practice for marking?",
        )
      )
        return;
      s.status = "submitted";
      s.submitted = new Date().toISOString();
      finish();
      redraw(true);
    }),
  );
  host.append(actions);
  host.append(
    button(
      "Practice setup",
      () => {
        showSetup = true;
        redraw(true);
      },
      true,
    ),
  );
}
function results() {
  const s = store.active,
    score = summarize(s);
  heading("Your practice results");
  host.append(h("p", summaryText(s.questions)));
  const metrics = h("div", null, { class: "metrics" });
  for (const [value, text] of [
    [
      `${score.auto}/${score.autoMax}`,
      "Automatically marked (includes unanswered zeros)",
    ],
    [`${score.self}/${score.selfMax}`, "Self-assessed marks so far"],
    [
      score.pending
        ? "Pending"
        : `${Math.round((score.earned / score.total) * 100)}%`,
      "Overall score",
    ],
    [`${score.total}`, "Total marks available"],
  ])
    metrics.append(
      add(
        h("div", null, { class: "metric" }),
        h("strong", value),
        h("small", text),
      ),
    );
  host.append(metrics);
  host.append(
    h(
      "p",
      `${score.skipped} unanswered · ${score.pending} responses awaiting self-assessment. Numerical method marks and written reasoning require your assessment.`,
    ),
  );
  for (const dimension of ["topic", "format", "difficulty"]) {
    const table = h("table");
    table.append(h("caption", `Performance by ${dimension}`));
    table.append(
      add(
        h("tr"),
        h("th", "Category", { scope: "col" }),
        h("th", "Marks", { scope: "col" }),
        h("th", "Status", { scope: "col" }),
      ),
    );
    for (const [key, v] of Object.entries(score[dimension])) {
      const title =
        content.topics.find((t) => t.id === key)?.title || label(key);
      table.append(
        add(
          h("tr"),
          h("th", title, { scope: "row" }),
          h("td", `${v.earned}/${v.total}`),
          h(
            "td",
            v.pending
              ? "Self-assessment pending"
              : v.earned / v.total >= 0.75
                ? "Strength to build on"
                : "Further practice suggested",
          ),
        ),
      );
    }
    host.append(table);
  }
  host.append(h("h3", "Review answers and award written marks"));
  for (const [i, q] of s.questions.entries()) {
    const m = markQuestion(q, s.answers[q.id], s.self[q.id]),
      a = s.answers[q.id];
    const details = h("details", null, { class: "pack-review" });
    details.append(
      h(
        "summary",
        `${i + 1}. ${q.id} · ${m.skipped ? "Unanswered" : m.pending ? "Assessment pending" : `${m.earned}/${q.marks} marks`} · ${q.question_text}`,
      ),
    );
    supporting(details, q);
    if (q.parts)
      for (const p of q.parts) details.append(h("p", `${p.id}) ${p.text}`));
    const response =
      q.format === "multiple_choice"
        ? (a?.options || [])
            .map((id) => q.options.find((o) => o.id === id)?.text || id)
            .join("; ")
        : a
          ? `${a.value || ""} ${a.unit || ""}\n${a.text || ""}`
          : "No answer";
    details.append(
      h("h4", "Your answer"),
      h("p", response || "No answer", { class: "pack-pre" }),
    );
    details.append(
      h("h4", "Model answer"),
      h(
        "p",
        q.format === "multiple_choice"
          ? q.options
              .filter((o) => q.correct_answer.option_ids.includes(o.id))
              .map((o) => o.text)
              .join("; ")
          : q.correct_answer.model_response,
        { class: "pack-pre" },
      ),
      h("p", q.explanation),
      h(
        "p",
        `Sources: ${q.source_reference.join(", ")} · ${label(q.source_alignment_status)} · Proposed practice rubric`,
      ),
    );
    if (q.common_mistakes?.length)
      details.append(
        h("p", `Common mistakes: ${q.common_mistakes.join("; ")}`),
      );
    if (q.format !== "multiple_choice" && !m.skipped) {
      const numeric = "value" in q.correct_answer,
        criteria = numeric ? q.marking_rubric.slice(0, -1) : q.marking_rubric;
      if (numeric)
        details.append(
          h(
            "p",
            `Final answer: ${m.auto}/1 automatically marked. Method marks below are self-assessed.`,
          ),
        );
      for (const [j, r] of criteria.entries()) {
        const select = h("select", null, {
          "aria-label": `Question ${i + 1}, criterion ${j + 1}`,
        });
        for (const [v, text] of [
          ["", "Not assessed"],
          ["yes", `Award ${r.marks} mark${r.marks === 1 ? "" : "s"}`],
          ["no", "Award 0 marks"],
        ])
          select.append(h("option", text, { value: v }));
        select.value =
          typeof s.self[q.id]?.[j] === "boolean"
            ? s.self[q.id][j]
              ? "yes"
              : "no"
            : "";
        select.addEventListener("change", () => {
          s.self[q.id] ??= {};
          if (select.value === "") delete s.self[q.id][j];
          else s.self[q.id][j] = select.value === "yes";
          finish();
          const open = [...host.querySelectorAll(".pack-review")].map(
            (d) => d.open,
          );
          redraw();
          host
            .querySelectorAll(".pack-review")
            .forEach((d, k) => (d.open = open[k]));
          const next = host.querySelector(
            `[aria-label="Question ${i + 1}, criterion ${j + 1}"]`,
          );
          next?.focus();
        });
        details.append(add(h("label", r.criterion + " "), select));
      }
    }
    host.append(details);
  }
  const count = h("select", null, { "aria-label": "Follow-up question count" });
  for (const n of ["5", "10", "20", "30", "all"])
    count.append(h("option", n === "all" ? "All available" : n, { value: n }));
  count.value = s.settings.count;
  host.append(add(h("label", "Follow-up question count "), count));
  const actions = h("div", null, { class: "buttons" });
  for (const [mode, text] of [
    ["new", "Generate New Practice"],
    ["mistakes", "Practise My Mistakes"],
    ["similar", "Similar Questions"],
    ["harder", "Harder Questions"],
    ["full", "Full Practice Again"],
  ])
    actions.append(
      button(
        text,
        () => makeSession({ ...s.settings, count: count.value }, mode, s),
        mode !== "new",
      ),
    );
  host.append(
    actions,
    button(
      "Change practice settings",
      () => {
        showSetup = true;
        redraw(true);
      },
      true,
    ),
  );
  management();
}
function cards() {
  heading("Cycle 6 flashcards");
  const topics = selectedTopics();
  let cards = content.cards.filter(
    (c) =>
      topics.includes(c.topic) ||
      (topic !== "all" && c.topic === "investigations"),
  );
  const total = cards.length,
    known = cards.filter((c) => store.ratings[c.id] === "known").length;
  host.append(
    h(
      "p",
      `${known}/${total} known · ${total ? Math.round((known / total) * 100) : 0}% self-reported mastery. Imported and legacy ratings are separate.`,
    ),
  );
  const select = h("select", null, { "aria-label": "Flashcard filter" });
  for (const [value, text] of [
    ["all", "All cards"],
    ["learning", "Still learning"],
    ["known", "Known"],
  ])
    select.append(h("option", text, { value }));
  select.value = cardFilter;
  select.addEventListener("change", () => {
    cardFilter = select.value;
    cardIndex = 0;
    flipped = false;
    redraw();
  });
  host.append(select);
  cards = cards.filter(
    (c) =>
      cardFilter === "all" ||
      (cardFilter === "known"
        ? store.ratings[c.id] === "known"
        : store.ratings[c.id] !== "known"),
  );
  if (!cards.length) {
    host.append(h("p", "No cards match this filter."));
    return;
  }
  cardIndex = ((cardIndex % cards.length) + cards.length) % cards.length;
  const card = cards[cardIndex];
  host.append(h("p", `Card ${cardIndex + 1} of ${cards.length}`));
  const flash = button(
    `${flipped ? "Definition" : "Term"}: ${flipped ? card.back : card.front}`,
    () => {
      flipped = !flipped;
      redraw();
    },
  );
  flash.classList.add("flash");
  host.append(flash);
  if (flipped)
    host.append(
      h("p", card.explanation),
      h("p", `Sources: ${card.source_reference.join(", ")}`),
    );
  const actions = h("div", null, { class: "buttons" });
  for (const [text, fn] of [
    [
      "Previous",
      () => {
        cardIndex--;
        flipped = false;
      },
    ],
    [
      "Flip",
      () => {
        flipped = !flipped;
      },
    ],
    [
      "Next",
      () => {
        cardIndex++;
        flipped = false;
      },
    ],
    [
      "Still learning",
      () => {
        store.ratings[card.id] = "learning";
        save();
        flipped = false;
      },
    ],
    [
      "I know it",
      () => {
        store.ratings[card.id] = "known";
        save();
        flipped = false;
      },
    ],
  ])
    actions.append(
      button(
        text,
        () => {
          fn();
          redraw();
        },
        true,
      ),
    );
  host.append(actions);
  management();
}
// Small plain-text Markdown renderer: imported HTML is never executed.
function inline(el, text) {
  for (const [i, part] of text.split("**").entries())
    el.append(i % 2 ? h("strong", part) : document.createTextNode(part));
}
function markdown(text, parent, key) {
  let list = null,
    table = null;
  for (const [i, line] of text.split("\n").entries()) {
    if (!line.trim()) {
      list = null;
      table = null;
      continue;
    }
    const headingMatch = line.match(/^(#{1,6}) (.+)/);
    if (headingMatch) {
      const el = h(`h${Math.min(4, headingMatch[1].length + 1)}`);
      inline(el, headingMatch[2]);
      parent.append(el);
      continue;
    }
    if (line.startsWith("|")) {
      if (/^\|[\s:|-]+\|$/.test(line)) continue;
      if (!table) {
        table = h("table");
        parent.append(add(h("div", null, { class: "pack-table-wrap" }), table));
      }
      const tr = h("tr");
      for (const cell of line.split("|").slice(1, -1)) {
        const el = h(table.children.length ? "td" : "th");
        inline(el, cell.trim());
        tr.append(el);
      }
      table.append(tr);
      continue;
    }
    if (line.startsWith("- [ ] ")) {
      const input = h("input", null, { type: "checkbox" });
      const id = `${key}:${line.slice(6)}`;
      input.checked = store.checks[id] === true;
      input.addEventListener("change", () => {
        store.checks[id] = input.checked;
        save();
      });
      const el = add(h("label", null, { class: "pack-choice" }), input);
      inline(el, line.slice(6));
      parent.append(el);
      continue;
    }
    if (/^(?:- |\d+\. )/.test(line)) {
      if (!list) {
        list = h("ul");
        parent.append(list);
      }
      const li = h("li");
      inline(li, line.replace(/^(?:- |\d+\. )/, ""));
      list.append(li);
      continue;
    }
    const p = h("p");
    inline(p, line);
    parent.append(p);
  }
}
function resources() {
  heading("Comprehensive Cycle 6 revision");
  host.append(
    h(
      "p",
      "Source-aligned original practice, with elaborations and added practice clearly labelled. These resources are not school-approved assessments.",
    ),
  );
  host.append(
    add(
      h("p"),
      h("a", "Open printable offline workbook", {
        href: new URL("Revision-Workbook.html", root),
        target: "_blank",
        rel: "noopener",
      }),
    ),
  );
  const actions = h("div", null, { class: "buttons" });
  actions.append(button("Print revision notes", () => window.print(), true));
  host.append(actions);
  for (const [title, text, key] of [
    ["Study guide", content.guide, "study"],
    ["Formula sheet and worked examples", content.formula, "formula"],
  ]) {
    const d = h("details");
    d.open = key === "study";
    d.append(h("summary", title));
    markdown(text, d, key);
    host.append(d);
  }
  const qa = h("details");
  qa.append(h("summary", "Sources, corrections and QA limitations"));
  markdown(content.sourceAnalysis, qa, "sources");
  markdown(content.qa, qa, "qa");
  host.append(qa);
}
function render() {
  host.replaceChildren();
  host.classList.add("pack");
  const warning = h("p", error, { id: "pack-storage-warning", role: "alert" });
  warning.hidden = !error;
  host.append(warning);
  if (loadingError) {
    host.append(
      h("p", loadingError, { role: "alert" }),
      button(
        "Retry loading",
        () => {
          loadingError = "";
          load();
          redraw();
        },
        true,
      ),
    );
    return;
  }
  if (!content) {
    host.append(h("p", "Loading Cycle 6 resources…", { role: "status" }));
    return;
  }
  if (content.errors.length) {
    const details = h("details");
    details.append(
      h("summary", `${content.errors.length} content records were rejected`),
    );
    for (const e of content.errors) details.append(h("p", e));
    host.append(details);
  }
  if (notice) host.append(h("p", notice, { role: "status", class: "summary" }));
  if (section === "pack-cards") cards();
  else if (section === "pack-guide") resources();
  else if (showSetup || !store.active) setup();
  else if (store.active.status === "active") takeTest();
  else results();
}
window.mountCycle6 = (element, nextSection, nextTopic) => {
  host = element;
  section = nextSection;
  topic = nextTopic;
  notice = "";
  render();
};
async function load() {
  try {
    const names = [
      "topics.json",
      "questions.json",
      "extended_responses.json",
      "flashcards.json",
      "assessment_blueprints.json",
      "numerical_templates.json",
      "conceptual_templates.json",
      "extended_templates.json",
    ];
    const values = await Promise.all(names.map((n) => read("data/" + n)));
    const [guide, formula, sourceAnalysis, qa] = await Promise.all(
      [
        "Study-Guide.md",
        "Formula-Sheet.md",
        "Source-Analysis.md",
        "QA-Report.md",
      ].map((n) => read("docs/" + n, false)),
    );
    content = prepareContent({
      topics: values[0],
      questions: values[1],
      extended: values[2],
      cards: values[3],
      blueprint: values[4],
      templates: values.slice(5).flat(),
      guide,
      formula,
      sourceAnalysis,
      qa,
    });
  } catch (e) {
    loadingError = `${e.message}. Legacy resources remain available. Please retry when connected.`;
  }
  redraw();
}
const pending = document.querySelector("[data-cycle6-section]");
if (pending)
  window.mountCycle6(
    pending,
    pending.dataset.cycle6Section,
    pending.dataset.cycle6Topic,
  );
load();
