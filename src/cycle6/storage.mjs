import { validateQuestion } from "./engine.mjs";
export const STORAGE_KEY = "jadens-cycle6-v1";
export const emptyStore = () => ({
  version: 1,
  preferences: null,
  active: null,
  history: [],
  ratings: {},
  checks: {},
});
function validSession(s) {
  return (
    s &&
    typeof s.id === "string" &&
    ["active", "submitted"].includes(s.status) &&
    Array.isArray(s.questions) &&
    s.questions.length > 0 &&
    s.questions.length <= 1000 &&
    Number.isInteger(s.index) &&
    s.index >= 0 &&
    s.index < s.questions.length &&
    s.answers &&
    typeof s.answers === "object" &&
    s.self &&
    typeof s.self === "object" &&
    s.questions.every((q) => {
      try {
        return Boolean(validateQuestion(q));
      } catch {
        return false;
      }
    })
  );
}
export function readStore(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { data: emptyStore(), error: "" };
    const d = JSON.parse(raw);
    if (
      d.version !== 1 ||
      !Array.isArray(d.history) ||
      !d.ratings ||
      typeof d.ratings !== "object" ||
      !d.checks ||
      typeof d.checks !== "object" ||
      (d.active && !validSession(d.active)) ||
      d.history.some((s) => !validSession(s))
    )
      throw Error("Unsupported or damaged saved practice data");
    return { data: d, error: "" };
  } catch (e) {
    return {
      data: emptyStore(),
      error:
        "Saved practice data could not be read. Existing storage has not been overwritten. Export browser data before resetting.",
    };
  }
}
export function writeStore(storage, data) {
  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...data, history: data.history.slice(-20) }),
    );
    return "";
  } catch {
    return "Progress could not be saved. Browser storage may be full or unavailable. Export your progress before leaving.";
  }
}
