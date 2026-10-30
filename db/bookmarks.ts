import "server-only";

import { type WithId } from "mongodb";

import type { BookmarkInput, BookmarkView } from "@/lib/bookmark-types";
import { getDatabase } from "@/lib/mongodb";

const COLLECTION_NAME = "bookmarks";

// Show the newest 100 bookmarks until we add pagination.
export const BOOKMARK_LIST_LIMIT = 100;

interface BookmarkDocument {
  title: string;
  url: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

async function getCollection() {
  const database = await getDatabase();
  return database.collection<BookmarkDocument>(COLLECTION_NAME);
}

function toBookmarkView(document: WithId<BookmarkDocument>): BookmarkView {
  return {
    id: document._id.toString(),
    title: document.title,
    url: document.url,
    note: document.note,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

export async function listBookmarks(): Promise<BookmarkView[]> {
  const collection = await getCollection();
  const documents = await collection
    .find({})
    .sort({ createdAt: -1, _id: -1 })
    .limit(BOOKMARK_LIST_LIMIT)
    .toArray();
  return documents.map(toBookmarkView);
}

/**
 * Inserts a bookmark. Only the validated fields (title, url, note) plus
 * server-generated timestamps are written; callers pass typed, already
 * validated input (app/actions.ts validates before calling).
 */
export async function createBookmark(input: BookmarkInput): Promise<BookmarkView> {
  const now = new Date();
  const collection = await getCollection();
  const { insertedId } = await collection.insertOne({
    title: input.title,
    url: input.url,
    note: input.note,
    createdAt: now,
    updatedAt: now,
  });
  return {
    id: insertedId.toString(),
    title: input.title,
    url: input.url,
    note: input.note,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}
