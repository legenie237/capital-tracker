"use client";

import { useActionState } from "react";
import { updateProfile } from "./actions";
import { Button, Card, Field, FormMessage } from "@/components/ui";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  return (
    <Card>
      <form action={action} className="space-y-4">
        <Field label="Nom d'utilisateur" name="username" defaultValue={profile.username} required />
        <Field label="Nom complet" name="full_name" defaultValue={profile.full_name ?? ""} />
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Objectifs de trading</span>
          <textarea
            name="trading_goals"
            rows={3}
            defaultValue={profile.trading_goals ?? ""}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-accent"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="show_on_leaderboard" defaultChecked={profile.show_on_leaderboard} />
          Apparaître dans le classement
        </label>
        <FormMessage state={state} />
        <Button disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</Button>
      </form>
    </Card>
  );
}
