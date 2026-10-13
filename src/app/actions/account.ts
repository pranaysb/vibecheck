"use server";

import { redirect } from "next/navigation";
import { clerkClient } from "@clerk/nextjs/server";
import { requireUser } from "@/lib/auth/session";
import { deleteUserData } from "@/lib/account";
import type { FormState } from "@/lib/form";

export async function deleteAccount(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/dashboard");
  if (String(form.get("confirm") ?? "").trim().toLowerCase() !== "delete") return { error: 'Type "delete" to confirm.' };
  const clerkId = await deleteUserData(user.id);
  if (clerkId) {
    try {
      await (await clerkClient()).users.deleteUser(clerkId);
    } catch (err) {
      console.error("Clerk user deletion failed:", err);
      return { error: "Your VibeCheck data was deleted, but removing your sign-in failed. Delete it under Manage account, or contact us." };
    }
  }
  redirect("/?deleted=1");
}
