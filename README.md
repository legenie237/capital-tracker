# Capital Tracker

Journal de trading en ligne pour aider les traders à progresser : journal, import automatique des trades, statistiques avancées, coaching IA et communauté.

## Stack

- [Next.js](https://nextjs.org) 15 (App Router, TypeScript, Tailwind CSS)
- [Supabase](https://supabase.com) : comptes, base de données Postgres, fichiers, temps réel
- Hébergement prévu sur [Vercel](https://vercel.com)

## Démarrer en local

1. Créez un projet gratuit sur supabase.com.
2. Dans **SQL Editor**, exécutez dans l'ordre les fichiers de `supabase/migrations/` (`0001_fondations.sql`, `0002_droits_acces.sql`, `0003_captures.sql`…).
3. Dans **Authentication > URL Configuration**, ajoutez `http://localhost:3000/auth/callback` aux Redirect URLs.
4. Copiez `.env.example` en `.env.local` et collez l'URL et la clé `anon` du projet (**Project Settings > API**).
5. Lancez :

```bash
npm install
npm run dev
```

Puis ouvrez http://localhost:3000.

## Ce qui existe (étape 1 : fondations)

- Page d'accueil
- Inscription avec nom d'utilisateur unique, connexion, mot de passe oublié et réinitialisation
- Pages protégées (redirection vers la connexion)
- Profil (nom d'utilisateur, nom, objectifs, choix d'apparaître au classement, code parrain)
- Tableau de bord avec les premières statistiques
- Base de données : profils et trades, sécurisés ligne par ligne (chaque trader ne voit que ses données ; rôle et abonnement non modifiables depuis le navigateur)

## Feuille de route

1. **Fondations** (ce dépôt)
2. Journal et import automatique (MT5, Binance, CSV), statistiques avancées, calculateur de position
3. IA et communauté : analyse hebdomadaire, exercices, news économiques, forum, classement
4. Monétisation et lancement : abonnement Mobile Money et crypto, affiliation, admin, API, application Android
