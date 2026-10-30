import type { BookmarkView } from "@/lib/bookmark-types";

export function BookmarkItem({ bookmark }: { bookmark: BookmarkView }) {
  return (
    <li className="rounded-xl border border-[#1C2B26]/10 bg-white p-5 shadow-sm">
      <a href={bookmark.url} target="_blank" rel="noopener noreferrer"
        className="font-semibold text-[#00684A] underline underline-offset-4">
        {bookmark.title}
      </a>
      <p className="mt-1 break-all text-sm text-[#4B5F58]">{bookmark.url}</p>
      {bookmark.note ? <p className="mt-3 whitespace-pre-wrap text-sm">{bookmark.note}</p> : null}
    </li>
  );
}
