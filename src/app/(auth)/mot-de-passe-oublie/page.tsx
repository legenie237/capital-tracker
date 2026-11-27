"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "../actions";
import { Button, Card, Field, FormMessage } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);
  return (
    <Card>
      <h1 className="mb-4 text-xl font-semibold">Mot de passe oublié</h1>
      <form action={action} className="space-y-4">
        <Field label="Email" name="email" type="email" required autoComplete="email" />
        <FormMessage state={state} />
        <Button disabled={pending}>{pending ? "Envoi…" : "Recevoir le lien"}</Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        <Link href="/connexion" className="text-accent">Retour à la connexion</Link>
      </p>
    </Card>
  );
}
