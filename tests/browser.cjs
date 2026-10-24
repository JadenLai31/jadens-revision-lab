const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base =
  process.env.REVISION_TEST_URL || "http://127.0.0.1:8001/jadens-revision-lab/";
(async () => {
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROMIUM_PATH ||
      (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
    headless: true,
    args: ["--no-sandbox"],
  });
  const errors = [],
    failed = [];
  const page = await browser.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.url().startsWith(base) && r.status() >= 400) failed.push(r.url());
  });
  page.on("dialog", (d) => d.accept());
  await page.route(
    /https:\/\/(fonts.googleapis.com|fonts.gstatic.com)\//,
    (r) => r.abort(),
  );
  const navigate = async (section) => {
    await page.evaluate((s) => {
      enterLab();
      chooseTopic("all");
      go("science", s);
    }, section);
    await page.locator(".pack h2").first().waitFor();
  };
  await page.goto(base);
  await navigate("pack-practice");
  await page.getByRole("heading", { name: "Create your practice" }).waitFor();
  await page.screenshot({
    path: "/tmp/cycle6-setup-desktop.png",
    fullPage: true,
  });
  await page.getByLabel("Multiple choice", { exact: true }).check();
  await page.getByLabel("Short answer", { exact: true }).uncheck();
  await page.getByLabel("Extended response", { exact: true }).uncheck();
  await page.locator("#pack-count").selectOption("5");
  await page
    .getByRole("button", { name: "Generate New Practice", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Question 1 of 5", exact: true })
    .waitFor();
  await page.locator(".pack-answer input").first().check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Skip / revisit later" }).click();
  await page
    .getByRole("button", { name: "Question 1, answered", exact: true })
    .click();
  assert.ok(await page.locator(".pack-answer input").first().isChecked());
  await page.reload();
  await navigate("pack-practice");
  await page
    .getByRole("heading", { name: "Question 1 of 5", exact: true })
    .waitFor();
  assert.ok(await page.locator(".pack-answer input").first().isChecked());
  await page
    .getByRole("button", { name: "Submit practice", exact: true })
    .click();
  await page.getByRole("heading", { name: "Your practice results" }).waitFor();
  assert.match(await page.locator(".pack").innerText(), /4 unanswered/);
  assert.match(await page.locator(".pack").innerText(), /Automatically marked/);
  await page
    .getByRole("button", { name: "Practise My Mistakes", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Question 1 of 5", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Practice setup", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Full Practice A", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Question 1 of 21", exact: true })
    .waitFor();
  assert.match(await page.locator(".pack").innerText(), /40 marks/);
  await page
    .getByRole("button", { name: "Question 2, unanswered", exact: true })
    .click();
  assert.equal(
    await page.locator(".pack-answer input[type=checkbox]").count(),
    4,
  );
  await page.locator(".pack-answer input[type=checkbox]").first().check();
  await page.locator(".pack-answer input[type=checkbox]").nth(1).check();
  assert.equal(await page.locator(".pack-answer input:checked").count(), 2);
  await page
    .getByRole("button", { name: "Question 18, unanswered", exact: true })
    .click();
  assert.equal(await page.locator(".pack-diagram").count(), 1);
  assert.ok((await page.locator("table").count()) > 0);
  await page
    .getByRole("button", { name: "Question 11, unanswered", exact: true })
    .click();
  await page.locator("textarea").fill("3600 J");
  await page
    .getByRole("button", { name: "Submit practice", exact: true })
    .click();
  await page.getByRole("heading", { name: "Your practice results" }).waitFor();
  assert.match(await page.locator(".pack").innerText(), /Awaiting|awaiting/);
  const criterion = page.getByLabel("Question 11, criterion 1", {
    exact: true,
  });
  await criterion
    .locator("..")
    .evaluate((el) => (el.closest("details").open = true));
  await criterion.selectOption("yes");
  await page.screenshot({
    path: "/tmp/cycle6-results-desktop.png",
    fullPage: true,
  });
  await navigate("pack-cards");
  await page.getByRole("button", { name: /^Term:/ }).click();
  await page.getByRole("button", { name: "I know it", exact: true }).click();
  await page.reload();
  await navigate("pack-cards");
  assert.match(await page.locator(".pack").innerText(), /1\/60 known/);
  await navigate("pack-guide");
  assert.match(await page.locator(".pack").innerText(), /Source correction/);
  await page.locator(".pack input[type=checkbox]").first().check();
  await page.reload();
  await navigate("pack-guide");
  assert.ok(
    await page.locator(".pack input[type=checkbox]").first().isChecked(),
  );
  // Generated numerical answers award one final-answer mark; methods stay self-assessed.
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("jadens-cycle6-v1"));
    data.active = null;
    data.preferences = {
      formats: ["short_answer"],
      difficulty: "Easy",
      count: "all",
    };
    localStorage.setItem("jadens-cycle6-v1", JSON.stringify(data));
  });
  await page.reload();
  await navigate("pack-practice");
  await page
    .getByRole("button", { name: "Generate New Practice", exact: true })
    .click();
  const numerical = await page.evaluate(() => {
    const session = JSON.parse(localStorage.getItem("jadens-cycle6-v1")).active;
    const index = session.questions.findIndex(
      (q) => "value" in q.correct_answer,
    );
    return { index, answer: session.questions[index].correct_answer };
  });
  await page
    .getByRole("button", {
      name: `Question ${numerical.index + 1}, unanswered`,
      exact: true,
    })
    .click();
  await page
    .getByLabel("Numerical answer")
    .fill(String(numerical.answer.rounded_value));
  await page.getByLabel("Unit", { exact: true }).fill(numerical.answer.unit);
  await page
    .getByLabel("Working (for method self-assessment)")
    .fill("Formula and substitution");
  await page
    .getByRole("button", { name: "Submit practice", exact: true })
    .click();
  const numericReview = page.locator(".pack-review").nth(numerical.index);
  await numericReview.locator("summary").click();
  assert.match(
    await numericReview.innerText(),
    /Final answer: 1\/1 automatically marked/,
  );
  assert.match(
    await numericReview.innerText(),
    /Method marks below are self-assessed/,
  );
  // Existing features and progress remain available.
  await page.evaluate(() => {
    go("science", "cards");
  });
  await page.locator(".flash").click();
  await page.getByRole("button", { name: "✓ I know it", exact: true }).click();
  await page.evaluate(() => go("science", "quiz"));
  await page.getByRole("button", { name: /Generate Medium test/ }).click();
  await page.locator("input[type=radio]").first().check();
  assert.equal(
    await page.locator(".top .pill").innerText(),
    "Year 8 · Personal study dashboard",
  );
  await page.evaluate(() => go("science", "guide"));
  assert.ok((await page.locator("[data-study-check]").count()) > 0);
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
  ]) {
    await page.setViewportSize(viewport);
    for (const section of ["pack-practice", "pack-cards", "pack-guide"]) {
      await navigate(section);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${section} overflows at ${viewport.width}`,
      );
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: `/tmp/cycle6-resources-${viewport.width}.png`,
      fullPage: false,
    });
  }
  // Already loaded resources stay usable after network loss.
  await page.context().setOffline(true);
  await navigate("pack-cards");
  await page.getByRole("button", { name: /^Term:/ }).click();
  await navigate("pack-practice");
  assert.ok(await page.locator(".pack h2").count());
  await page.context().setOffline(false);
  assert.deepEqual(errors, []);
  assert.deepEqual(failed, []);
  // Failed loading provides retry and leaves legacy navigation functional.
  const broken = await browser.newPage();
  await broken.route("**/data/questions.json", (r) => r.abort());
  await broken.goto(base);
  await broken.evaluate(() => {
    enterLab();
    chooseTopic("all");
    go("science", "pack-practice");
  });
  await broken.getByRole("button", { name: "Retry loading" }).waitFor();
  await broken.evaluate(() => go("science", "cards"));
  await broken.locator(".flash").waitFor();
  await broken.unroute("**/data/questions.json");
  await broken.evaluate(() => go("science", "pack-practice"));
  await broken.getByRole("button", { name: "Retry loading" }).click();
  await broken.getByRole("heading", { name: "Create your practice" }).waitFor();
  const restricted = await browser.newPage();
  await restricted.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Storage blocked");
    };
  });
  restricted.on("dialog", (d) => d.accept());
  await restricted.goto(base);
  await restricted.evaluate(() => {
    enterLab();
    chooseTopic("all");
    go("science", "pack-cards");
  });
  await restricted
    .getByRole("button", { name: "I know it", exact: true })
    .click();
  await restricted
    .getByRole("alert")
    .filter({ hasText: "Progress could not be saved" })
    .waitFor();
  await restricted.close();
  await broken.close();
  console.log(
    "PASS: project-prefix loading, custom filtering, skip/revisit, refresh recovery, submission, follow-up, Full Practice, multi-select, graphs/tables, self-assessment, imported/legacy cards, guide persistence, phone/tablet overflow, offline loaded tools and failed-load fallback.",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
