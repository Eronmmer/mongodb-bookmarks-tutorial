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
async function seed(title = "Seed bookmark", extra: Document = {}) {
  const now = new Date("2025-01-01T12:00:00.000Z");
  const doc = {
    title,
    url: "https://example.com",
    note: "Original note",
    createdAt: now,
    updatedAt: now,
    ...extra,
  };
  const result = await bookmarks.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

test.describe("healthy database", () => {
  test.skip(!healthy, "Only run against the healthy disposable database.");

  test("delete requires confirmation and cancel leaves the document intact", async ({
    page,
  }) => {
    const original = await seed();
    await page.goto("/");
    const card = item(page, original.title);
    await card.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(
      card.getByText("Delete this bookmark?", { exact: true }),
    ).toBeVisible();
    await card.getByRole("button", { name: "Cancel", exact: true }).click();
    expect(await bookmarks.countDocuments()).toBe(1);
    await card.getByRole("button", { name: "Delete", exact: true }).click();
    await card
      .getByRole("button", { name: "Confirm delete", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "No bookmarks yet" }),
    ).toBeVisible();
    expect(await bookmarks.countDocuments()).toBe(0);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "No bookmarks yet" }),
    ).toBeVisible();
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
