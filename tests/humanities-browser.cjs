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
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  const errors = [],
    bad = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.url().startsWith(base) && r.status() >= 400) bad.push(r.url());
  });
  const dialogs = [];
  page.on("dialog", (d) => {
    dialogs.push(d.message());
    d.accept();
  });
  await page.route(
    /https:\/\/(fonts.googleapis.com|fonts.gstatic.com)\//,
    (r) => r.abort(),
  );
  const enter = async () => {
    await page
      .getByRole("button", { name: "Continue to Revision Lab →", exact: true })
      .first()
      .click();
    await page.getByRole("button", { name: /Humanities Year 8/ }).click();
    await page
      .getByRole("button", { name: /Year 8 Explore your cycles/ })
      .click();
    await page.getByRole("button", { name: /Cycle 6 Shogunate Japan/ }).click();
    await page
      .getByRole("button", { name: /Shogunate Japan Open topic/ })
      .click();
    await page
      .getByRole("heading", { name: "Study guide", exact: true })
      .waitFor();
  };
  const tool = async (name) => {
    await page
      .getByRole("navigation", { name: "Shogunate Japan tools" })
      .getByRole("button", { name, exact: true })
      .click();
  };
  await page.goto(base);
  await enter();
  assert.equal(await page.locator(".japan-study").count(), 7);
  await page.getByLabel("I can explain this without my notes").first().check();
  await page.reload();
  await enter();
  assert.ok(
    await page
      .getByLabel("I can explain this without my notes")
      .first()
      .isChecked(),
  );
  await tool("Timeline");
  assert.equal(await page.locator(".japan-timeline li").count(), 7);
  assert.match(await page.locator(".japan-timeline").innerText(), /1853–1854/);
  await tool("Flashcards");
  const flash = page.locator(".japan-flashcard");
  await flash.focus();
  await page.keyboard.press("Space");
  assert.equal(await flash.getAttribute("aria-pressed"), "true");
  assert.match(await flash.innerText(), /Military ruler/);
  await page.getByRole("button", { name: "I know it", exact: true }).click();
  await page.reload();
  await enter();
  await tool("Flashcards");
  assert.match(await page.locator(".japan").innerText(), /1\/48 known/);
  assert.equal(await page.locator("ruby rt").innerText(), "shōgun");
  await page.getByLabel("Show pronunciation").uncheck();
  assert.equal(await page.locator("ruby rt").count(), 0);
  await page.getByRole("button", { name: "Shuffle", exact: true }).click();
  await tool("Practice");
  await page.getByLabel("Question count", { exact: true }).selectOption("5");
  await page
    .getByRole("button", { name: "Start practice", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Question 1 of 5", exact: true })
    .waitFor();
  assert.equal(
    await page.getByText("Model answer", { exact: true }).count(),
    0,
  );
  const radios = page.locator(".japan-answer input[type=radio]");
  if (await radios.count()) await radios.first().check();
  else
    await page
      .getByLabel("Your Humanities answer")
      .fill("A considered historical explanation.");
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Skip and revisit", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Question 1, answered", exact: true })
    .click();
  await page.reload();
  await enter();
  await tool("Practice");
  await page
    .getByRole("heading", { name: "Question 1 of 5", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Submit Humanities practice", exact: true })
    .click();
  assert.ok(dialogs.some((d) => d.includes("4 unanswered")));
  await page.getByRole("heading", { name: "Humanities results" }).waitFor();
  await tool("Full Practice");
  await page
    .getByRole("button", { name: "Start 28-mark assessment", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Question 1 of 11", exact: true })
    .waitFor();
  await page.getByRole("radio", { name: "Bushidō", exact: true }).check();
  await page
    .getByRole("button", { name: "Question 9, unanswered", exact: true })
    .click();
  assert.match(await page.locator(".japan-source").innerText(), /Source A/);
  assert.match(await page.locator(".japan-source").innerText(), /museum-label/);
  await page
    .getByLabel("Your Humanities answer")
    .fill("Two observations, an inference, and a limit.");
  await page
    .getByRole("button", { name: "Question 10, unanswered", exact: true })
    .click();
  assert.match(await page.locator(".japan-source").innerText(), /Source B/);
  await page
    .getByRole("button", { name: "Submit Humanities practice", exact: true })
    .click();
  await page.getByRole("heading", { name: "Humanities results" }).waitFor();
  assert.match(await page.locator(".japan .metrics").innerText(), /Pending/);
  const mark = page.getByLabel("Marks for question 9", { exact: true });
  await mark.locator("..").evaluate((e) => (e.closest("details").open = true));
  await mark.selectOption("4");
  assert.doesNotMatch(
    await page.locator(".japan .metrics").innerText(),
    /Pending/,
  );
  assert.match(await page.locator(".japan .metrics").innerText(), /28/);
  await tool("Sources");
  assert.equal(await page.locator(".japan li a").count(), 5);
  await tool("Study guide");
  const workbook = await page
    .getByRole("link", { name: "Open printable revision workbook" })
    .getAttribute("href");
  assert.ok((await page.request.get(workbook)).ok());
  for (const width of [1280, 390, 768]) {
    await page.setViewportSize({ width, height: 900 });
    for (const name of [
      "Study guide",
      "Flashcards",
      "Practice",
      "Full Practice",
    ]) {
      await tool(name);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `Overflow in ${name} at ${width}`,
      );
      if (name === "Flashcards") {
        assert.ok((await flash.boundingBox()).height >= 280);
        await flash.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: `/tmp/shogunate-flashcards-${width}.png`,
        });
      }
    }
  }
  await page.context().setOffline(true);
  await tool("Timeline");
  await page.getByRole("heading", { name: "Timeline", exact: true }).waitFor();
  await tool("Flashcards");
  await flash.click();
  await page.context().setOffline(false);
  await page.getByRole("button", { name: "← Topics", exact: true }).click();
  await page.getByRole("button", { name: "← Cycles", exact: true }).click();
  await page
    .getByRole("button", { name: "← Year levels", exact: true })
    .click();
  await page
    .getByRole("button", { name: "← All subjects", exact: true })
    .click();
  await page.getByRole("button", { name: /Science Explore topics/ }).click();
  await page
    .getByRole("heading", { name: "Choose a cycle", exact: true })
    .waitFor();
  assert.deepEqual(errors, []);
  assert.deepEqual(bad, []);
  const broken = await browser.newPage();
  await broken.route("**/shogunate-japan/data/questions.json", (r) =>
    r.abort(),
  );
  await broken.goto(base);
  await broken.evaluate(() => {
    enterLab();
    go("humanities-shogunate-japan");
  });
  await broken
    .getByRole("button", { name: "Retry Humanities loading" })
    .waitFor();
  await broken.unroute("**/shogunate-japan/data/questions.json");
  await broken
    .getByRole("button", { name: "Retry Humanities loading" })
    .click();
  await broken
    .getByRole("heading", { name: "Study guide", exact: true })
    .waitFor();
  await broken.close();
  console.log(
    "PASS: Humanities hierarchy, study/checklist, timeline, Japanese readings/cards, preferences, custom practice/recovery, incomplete submission, 28-mark paper, sources A/B, self-assessment, workbook, desktop/phone/tablet layouts, loaded offline use, load retry and Science navigation.",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
