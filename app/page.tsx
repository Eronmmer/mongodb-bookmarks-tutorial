import { connection } from "next/server";

import { BookmarkForm } from "@/components/bookmark-form";
import { BookmarkItem } from "@/components/bookmark-item";
import { listBookmarks } from "@/db/bookmarks";
import type { BookmarkView } from "@/lib/bookmark-types";

// MongoDB is reached from Node.js server code only.
export const runtime = "nodejs";

// The page reads the database on every request; never connect during a
// static build.

export default async function Home() {
  // Marks the page dynamic and waits for a request connection, so the
  // database is only queried for real visitors, never at build time.
  await connection();

  let bookmarks: BookmarkView[] = [];
  let isDatabaseUnavailable = false;

  try {
    bookmarks = await listBookmarks();
  } catch {
    // Distinguish "database down" from "empty database" for the visitor.
    // Do not log raw driver errors or connection details here.
    console.error("Failed to read bookmarks from the database.");
    isDatabaseUnavailable = true;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#1C2B26]">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Bookmarks
            </h1>
            <p className="mt-2 text-base text-[#4B5F58]">
              A small place for links worth keeping.
            </p>
          </div>
        </header>

        <main className="mt-8 grid items-start gap-8 lg:grid-cols-[21rem_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-[#1C2B26]/10 bg-white p-5 shadow-sm lg:sticky lg:top-8">
            <h2 className="text-lg font-semibold">Add a bookmark</h2>
            <p className="mt-1 text-sm text-[#4B5F58]">
              Save a link with a title and an optional note.
            </p>
            <BookmarkForm />
          </aside>

          <section aria-label="Saved bookmarks" className="min-w-0">
            {isDatabaseUnavailable ? (
              <div
                role="alert"
                className="rounded-2xl border border-[#B3261E]/30 bg-[#B3261E]/5 p-6"
              >
                <h2 className="text-lg font-semibold text-[#8C1D18]">
                  Couldn’t load bookmarks
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#8C1D18]">
                  Please try again in a moment.
                </p>
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#1C2B26]/20 bg-white/60 p-8 text-center">
                <h2 className="text-lg font-semibold">
                  No bookmarks yet
                </h2>
                <p className="mt-2 text-sm text-[#4B5F58]">
                  Add your first link with the form on this page.
                </p>
              </div>
            ) : (
              <>
                <ul className="space-y-3">
                  {bookmarks.map((bookmark) => (
                    <BookmarkItem key={bookmark.id} bookmark={bookmark} />
                  ))}
                </ul>
              </>
            )}
          </section>
        </main>

      </div>
    </div>
  );
}
