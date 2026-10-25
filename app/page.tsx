import { connection } from "next/server";

import { BookmarkForm } from "@/components/bookmark-form";
import { BookmarkItem } from "@/components/bookmark-item";
import {
  BOOKMARK_LIST_LIMIT,
  countBookmarks,
  listBookmarks,
} from "@/db/bookmarks";
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
  let totalCount = 0;
  let isDatabaseUnavailable = false;

  try {
    [bookmarks, totalCount] = await Promise.all([
      listBookmarks(),
      countBookmarks(),
    ]);
  } catch {
    // Distinguish "database down" from "empty database" for the visitor.
    // Do not log raw driver errors or connection details here.
    console.error("Failed to read bookmarks from the database.");
    isDatabaseUnavailable = true;
  }

  const hasMoreBookmarks =
    !isDatabaseUnavailable && totalCount > BOOKMARK_LIST_LIMIT;

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
          <span className="inline-flex items-center rounded-full border border-[#00684A]/25 bg-[#00684A]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#00684A]">
            Shared learning demo
          </span>
        </header>

        <p className="mt-3 max-w-xl text-sm text-[#4B5F58]">
          Everyone visiting this demo shares the same bookmark list — anything
          you add or change can be seen and edited by others.
        </p>

        <main className="mt-8 grid items-start gap-8 lg:grid-cols-[21rem_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-[#1C2B26]/10 bg-white p-5 shadow-sm lg:sticky lg:top-8">
            <h2 className="text-lg font-semibold">Add a bookmark</h2>
            <p className="mt-1 text-sm text-[#4B5F58]">
              New bookmarks appear at the top of the shared list.
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
                  Database unavailable
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#8C1D18]">
                  We could not reach the database, so bookmarks cannot be shown
                  or saved right now. Please try again later.
                </p>
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#1C2B26]/20 bg-white/60 p-8 text-center">
                <h2 className="text-lg font-semibold">No bookmarks yet</h2>
                <p className="mt-2 text-sm text-[#4B5F58]">
                  Add your first link with the form on this page.
                </p>
              </div>
            ) : (
              <>
                {hasMoreBookmarks ? (
                  <p
                    role="status"
                    className="mb-4 rounded-xl border border-[#8A6D1F]/30 bg-[#FFF8E1] px-4 py-3 text-sm text-[#6E5611]"
                  >
                    Showing the newest {BOOKMARK_LIST_LIMIT} of {totalCount}{" "}
                    bookmarks. Older bookmarks are not loaded in this demo.
                  </p>
                ) : null}
                <ul className="space-y-3">
                  {bookmarks.map((bookmark) => (
                    <BookmarkItem key={bookmark.id} bookmark={bookmark} />
                  ))}
                </ul>
              </>
            )}
          </section>
        </main>

        <footer className="mt-12 border-t border-[#1C2B26]/10 pt-6 text-xs text-[#6B7F77]">
          Built with Next.js and MongoDB as a hands-on learning demo.
        </footer>
      </div>
    </div>
  );
}
