"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "../actions";
import { Button, Card, Field, FormMessage } from "@/components/ui";

export default function SignUpPage() {
  const [state, action, pending] = useActionState(signUp, undefined);
  return (
    <Card>
      <h1 className="mb-4 text-xl font-semibold">Créer un compte</h1>
      <form action={action} className="space-y-4">
        <Field label="Nom d'utilisateur" name="username" required minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]+" />
        <Field label="Email" name="email" type="email" required autoComplete="email" />
        <Field label="Mot de passe (8 caractères min.)" name="password" type="password" required minLength={8} autoComplete="new-password" />
        <FormMessage state={state} />
        <Button disabled={pending}>{pending ? "Création…" : "S'inscrire"}</Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        Déjà inscrit ? <Link href="/connexion" className="text-accent">Se connecter</Link>
      </p>
    </Card>
  );
}
