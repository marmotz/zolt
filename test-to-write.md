# Tests à implémenter pour Zolt

Ce document liste les fonctionnalités qui sont implémentées dans le builder HTML mais qui ne possèdent pas (encore) de tests E2E dédiés ou suffisants.

| Feature | Fichier Source (Parser/Builder) | Raison / Manque |
| :--- | :--- | :--- |
| Barré (`~~`) | `inline-parser.ts` / `inline-visitor.ts` | Aucune trace de test E2E dans `src/api/`. |
| Surlignage (`==`) | `inline-parser.ts` / `inline-visitor.ts` | Aucune trace de test E2E dans `src/api/`. |
| Style Inline (`\|\|`) | `inline-parser.ts` / `inline-visitor.ts` | Aucune trace de test E2E dans `src/api/`. |
| Audio (`??`) | `inline-parser.ts` / `inline-visitor.ts` | Aucune trace de test E2E dans `src/api/`. |
| Fichier (`&&`) | `inline-parser.ts` / `inline-visitor.ts` | Aucune trace de test E2E dans `src/api/`. |
| Retour ligne (`\ `) | `inline-parser.ts` / `inline-visitor.ts` | Aucune trace de test E2E dans `src/api/`. |
| Mermaid (`:::mermaid`) | `triple-colon-parser.ts` / `special-block-visitor.ts` | Test de la structure HTML générée absent. |
