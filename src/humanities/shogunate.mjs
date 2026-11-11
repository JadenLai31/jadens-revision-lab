import {
  KEY,
  TYPES,
  validatePack,
  selectQuestions,
  answered,
  grade,
  summary,
  emptyProgress,
  loadProgress,
  saveProgress,
} from "./engine.mjs";
const base = new URL(
  "../../content/humanities/year-8/cycle-6/shogunate-japan/",
  import.meta.url,
);
const labels = {
  multiple_choice: "Multiple choice",
  short_answer: "Short answer",
  source_analysis: "Source analysis",
  extended_response: "Extended response",
};
let pack,
  problem = "",
  progress = emptyProgress(),
  storageError = "",
  locked = false,
  host,
  tab = "guide",
  notice = "",
  setupOpen = false,
  cardIndex = 0,
  flipped = false,
  cardFilter = "all",
  cardOrder = [];
const node = (tag, text, attrs = {}) => {
  const e = document.createElement(tag);
  if (text !== null && text !== undefined) e.textContent = text;
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, String(v));
  }
  return e;
};
const append = (parent, ...children) => {
  parent.append(...children);
  return parent;
};
const button = (text, action, secondary = false) =>
  node("button", text, {
    type: "button",
    class: "btn" + (secondary ? " secondary" : ""),
    onclick: action,
  });
function save() {
  if (!locked) storageError = saveProgress(localStorage, progress);
  const alert = host?.querySelector("[data-storage-warning]");
  if (alert) {
    alert.textContent = storageError;
    alert.hidden = !storageError;
  }
}
function redraw(focus = false) {
  if (!host?.isConnected) return;
  const active = host.contains(document.activeElement)
    ? document.activeElement
    : null;
  const text = active?.textContent,
    flash = active?.classList.contains("pack-flashcard");
  render();
  if (focus) host.querySelector("h2")?.focus();
  else if (flash) host.querySelector(".pack-flashcard")?.focus();
  else if (active)
    [...host.querySelectorAll("button")]
      .find((b) => b.textContent === text)
      ?.focus();
}
function heading(text) {
  const h = node("h2", text, { tabindex: "-1" });
  host.append(h);
  return h;
}
function remember() {
  const session = progress.session;
  progress.history = progress.history.filter((s) => s.id !== session.id);
  progress.history.push(structuredClone(session));
  progress.history = progress.history.slice(-20);
  save();
}
function manage() {
  const d = node("details");
  d.append(
    node("summary", "Your progress and saved sessions"),
    node(
      "p",
      "Progress is stored in this browser only. Clearing browser data or changing devices can lose it. The latest 20 completed sessions are kept. Science progress is stored separately.",
    ),
  );
  d.append(
    button(
      "Export Humanities progress",
      () => {
        try {
          const raw = localStorage.getItem(KEY);
          const blob = new Blob([JSON.stringify({ progress, raw }, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = node("a", "", {
            href: url,
            download: "shogunate-japan-progress.json",
          });
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch {
          notice = "Your browser could not export saved data.";
          redraw();
        }
      },
      true,
    ),
    button(
      "Reset Humanities progress",
      () => {
        if (
          confirm(
            "Delete Shogunate Japan ratings, checklists and sessions? Science progress will remain.",
          )
        ) {
          progress = emptyProgress();
          locked = false;
          save();
          redraw();
        }
      },
      true,
    ),
  );
  for (const s of [...progress.history].reverse()) {
    const score = summary(s);
    d.append(
      button(
        `${new Date(s.started).toLocaleDateString("en-AU")} · ${s.mode === "assessment" ? "Full Practice" : "Practice"} · ${score.pending ? "Assessment pending" : Math.round((score.earned / score.total) * 100) + "%"}`,
        () => {
          if (
            progress.session?.status === "active" &&
            !confirm("Replace the unfinished session with this saved review?")
          )
            return;
          progress.session = structuredClone(s);
          setupOpen = false;
          tab = "practice";
          save();
          redraw(true);
        },
        true,
      ),
    );
  }
  host.append(d);
}
function guide() {
  heading("Study guide");
  host.append(
    node(
      "p",
      "Read, recall and explain. Keep historical evidence, interpretation and folklore distinct. The notes and practice below come from your revision pack.",
    ),
  );
  host.append(
    append(
      node("p"),
      node("a", "Open printable revision workbook", {
        href: new URL("Shogunate-Japan-Revision-Workbook.html", base),
        target: "_blank",
        rel: "noopener",
      }),
    ),
  );
  for (const topic of pack.topics) {
    const section = node("section", null, { class: "japan-study panel" });
    section.append(
      node("h3", topic.title),
      node("p", `Oxford / class reading map · ${topic.oxford}`, {
        class: "note",
      }),
      node("p", topic.notes),
    );
    const goal = node("div", null, { class: "japan-recall" });
    goal.append(node("strong", "Recall and explain"), node("p", topic.goal));
    const check = node("input", null, { type: "checkbox" });
    check.checked = progress.checks[topic.id] === true;
    check.addEventListener("change", () => {
      progress.checks[topic.id] = check.checked;
      save();
    });
    goal.append(
      append(
        node("label", null, { class: "pack-choice" }),
        check,
        document.createTextNode("I can explain this without my notes"),
      ),
    );
    section.append(goal);
    host.append(section);
  }
  manage();
}
function timeline() {
  heading("Timeline");
  host.append(
    node(
      "p",
      "Use dates to distinguish stages of change. The class mnemonic is a memory aid; it is not a strict chronology.",
    ),
  );
  const list = node("ol", null, { class: "japan-timeline" });
  for (const [date, event] of pack.timeline)
    list.append(append(node("li"), node("strong", date), node("p", event)));
  host.append(list);
}
function cards() {
  heading("Japanese vocabulary flashcards");
  const known = pack.cards.filter(
    (c) => progress.ratings[c.id] === "known",
  ).length;
  host.append(
    node(
      "p",
      `${known}/${pack.cards.length} known · ${Math.round((known / pack.cards.length) * 100)}% self-reported mastery`,
    ),
  );
  const select = node("select", null, { "aria-label": "Vocabulary filter" });
  for (const [v, t] of [
    ["all", "All cards"],
    ["learning", "Still learning"],
    ["known", "Known"],
  ])
    select.append(node("option", t, { value: v }));
  select.value = cardFilter;
  select.addEventListener("change", () => {
    cardFilter = select.value;
    cardIndex = 0;
    flipped = false;
    redraw();
  });
  host.append(select);
  const readings = node("input", null, { type: "checkbox" });
  readings.checked = progress.showReadings !== false;
  readings.addEventListener("change", () => {
    progress.showReadings = readings.checked;
    save();
    redraw();
  });
  host.append(
    append(
      node("label", null, { class: "pack-choice" }),
      readings,
      document.createTextNode("Show pronunciation"),
    ),
  );
  if (!cardOrder.length) cardOrder = pack.cards.map((c) => c.id);
  const cards = cardOrder
    .map((id) => pack.cards.find((c) => c.id === id))
    .filter(
      (c) =>
        cardFilter === "all" ||
        (cardFilter === "known"
          ? progress.ratings[c.id] === "known"
          : progress.ratings[c.id] !== "known"),
    );
  if (!cards.length) {
    host.append(node("p", "No cards match this filter."));
    manage();
    return;
  }
  cardIndex = ((cardIndex % cards.length) + cards.length) % cards.length;
  const card = cards[cardIndex];
  host.append(node("p", `Card ${cardIndex + 1} of ${cards.length}`));
  const flash = node("button", null, {
    type: "button",
    class: "flash pack-flashcard japan-flashcard",
    "aria-label": `${flipped ? "Meaning" : "Japanese term"}: ${flipped ? card.back : card.front}`,
    "aria-pressed": String(flipped),
    "data-flipped": String(flipped),
    onclick: () => {
      flipped = !flipped;
      redraw();
    },
  });
  flash.append(
    node("small", flipped ? "Meaning" : "Japanese term", {
      class: "pack-flashcard-label",
    }),
  );
  const text = node("strong", null, { class: "pack-flashcard-text" });
  if (flipped) text.textContent = card.back;
  else {
    const ruby = node("ruby", card.front, { lang: "ja" });
    if (progress.showReadings !== false)
      ruby.append(node("rt", card.romaji, { lang: "ja-Latn" }));
    text.append(ruby);
  }
  flash.append(
    text,
    node(
      "span",
      flipped
        ? "Tap to return to the Japanese term ↻"
        : "Tap to reveal the meaning ↻",
      { class: "pack-flashcard-hint" },
    ),
  );
  host.append(flash);
  if (flipped) host.append(node("p", card.context, { class: "japan-recall" }));
  const actions = node("div", null, { class: "buttons" });
  for (const [text, fn] of [
    ["Previous", () => cardIndex--],
    ["Next", () => cardIndex++],
    [
      "Shuffle",
      () => {
        for (let i = cardOrder.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [cardOrder[i], cardOrder[j]] = [cardOrder[j], cardOrder[i]];
        }
        cardIndex = 0;
      },
    ],
    [
      "Still learning",
      () => {
        progress.ratings[card.id] = "learning";
        save();
      },
    ],
    [
      "I know it",
      () => {
        progress.ratings[card.id] = "known";
        save();
      },
    ],
  ])
    actions.append(
      button(
        text,
        () => {
          fn();
          flipped = false;
          redraw();
        },
        true,
      ),
    );
  host.append(actions);
  manage();
}
function start(settings, mode = "practice") {
  if (
    progress.session?.status === "active" &&
    !confirm("Replace the unfinished Humanities session?")
  )
    return;
  progress.preferences = settings;
  try {
    const selected =
      mode === "assessment"
        ? { questions: pack.assessment.questions, notice: "" }
        : selectQuestions(
            pack,
            settings,
            progress.history.flatMap((s) => s.questions.map((q) => q.id)),
          );
    progress.session = {
      id: crypto.randomUUID(),
      mode,
      status: "active",
      started: new Date().toISOString(),
      questions: structuredClone(selected.questions),
      answers: {},
      marks: {},
      index: 0,
      settings,
      flags: {},
    };
    notice = selected.notice;
    setupOpen = false;
    tab = "practice";
    save();
    redraw(true);
  } catch (e) {
    notice = e.message;
    redraw();
  }
}
function setup() {
  heading("Create a practice session");
  host.append(
    node(
      "p",
      `${pack.questions.length} supplied practice questions. Choose your topics, difficulty and formats. These questions are selected from the pack; they are not generated by AI.`,
    ),
  );
  if (progress.session)
    host.append(
      button(
        progress.session.status === "active"
          ? "Resume saved session"
          : "Return to results",
        () => {
          setupOpen = false;
          redraw(true);
        },
        true,
      ),
    );
  const pref = progress.preferences || {},
    form = node("form"),
    topicInputs = [],
    typeInputs = [];
  const group = (title, items, selected, list) => {
    const field = node("fieldset");
    field.append(node("legend", title));
    for (const [id, title] of items) {
      const input = node("input", null, { type: "checkbox", value: id });
      input.checked = selected.includes(id);
      list.push(input);
      input.addEventListener("change", availability);
      field.append(
        append(
          node("label", null, { class: "pack-choice" }),
          input,
          document.createTextNode(title),
        ),
      );
    }
    form.append(field);
  };
  group(
    "Topics",
    pack.topics.map((t) => [t.id, t.title]),
    Array.isArray(pref.topics) ? pref.topics : pack.topics.map((t) => t.id),
    topicInputs,
  );
  group(
    "Formats",
    [
      ["multiple_choice", "Multiple choice"],
      ["short_answer", "Short answer"],
    ],
    Array.isArray(pref.types)
      ? pref.types
      : ["multiple_choice", "short_answer"],
    typeInputs,
  );
  const difficulty = node("select", null, { "aria-label": "Difficulty" });
  for (const d of ["Easy", "Medium", "Hard", "Mixed"])
    difficulty.append(node("option", d, { value: d }));
  difficulty.value = ["Easy", "Medium", "Hard", "Mixed"].includes(
    pref.difficulty,
  )
    ? pref.difficulty
    : "Mixed";
  difficulty.addEventListener("change", availability);
  const count = node("select", null, { "aria-label": "Question count" });
  for (const c of ["5", "10", "20", "all"])
    count.append(
      node("option", c === "all" ? "All available" : c, { value: c }),
    );
  count.value = ["5", "10", "20", "all"].includes(pref.count)
    ? pref.count
    : "10";
  form.append(
    append(node("label", "Difficulty "), difficulty),
    append(node("label", "Question count "), count),
  );
  const available = node("p", null, { "aria-live": "polite" });
  form.append(available);
  const collect = () => ({
    topics: topicInputs.filter((i) => i.checked).map((i) => i.value),
    types: typeInputs.filter((i) => i.checked).map((i) => i.value),
    difficulty: difficulty.value,
    count: count.value,
  });
  function availability() {
    const s = collect();
    const n = pack.questions.filter(
      (q) =>
        s.topics.includes(q.topic) &&
        s.types.includes(q.type) &&
        (s.difficulty === "Mixed" || s.difficulty === q.difficulty),
    ).length;
    available.textContent = `${n} matching questions available.`;
  }
  availability();
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    start(collect());
  });
  form.append(
    node("button", "Start practice", { type: "submit", class: "btn" }),
  );
  host.append(form);
  fullPractice();
  manage();
}
function fullPractice() {
  const panel = node("section", null, { class: "panel japan-assessment" });
  panel.append(
    node("h3", "Full Practice assessment"),
    node(
      "p",
      `${pack.assessment.questions.length} questions · ${pack.assessment.totalMarks} marks · Multiple choice, written answers, source analysis and an extended response.`,
    ),
    node(
      "p",
      "Source A is an original museum-label exercise. Source B is an original comparison of positions. Neither is an attributed historical document. These are practice resources, not an official school exam.",
    ),
    button("Start 28-mark assessment", () =>
      start(
        {
          topics: pack.topics.map((t) => t.id),
          types: TYPES,
          difficulty: "Mixed",
          count: "all",
        },
        "assessment",
      ),
    ),
  );
  host.append(panel);
}
function sourceFor(q) {
  return q.id === "P09" ? "A" : q.id === "P10" ? "B" : null;
}
function showQuestion(parent, q) {
  parent.append(node("h3", q.prompt));
  const source = sourceFor(q);
  if (source) {
    const quote = node("blockquote", null, { class: "japan-source" });
    quote.append(
      node("strong", `Source ${source} — original practice exercise`),
      node("p", pack.assessment.sources[source]),
    );
    parent.append(quote);
  }
}
function take() {
  const s = progress.session,
    q = s.questions[s.index];
  heading(`Question ${s.index + 1} of ${s.questions.length}`);
  const status = node("p", null, { "aria-live": "polite" });
  host.append(status);
  const update = () => {
    const n = s.questions.filter((x) => answered(x, s.answers[x.id])).length;
    status.textContent = `${n} answered · ${s.questions.length - n} unanswered · ${q.marks} marks · ${q.difficulty} · ${labels[q.type]}`;
  };
  update();
  const nav = node("nav", null, {
    "aria-label": "Humanities question navigation",
    class: "pack-navigator",
  });
  for (const [i, item] of s.questions.entries()) {
    const done = answered(item, s.answers[item.id]);
    const b = button(
      `${i + 1}${done ? " ✓" : ""}${s.flags?.[item.id] ? " ⚑" : ""}`,
      () => {
        s.index = i;
        save();
        redraw(true);
      },
      true,
    );
    b.setAttribute(
      "aria-label",
      `Question ${i + 1}, ${done ? "answered" : "unanswered"}`,
    );
    if (i === s.index) b.setAttribute("aria-current", "step");
    nav.append(b);
  }
  host.append(nav);
  showQuestion(host, q);
  const area = node("div", null, { class: "japan-answer" }),
    answer = s.answers[q.id] || {};
  const record = (a) => {
    s.answers[q.id] = a;
    delete s.marks[q.id];
    save();
    update();
    const done = answered(q, a);
    nav.children[s.index].textContent =
      `${s.index + 1}${done ? " ✓" : ""}${s.flags?.[q.id] ? " ⚑" : ""}`;
    nav.children[s.index].setAttribute(
      "aria-label",
      `Question ${s.index + 1}, ${done ? "answered" : "unanswered"}`,
    );
  };
  if (q.type === "multiple_choice") {
    const field = node("fieldset");
    field.append(node("legend", "Choose one answer"));
    for (const [i, choice] of q.choices.entries()) {
      const input = node("input", null, {
        type: "radio",
        name: "japan-choice",
        value: i,
      });
      input.checked = answer.choice === i;
      input.addEventListener("change", () => record({ choice: i }));
      field.append(
        append(
          node("label", null, { class: "option" }),
          input,
          document.createTextNode(choice),
        ),
      );
    }
    area.append(field);
  } else {
    area.append(
      node(
        "p",
        "Use evidence, explain your reasoning and qualify claims where needed.",
        { class: "note" },
      ),
    );
    const input = node("textarea", null, {
      "aria-label": "Your Humanities answer",
    });
    input.value = answer.text || "";
    input.addEventListener("input", () => record({ text: input.value }));
    area.append(input);
  }
  host.append(area);
  const actions = node("div", null, { class: "buttons" });
  const move = (delta) => {
    s.index = Math.max(0, Math.min(s.questions.length - 1, s.index + delta));
    save();
    redraw(true);
  };
  const previous = button("Previous question", () => move(-1), true);
  previous.disabled = s.index === 0;
  actions.append(previous);
  if (s.index < s.questions.length - 1)
    actions.append(
      button("Next question", () => move(1)),
      button("Skip and revisit", () => move(1), true),
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
    button("Submit Humanities practice", () => {
      const missing = s.questions.filter(
        (q) => !answered(q, s.answers[q.id]),
      ).length;
      if (
        !confirm(
          missing
            ? `Submit with ${missing} unanswered questions? They will receive zero marks.`
            : "Submit for marking?",
        )
      )
        return;
      s.status = "submitted";
      remember();
      redraw(true);
    }),
  );
  host.append(
    actions,
    button(
      "Change practice settings",
      () => {
        setupOpen = true;
        redraw(true);
      },
      true,
    ),
  );
}
function results() {
  const s = progress.session,
    score = summary(s);
  heading("Humanities results");
  const metrics = node("div", null, { class: "metrics" });
  for (const [value, label] of [
    [
      `${score.auto}/${score.autoMax}`,
      "Automatic marks (including unanswered zeros)",
    ],
    [`${score.self}/${score.selfMax}`, "Self-assessed marks so far"],
    [
      score.pending
        ? "Pending"
        : Math.round((score.earned / score.total) * 100) + "%",
      "Overall score",
    ],
    [`${score.total}`, "Total marks"],
  ])
    metrics.append(
      append(
        node("div", null, { class: "metric" }),
        node("strong", value),
        node("small", label),
      ),
    );
  host.append(
    metrics,
    node(
      "p",
      `${score.skipped} unanswered · ${score.pending} responses awaiting self-assessment. Written reasoning is not automatically graded.`,
    ),
  );
  const table = node("table");
  table.append(node("caption", "Performance by topic"));
  table.append(
    append(
      node("tr"),
      node("th", "Topic", { scope: "col" }),
      node("th", "Marks", { scope: "col" }),
      node("th", "Status", { scope: "col" }),
    ),
  );
  for (const [id, row] of Object.entries(score.topics))
    table.append(
      append(
        node("tr"),
        node("th", pack.topics.find((t) => t.id === id).title, {
          scope: "row",
        }),
        node("td", `${row.earned}/${row.total}`),
        node(
          "td",
          row.pending
            ? "Assessment pending"
            : row.earned === row.total
              ? "Strength to build on"
              : "Further practice suggested",
        ),
      ),
    );
  host.append(append(node("div", null, { class: "pack-table-wrap" }), table));
  for (const [i, q] of s.questions.entries()) {
    const mark = grade(q, s.answers[q.id], s.marks[q.id]),
      answer = s.answers[q.id];
    const d = node("details", null, { class: "japan-review" });
    d.append(
      node(
        "summary",
        `${i + 1}. ${q.prompt} — ${mark.pending ? "Assessment pending" : `${mark.earned}/${q.marks} marks`}`,
      ),
    );
    showQuestion(d, q);
    d.append(
      node("h4", "Your answer"),
      node(
        "p",
        q.type === "multiple_choice"
          ? q.choices[answer?.choice] || "No answer"
          : answer?.text || "No answer",
        { class: "pack-pre" },
      ),
      node("h4", "Model answer"),
      node("p", q.answer, { class: "pack-pre" }),
    );
    if (q.type === "multiple_choice")
      d.append(node("p", `Correct choice: ${q.choices[q.correctIndex]}`));
    d.append(node("h4", "Marking guide"), node("p", q.markingGuide));
    if (q.type !== "multiple_choice" && !mark.skipped) {
      const select = node("select", null, {
        "aria-label": `Marks for question ${i + 1}`,
      });
      select.append(node("option", "Not assessed", { value: "" }));
      for (let n = 0; n <= q.marks; n++)
        select.append(node("option", `${n} / ${q.marks}`, { value: n }));
      select.value = Number.isInteger(s.marks[q.id])
        ? String(s.marks[q.id])
        : "";
      select.addEventListener("change", () => {
        if (select.value === "") delete s.marks[q.id];
        else s.marks[q.id] = Number(select.value);
        remember();
        const open = [...host.querySelectorAll(".japan-review")].map(
          (d) => d.open,
        );
        redraw();
        host
          .querySelectorAll(".japan-review")
          .forEach((d, j) => (d.open = open[j]));
        host
          .querySelector(`[aria-label="Marks for question ${i + 1}"]`)
          ?.focus();
      });
      d.append(append(node("label", "Self-assessed marks "), select));
    }
    host.append(d);
  }
  host.append(
    button("Choose new practice", () => {
      setupOpen = true;
      redraw(true);
    }),
  );
  manage();
}
function sources() {
  heading("Sources and reading");
  host.append(
    node(
      "p",
      "The pack links these sources for further reading. Its source-analysis passages are original exercises, and the practice marking guides are not official school marking schemes.",
    ),
  );
  const list = node("ul");
  for (const source of pack.sources)
    list.append(
      append(
        node("li"),
        node("a", source.title, {
          href: source.url,
          target: "_blank",
          rel: "noopener",
        }),
      ),
    );
  host.append(
    list,
    node(
      "p",
      "Some school materials may require your own access. Source claims and historical interpretations should retain the qualifications used in the study notes.",
    ),
  );
}
function render() {
  host.replaceChildren();
  host.classList.add("pack", "japan");
  const warning = node("p", storageError, {
    role: "alert",
    "data-storage-warning": "",
  });
  warning.hidden = !storageError;
  host.append(warning);
  if (problem) {
    host.append(
      node("p", problem, { role: "alert" }),
      button("Retry Humanities loading", () => {
        problem = "";
        load();
        redraw();
      }),
    );
    return;
  }
  if (!pack) {
    host.append(
      node("p", "Loading Shogunate Japan resources…", { role: "status" }),
    );
    return;
  }
  const nav = node("nav", null, {
    class: "japan-tools",
    "aria-label": "Shogunate Japan tools",
  });
  for (const [id, title] of [
    ["guide", "Study guide"],
    ["timeline", "Timeline"],
    ["cards", "Flashcards"],
    ["practice", "Practice"],
    ["assessment", "Full Practice"],
    ["sources", "Sources"],
  ]) {
    const b = button(
      title,
      () => {
        tab = id;
        notice = "";
        redraw(true);
      },
      true,
    );
    if (tab === id) b.setAttribute("aria-current", "page");
    nav.append(b);
  }
  host.append(nav);
  if (notice)
    host.append(node("p", notice, { class: "summary", role: "status" }));
  if (tab === "guide") guide();
  else if (tab === "timeline") timeline();
  else if (tab === "cards") cards();
  else if (tab === "sources") sources();
  else if (tab === "assessment") {
    heading("Full Practice");
    fullPractice();
    if (progress.session)
      host.append(
        button(
          "Return to saved practice",
          () => {
            tab = "practice";
            setupOpen = false;
            redraw(true);
          },
          true,
        ),
      );
  } else if (setupOpen || !progress.session) setup();
  else if (progress.session.status === "active") take();
  else results();
}
window.mountShogunate = (element) => {
  host = element;
  render();
};
async function load() {
  try {
    const names = [
      "topics",
      "questions",
      "flashcards",
      "assessment",
      "sources",
      "timeline",
    ];
    const values = await Promise.all(
      names.map(async (name) => {
        const r = await fetch(new URL(`data/${name}.json`, base));
        if (!r.ok) throw Error(`Could not load ${name} (${r.status}).`);
        return r.json();
      }),
    );
    pack = validatePack({
      topics: values[0],
      questions: values[1],
      cards: values[2],
      assessment: values[3],
      sources: values[4],
      timeline: values[5],
    });
    const saved = loadProgress(localStorage, pack);
    progress = saved.data;
    storageError = saved.error;
    locked = Boolean(storageError);
  } catch (e) {
    problem = `${e.message} Please retry when connected.`;
  }
  redraw();
}
const pending = document.querySelector("[data-shogunate-root]");
if (pending) window.mountShogunate(pending);
load();
