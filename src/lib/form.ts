import { startTransition, type FormEvent } from "react";

/**
 * Envoie un formulaire à une action serveur sans le vider.
 * Avec `<form action={...}>`, React efface tous les champs après l'envoi :
 * en cas d'erreur, l'utilisateur devait tout retaper.
 */
export function submitKeepingValues(action: (data: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(event.currentTarget, submitter instanceof HTMLElement ? submitter : null);
    startTransition(() => action(data));
  };
}
