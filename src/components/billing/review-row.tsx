"use client";

import { useActionState } from "react";
import { reviewPayment } from "@/app/(app)/admin/actions";
import { submitKeepingValues } from "@/lib/form";

export function ReviewForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(reviewPayment, undefined);
  if (state?.message) return <p className="text-sm text-accent">{state.message}</p>;
  return (
    <form onSubmit={submitKeepingValues(action)} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input
        name="note"
        placeholder="Note (obligatoire si refus)"
        className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
      />
      <button
        name="decision"
        value="approve"
        disabled={pending}
        className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-black disabled:opacity-50"
      >
        Valider
      </button>
      <button
        name="decision"
        value="reject"
        disabled={pending}
        className="rounded-lg border border-danger px-3 py-1.5 text-sm text-danger disabled:opacity-50"
      >
        Refuser
      </button>
      {state?.error && <p className="w-full text-sm text-danger">{state.error}</p>}
    </form>
  );
}
