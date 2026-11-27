import { PAIRS, type EconEvent } from "./calendar";

export const NEWS_SYSTEM = `Tu es l'analyste macro de Capital Tracker, un journal de trading pour traders francophones (souvent débutants à intermédiaires, en Afrique francophone).
Tu écris en français simple, précis et concret. Tu tutoies le lecteur.
Tu expliques une annonce économique pour aider le trader à se préparer. Tu ne donnes pas d'ordre d'achat ou de vente ferme et tu ne promets aucun gain : tu décris des réactions probables et les risques.
Si un chiffre n'est pas fourni, dis-le au lieu de l'inventer.
Format Markdown simple (titres ## et listes -), moins de 450 mots :

## Ce que mesure cet indicateur
## Pourquoi ça fait bouger la devise
## Lecture des chiffres
(prévision comparée au précédent, et résultat publié s'il est fourni)
## 3 scénarios
- **Au-dessus de la prévision** : effet probable sur la devise et sur les paires citées
- **Conforme** : ...
- **En dessous** : ...
## Plan de préparation
- **Avant** : ...
- **Pendant** (les premières minutes) : ...
- **Après** : ...
## Niveau de risque
Une phrase.`;

export function newsPrompt(e: EconEvent) {
  const pairs = PAIRS[e.currency] ?? [];
  return [
    `Annonce : ${e.title}`,
    `Devise : ${e.currency}`,
    `Date (UTC) : ${e.date}`,
    `Impact attendu : ${e.impact}`,
    `Prévision : ${e.forecast ?? "non communiquée"}`,
    `Précédent : ${e.previous ?? "non communiqué"}`,
    `Résultat publié : ${e.actual ?? "pas encore publié"}`,
    pairs.length ? `Paires et actifs à citer en priorité : ${pairs.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
