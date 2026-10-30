import { test, expect, type Page } from "@playwright/test";
import { MongoClient, type Collection, type Document } from "mongodb";

if (process.env.BOOKMARKS_TEST_RUN !== "1")
  throw new Error("Disposable test run required.");
const rawURI = process.env.BOOKMARKS_TEST_URI;
if (!rawURI) throw new Error("Missing disposable database URI.");
const parsedURI = new URL(rawURI);
if (
  parsedURI.protocol !== "mongodb:" ||
  parsedURI.hostname !== "127.0.0.1" ||
  !/^\/bookmarks_test_[a-zA-Z0-9_]+$/.test(parsedURI.pathname) ||
  parsedURI.username ||
  parsedURI.password
) {
  throw new Error("Tests may only mutate a loopback bookmarks_test_ database.");
}
const scenario = process.env.BOOKMARKS_TEST_SCENARIO;
if (!["healthy", "missing", "unreachable"].includes(scenario ?? ""))
  throw new Error("Unknown verification scenario.");
const healthy = scenario === "healthy";
if (healthy && process.env.MONGODB_URI !== rawURI)
  throw new Error("Application and tests must share the disposable database.");
let client: MongoClient;
let bookmarks: Collection<Document>;
test.beforeAll(async () => {
  client = await new MongoClient(rawURI, {
    serverSelectionTimeoutMS: 5000,
  }).connect();
  bookmarks = client.db().collection("bookmarks");
});
test.afterAll(async () => {
  await client?.close();
});
test.beforeEach(async () => {
  await bookmarks.deleteMany({});
});

function createForm(page: Page) {
  return page
    .locator("form")
    .filter({
      has: page.locator("#create-title"),
    });
}
async function add(
  page: Page,
  title: string,
  url = "https://example.com",
  note = "",
) {
  const form = createForm(page);
  await form.getByLabel("Title", { exact: true }).fill(title);
  await form.getByLabel("URL", { exact: true }).fill(url);
  await form.getByLabel(/Note/).fill(note);
  await form.getByRole("button", { name: "Add bookmark", exact: true }).click();
  return form;
}
function item(page: Page, title: string) {
  return page
    .getByRole("listitem")
    .filter({ has: page.getByRole("link", { name: title, exact: true }) });
}
test.describe("create/read checkpoint", () => {
  test.skip(!healthy, "Only run against the healthy disposable database.");
  test("validates, creates and reloads a bookmark", async ({ page }) => {
    await page.goto("/");
    const form = await add(page, "", "javascript:alert(1)", "Keep my note");
    await expect(form.getByRole("alert")).toBeVisible();
    expect(await bookmarks.countDocuments()).toBe(0);
    await expect(form.getByLabel(/Note/)).toHaveValue("Keep my note");
    await add(page, "The tab from Tuesday", "https://example.com/tuesday", "Read before Friday");
    await expect(item(page, "The tab from Tuesday")).toBeVisible();
    await page.reload();
    await expect(item(page, "The tab from Tuesday")).toContainText("Read before Friday");
    expect(await bookmarks.countDocuments()).toBe(1);
    await expect(page.getByRole("button", { name: "Edit", exact: true })).toHaveCount(0);
  });
  test("caps this interim list at the newest 100 records", async ({ page }) => {
    const now = new Date("2026-01-01T12:00:00Z");
    await bookmarks.insertMany(Array.from({ length: 101 }, (_, i) => ({ title: `Link ${i}`, url: `https://example.com/${i}`, note: "", createdAt: new Date(now.getTime() + i), updatedAt: now })));
    await page.goto("/");
    await expect(page.getByRole("listitem")).toHaveCount(100);
    await expect(item(page, "Link 100")).toBeVisible();
    await expect(item(page, "Link 0")).toHaveCount(0);
  });
});

test.describe("database unavailable", () => {
  test.skip(healthy, "Run in both missing and unreachable URI scenarios.");
  test("shows an outage rather than empty data, and retains rejected mutation input", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Couldn’t load bookmarks", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "No bookmarks yet" }),
    ).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(
      /MONGODB_URI|MongoServerSelectionError|mongodb:\/\//,
    );
    const form = await add(
      page,
      "Preserve my bookmark",
      "https://example.com/outage",
      "Retry later",
    );
    await expect(form.getByRole("alert")).toContainText(
      /Could not confirm that the bookmark was saved/,
    );
    await expect(form.getByLabel("Title", { exact: true })).toHaveValue(
      "Preserve my bookmark",
    );
    await expect(form.getByLabel("URL", { exact: true })).toHaveValue(
      "https://example.com/outage",
    );
    await expect(form.getByLabel(/Note/)).toHaveValue("Retry later");
    expect(await bookmarks.countDocuments()).toBe(0);
  });
});
