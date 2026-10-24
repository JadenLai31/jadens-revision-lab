const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/*", (r) =>
    r.request().isNavigationRequest() ? r.continue() : r.abort(),
  );
  await page.goto(
    process.env.REVIEW_TEST_URL || "http://127.0.0.1:8001/cycle6-review/",
  );
  await page.context().setOffline(true);
  await page.evaluate(() => {
    enterLab();
    chooseTopic("all");
    go("science", "pack-practice");
  });
  await page.getByRole("heading", { name: "Create your practice" }).waitFor();
  await page
    .getByRole("button", { name: "Full Practice A", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Question 1 of 21", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Question 18, unanswered", exact: true })
    .click();
  await page.locator(".pack-diagram").waitFor();
  assert.ok(
    await page
      .locator(".pack-diagram")
      .evaluate((img) => img.complete && img.naturalWidth > 0),
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: standalone review assessment and embedded diagram work without additional resource requests.",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
