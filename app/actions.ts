"use server";

import { revalidatePath } from "next/cache";

import { createBookmark } from "@/db/bookmarks";
import { validateBookmark } from "@/lib/bookmark-validation";
import type {
  ActionState,
  BookmarkFieldErrors,
  BookmarkValues,
} from "@/lib/bookmark-types";

const UNCONFIRMED_WRITE_SUFFIX =
  "Refresh the page to check the result before trying again.";

function readFormValue(formData: FormData, field: string): string {
  const value = formData.get(field);
  // Anything that is not a string (e.g. a file upload) is treated as missing
  // and rejected by validateBookmark.
  return typeof value === "string" ? value : "";
}

function readValues(formData: FormData): BookmarkValues {
  return {
    id: readFormValue(formData, "id"),
    title: readFormValue(formData, "title"),
    url: readFormValue(formData, "url"),
    note: readFormValue(formData, "note"),
  };
}

function errorState(
  message: string,
  fieldErrors: BookmarkFieldErrors,
  values: BookmarkValues,
): ActionState {
  return { status: "error", message, fieldErrors, values };
}

export async function createBookmarkAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = readValues(formData);
  const parsed = validateBookmark({
    title: formData.get("title"),
    url: formData.get("url"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return errorState(
      "Please fix the highlighted fields.",
      parsed.errors,
      values,
    );
  }

  try {
    await createBookmark(parsed.data);
  } catch {
    return errorState(
      `Could not confirm that the bookmark was saved. ${UNCONFIRMED_WRITE_SUFFIX}`,
      {},
      values,
    );
  }

  revalidatePath("/");
  return {
    status: "success",
    message: "Bookmark saved.",
    fieldErrors: {},
    values: { id: "", title: "", url: "", note: "" },
  };
}
