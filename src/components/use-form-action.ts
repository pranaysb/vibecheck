"use client";

import { startTransition, useActionState } from "react";
import type { FormState } from "@/lib/form";

/**
 * useActionState, but submitted via onSubmit so React doesn't reset the form's fields when the
 * server returns a validation error (the default for `<form action>` in React 19).
 */
export function useFormAction(fn: (prev: FormState, data: FormData) => Promise<FormState>) {
  const [state, action, pending] = useActionState(fn, undefined);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
  return { state, onSubmit, pending };
}
