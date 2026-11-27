"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "../actions";
import { Button, Card, Field, FormMessage } from "@/components/ui";

export function LoginForm({ suite, linkError }: { suite: string; linkError: boolean }) {
  const [state, action, pending] = useActionState(signIn, undefined);
  return (
    <Card>
      <h1 className="mb-4 text-xl font-semibold">Connexion</h1>
      {linkError && <p className="mb-3 text-sm text-danger">Ce lien est expiré ou invalide.</p>}
      <form action={action} className="space-y-4">
        <input type="hidden" name="suite" value={suite} />
        <Field label="Email" name="email" type="email" required autoComplete="email" />
        <Field label="Mot de passe" name="password" type="password" required autoComplete="current-password" />
        <FormMessage state={state} />
        <Button disabled={pending}>{pending ? "Connexion…" : "Se connecter"}</Button>
      </form>
      <div className="mt-4 flex justify-between text-sm text-muted">
        <Link href="/mot-de-passe-oublie" className="hover:text-foreground">Mot de passe oublié ?</Link>
        <Link href="/inscription" className="hover:text-foreground">Créer un compte</Link>
      </div>
    </Card>
  );
}
