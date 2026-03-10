# Stratégie de Développement du Builder PDF pour Zolt

Ce document définit la stratégie pour l'implémentation du builder PDF, visant à offrir une alternative de haute qualité au rendu HTML tout en respectant les spécificités du format PDF.

## 1. Principes Fondamentaux
- **Fidélité Fonctionnelle :** Le builder PDF doit supporter l'intégralité de la syntaxe Zolt définie dans `features.md`, sauf exception explicitement documentée.
- **Choix Technique : `pdfmake`**
    - **Pourquoi :** Son modèle de document déclaratif (arborescence d'objets) s'aligne parfaitement avec l'AST de Zolt. Il gère nativement les problématiques complexes de layout (tableaux, colonnes, sauts de page, headers/footers).
    - **Compatibilité :** Utilisation de la version compatible Bun/Node sans dépendances natives lourdes.
- **Gestion des Éléments Dynamiques :** 
    - Pour les graphes (Mermaid, Charts) et les notations complexes (Math), la stratégie consiste à générer un buffer image (SVG transformé en PNG via `resvg-js` ou similaire) côté CLI avant l'insertion dans la définition `pdfmake`.

## 2. Architecture du Builder
- **Localisation :** `src/builder/pdf/`
- **Structure de Visitors :** Implémentation de `PDFBuilder` qui transforme l'AST Zolt en un objet `TDocumentDefinitions` pour `pdfmake`.
- **Composants de Layout :**
    - `Columns` : Mapping direct vers la propriété `columns` de `pdfmake`.
    - `Tables` : Mapping vers `table` avec support des `widths` et `layout`.
    - `Sidebars` : Utilisation de colonnes avec une largeur fixe pour simuler la sidebar, ou gestion via des marges de page dynamiques.
- **Styles & Thèmes :** Définition d'un dictionnaire de styles `pdfmake` (ex: `header`, `blockquote`, `code`) qui pourra être surchargé par les thèmes Zolt.

## 3. Workflow de Transformation (AST -> pdfmake)
1. **Prétraitement :** Résolution des variables et évaluation des expressions (via `ExpressionEvaluator`).
2. **Collecte des ressources :** Téléchargement/Résolution des images et génération des graphiques (Mermaid/Charts) en images.
3. **Visite de l'AST :** Chaque `ASTNode` produit un fragment d'objet `pdfmake`.
4. **Assemblage final :** Création de l'objet de définition complet incluant métadonnées, styles et polices.
5. **Génération :** Appel au moteur `pdfmake` pour produire le flux PDF.

## 3. Workflow de Validation
- **Parité :** Chaque fonctionnalité ajoutée au `HTMLBuilder` doit être reportée dans `features.md` et implémentée dans le `PDFBuilder`.
- **Tests Agnostiques :** Développement de suites de tests E2E qui valident la structure logique du document indépendamment du format de sortie.
- **Validation Visuelle :** Utilisation de tests de régression sur le contenu extrait du PDF (via `pdf-parse`) pour valider la présence des données.

## 4. Features Spécifiques au PDF (À venir)
- Table des matières native (PDF Outlines).
- Liens internes cliquables.
- Métadonnées du document (Auteur, Titre, Sujet).
- Chiffrement et permissions.
