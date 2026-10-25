import "server-only";

import { ObjectId, type WithId } from "mongodb";

import { isBookmarkId } from "@/lib/bookmark-validation";
import type { BookmarkInput, BookmarkView } from "@/lib/bookmark-types";
import { getDatabase } from "@/lib/mongodb";

const COLLECTION_NAME = "bookmarks";

// The shared demo list is bounded to the 100 newest bookmarks.
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

/** Newest first, bounded to the newest 100 documents. */
export async function listBookmarks(): Promise<BookmarkView[]> {
  const collection = await getCollection();
  const documents = await collection
    .find()
    .sort({ createdAt: -1, _id: -1 })
    .limit(BOOKMARK_LIST_LIMIT)
    .toArray();
  return documents.map(toBookmarkView);
}

/** Total stored bookmarks, used to disclose the list limit on the page. */
export async function countBookmarks(): Promise<number> {
  const collection = await getCollection();
  return collection.countDocuments();
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

/** Updates title, url, note and updatedAt only; createdAt is preserved. */
export async function updateBookmark(
  id: string,
  input: BookmarkInput,
): Promise<boolean> {
  if (!isBookmarkId(id)) {
    return false;
  }
  const collection = await getCollection();
  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        title: input.title,
        url: input.url,
        note: input.note,
        updatedAt: new Date(),
      },
    },
  );
  return result.matchedCount > 0;
}

export async function deleteBookmark(id: string): Promise<boolean> {
  if (!isBookmarkId(id)) {
    return false;
  }
  const collection = await getCollection();
  const result = await collection.deleteOne({
    _id: new ObjectId(id),
  });
  return result.deletedCount > 0;
}
