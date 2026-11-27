"use client";

import { useActionState } from "react";
import { updatePassword } from "../actions";
import { Button, Card, Field, FormMessage } from "@/components/ui";

export default function NewPasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, undefined);
  return (
    <Card>
      <h1 className="mb-4 text-xl font-semibold">Nouveau mot de passe</h1>
      <form action={action} className="space-y-4">
        <Field label="Nouveau mot de passe" name="password" type="password" required minLength={8} autoComplete="new-password" />
        <FormMessage state={state} />
        <Button disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</Button>
      </form>
    </Card>
  );
}
