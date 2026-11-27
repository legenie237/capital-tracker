"use client";

import { deleteTrade } from "@/app/(app)/trades/actions";

export function DeleteTradeButton({ id }: { id: string }) {
  return (
    <form
      action={deleteTrade}
      onSubmit={(e) => {
        if (!window.confirm("Supprimer ce trade et ses captures ? Cette action est définitive.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="rounded-lg border border-danger px-3 py-1.5 text-sm text-danger hover:bg-danger hover:text-white">
        Supprimer
      </button>
    </form>
  );
}
