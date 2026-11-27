/** Nombre d'appels au coach autorisés par jour et par trader. */
export const COACH_LIMITS = { bilan: 3, question: 30 } as const;
export type CoachKind = keyof typeof COACH_LIMITS;

/** Modèle Claude utilisé (modifiable avec la variable COACH_MODEL). */
export const COACH_MODEL = process.env.COACH_MODEL || "claude-opus-5-5";

/** Taille maximale d'une question et de l'historique envoyé. */
export const MAX_QUESTION = 2000;
export const MAX_HISTORY = 12;
