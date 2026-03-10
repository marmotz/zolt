# Registre des Fonctionnalités de Zolt

Ce document liste l'intégralité des fonctionnalités de Zolt, incluant la syntaxe, les blocs, les configurations et les
métadonnées. Il sert de référence pour assurer la parité entre les différents builders.

Légende :

- "[x]"  : Implémenté et testé (E2E)
- "[x]*" : Implémenté mais test incomplet ou manquant (voir `test-to-write.md`)
- "[ ]"  : Non implémenté

## 1. Syntaxe de Base (Inline)

| Feature               | Syntaxe                   | HTML Builder | PDF Builder | Test E2E                       |
|:----------------------|:--------------------------|:------------:|:-----------:|:-------------------------------|
| Texte brut            | `texte`                   |     [x]      |     [ ]     | build.e2e.spec.ts              |
| Gras                  | `**texte**`               |     [x]      |     [ ]     | attributes.e2e.spec.ts         |
| Italique              | `//texte//`               |     [x]      |     [ ]     | attributes.e2e.spec.ts         |
| Souligné              | `__texte__`               |     [x]      |     [ ]     | attributes.e2e.spec.ts         |
| Barré                 | `~~texte~~`               |     [x]*     |     [ ]     | -                              |
| Code en ligne         | `` `code` ``              |     [x]      |     [ ]     | attributes.e2e.spec.ts         |
| Exposant              | `^{texte}`                |     [x]      |     [ ]     | build.e2e.spec.ts              |
| Indice                | `_{texte}`                |     [x]      |     [ ]     | build.e2e.spec.ts              |
| Surlignage            | `==texte==`               |     [x]*     |     [ ]     | -                              |
| Style inline          | `\|\|texte\|\|{...}`      |     [x]*     |     [ ]     | -                              |
| Liens (standard)      | `[label](url)`            |     [x]      |     [ ]     | links.e2e.spec.ts              |
| Liens (référence)     | `[label][ref]`            |     [x]      |     [ ]     | links.e2e.spec.ts              |
| Images                | `![alt](src)`             |     [x]      |     [ ]     | images.e2e.spec.ts             |
| Vidéo                 | `!![alt](src)`            |     [x]      |     [ ]     | images.e2e.spec.ts             |
| Audio                 | `??[alt](src)`            |     [x]*     |     [ ]     | -                              |
| Embed                 | `@@[title](src)`          |     [x]      |     [ ]     | images.e2e.spec.ts             |
| Fichier               | `&&[title](src)`          |     [x]*     |     [ ]     | -                              |
| Variables locales     | `$var`                    |     [x]      |     [ ]     | resource-variables.e2e.spec.ts |
| Variables Globales    | `$#global`                |     [x]      |     [ ]     | resource-variables.e2e.spec.ts |
| Expressions           | `{{ 1 + 1 }}`             |     [x]      |     [ ]     | calculations.e2e.spec.ts       |
| Include (Inline)      | `[[include path.zlt]]`    |     [x]      |     [ ]     | include.e2e.spec.ts            |
| Footnote Ref          | `[^id]`                   |     [x]      |     [ ]     | footnotes.e2e.spec.ts          |
| Abbréviation (Inline) | `abbr{abbr="def"}`        |     [x]      |     [ ]     | abbreviations.e2e.spec.ts      |
| Commentaire inline    | `%% commentaire %%`       |     [x]      |     [ ]     | inline-comments.e2e.spec.ts    |
| Math Inline           | `$E=mc^2$`                |     [x]      |     [ ]     | math.e2e.spec.ts               |
| Retour à la ligne     | `\ ` (backslash + espace) |     [x]*     |     [ ]     | -                              |
| Échappement           | `\*`                      |     [x]      |     [ ]     | escaping.e2e.spec.ts           |

## 2. Blocs de Contenu

| Feature                        | Syntaxe               | HTML Builder | PDF Builder | Test E2E                     |
|:-------------------------------|:----------------------|:------------:|:-----------:|:-----------------------------|
| Paragraphe                     | (texte multi-ligne)   |     [x]      |     [ ]     | build.e2e.spec.ts            |
| Titre Niveau 1                 | `#`                   |     [x]      |     [ ]     | build.e2e.spec.ts            |
| Titre Niveau 2                 | `##`                  |     [x]      |     [ ]     | build.e2e.spec.ts            |
| Titre Niveau 3                 | `###`                 |     [x]      |     [ ]     | build.e2e.spec.ts            |
| Titre Niveau 4                 | `####`                |     [x]      |     [ ]     | build.e2e.spec.ts            |
| Titre Niveau 5                 | `#####`               |     [x]      |     [ ]     | build.e2e.spec.ts            |
| Titre Niveau 6                 | `######`              |     [x]      |     [ ]     | build.e2e.spec.ts            |
| Bloc de citation               | `>`                   |     [x]      |     [ ]     | blockquotes.e2e.spec.ts      |
| Liste à puces (tiret)          | `-`                   |     [x]      |     [ ]     | build.e2e.spec.ts            |
| Liste à puces (astérisque)     | `*`                   |     [x]      |     [ ]     | build.e2e.spec.ts            |
| Liste à puces (plus)           | `+`                   |     [x]      |     [ ]     | build.e2e.spec.ts            |
| Liste numérotée (chiffre)      | `1.`                  |     [x]      |     [ ]     | build.e2e.spec.ts            |
| Liste numérotées (lettre min)  | `a.`                  |     [x]      |     [ ]     | build.e2e.spec.ts            |
| Liste numérotées (romain min)  | `i.`                  |     [x]      |     [ ]     | build.e2e.spec.ts            |
| Liste numérotées (romain maj)  | `I.`                  |     [x]      |     [ ]     | build.e2e.spec.ts            |
| Liste numérotées (lettre maj)  | `A.`                  |     [x]      |     [ ]     | build.e2e.spec.ts            |
| Liste de tâches (vide)         | `- [ ]`               |     [x]      |     [ ]     | build.e2e.spec.ts            |
| Liste de tâches (cochée)       | `- [x]`               |     [x]      |     [ ]     | build.e2e.spec.ts            |
| Liste de définition            | `terme : description` |     [x]      |     [ ]     | definition-lists.e2e.spec.ts |
| Liste simple                   | `.. item`             |     [x]      |     [ ]     | plain-list.e2e.spec.ts       |
| Bloc de code                   | ` ```lang ... ``` `   |     [x]      |     [ ]     | code-blocks.e2e.spec.ts      |
| Règle horizontale (tiret)      | `---`                 |     [x]      |     [ ]     | separators.e2e.spec.ts       |
| Règle horizontale (astérisque) | `***`                 |     [x]      |     [ ]     | separators.e2e.spec.ts       |
| Règle horizontale (underscore) | `___`                 |     [x]      |     [ ]     | separators.e2e.spec.ts       |
| Tableaux                       | `\| col \| col \|`    |     [x]      |     [ ]     | tables.e2e.spec.ts           |
| Indentation                    | (espaces/tabs)        |     [x]      |     [ ]     | indentation.e2e.spec.ts      |
| Footnote Def                   | `[^id]: definition`   |     [x]      |     [ ]     | footnotes.e2e.spec.ts        |
| Abbréviation Def               | `*[abbr]: definition` |     [x]      |     [ ]     | abbreviations.e2e.spec.ts    |
| Link Reference Def             | `[ref]: url`          |     [x]      |     [ ]     | links.e2e.spec.ts            |
| Math Block                     | `$$ ... $$`           |     [x]      |     [ ]     | math.e2e.spec.ts             |

## 3. Blocs Spéciaux (Triple Colon `:::`)

| Feature          | Syntaxe               | HTML Builder | PDF Builder | Test E2E                        |
|:-----------------|:----------------------|:------------:|:-----------:|:--------------------------------|
| Alert Info       | `:::info`             |     [x]      |     [ ]     | triple-colon-blocks.e2e.spec.ts |
| Alert Warning    | `:::warning`          |     [x]      |     [ ]     | triple-colon-blocks.e2e.spec.ts |
| Alert Error      | `:::error`            |     [x]      |     [ ]     | triple-colon-blocks.e2e.spec.ts |
| Alert Success    | `:::success`          |     [x]      |     [ ]     | triple-colon-blocks.e2e.spec.ts |
| Alert Note       | `:::note`             |     [x]      |     [ ]     | triple-colon-blocks.e2e.spec.ts |
| Tabs             | `:::tabs`             |     [x]      |     [ ]     | tabs.e2e.spec.ts                |
| Sidebar          | `:::sidebar`          |     [x]      |     [ ]     | sidebar.e2e.spec.ts             |
| Details          | `:::details`          |     [x]      |     [ ]     | triple-colon-blocks.e2e.spec.ts |
| Columns          | `:::columns`          |     [x]      |     [ ]     | columns.e2e.spec.ts             |
| Mermaid          | `:::mermaid`          |     [x]*     |     [ ]     | -                               |
| Chart (Bar)      | `:::chart-bar`        |     [x]      |     [ ]     | charts.e2e.spec.ts              |
| Chart (Line)     | `:::chart-line`       |     [x]      |     [ ]     | charts.e2e.spec.ts              |
| Chart (Pie)      | `:::chart-pie`        |     [x]      |     [ ]     | charts.e2e.spec.ts              |
| Chart (Area)     | `:::chart-area`       |     [x]      |     [ ]     | charts.e2e.spec.ts              |
| Chart (Doughnut) | `:::chart-doughnut`   |     [x]      |     [ ]     | charts.e2e.spec.ts              |
| Include (Block)  | `:::include path.zlt` |     [x]      |     [ ]     | include.e2e.spec.ts             |

## 4. Blocs Dynamiques (Double Bracket `[[...]]`)

| Feature           | Syntaxe            | HTML Builder | PDF Builder | Test E2E                 |
|:------------------|:-------------------|:------------:|:-----------:|:-------------------------|
| Table of Contents | `[[toc]]`          |     [x]      |     [ ]     | toc.e2e.spec.ts          |
| File Tree         | `[[filetree]]`     |     [x]      |     [ ]     | filetree.e2e.spec.ts     |
| File Tree Nav     | `[[filetree-nav]]` |     [x]      |     [ ]     | filetree-nav.e2e.spec.ts |

## 5. Logique et Calculs

| Feature                | Syntaxe         | HTML Builder | PDF Builder | Test E2E                       |
|:-----------------------|:----------------|:------------:|:-----------:|:-------------------------------|
| Conditionnelle         | `:::if`         |     [x]      |     [ ]     | calculations.e2e.spec.ts       |
| Boucle                 | `:::foreach`    |     [x]      |     [ ]     | calculations.e2e.spec.ts       |
| Définition Var locale  | `$var = value`  |     [x]      |     [ ]     | resource-variables.e2e.spec.ts |
| Définition Var globale | `$$var = value` |     [x]      |     [ ]     | resource-variables.e2e.spec.ts |

## 6. Métadonnées et Configuration

| Feature          | Localisation    | HTML Builder | PDF Builder | Test E2E                             |
|:-----------------|:----------------|:------------:|:-----------:|:-------------------------------------|
| Frontmatter YAML | Haut de fichier |     [x]      |     [ ]     | file-metadata-evaluation.e2e.spec.ts |
| Titre            | `title:`        |     [x]      |     [ ]     | file-metadata-evaluation.e2e.spec.ts |
| Auteur           | `author:`       |     [x]      |     [ ]     | file-metadata-evaluation.e2e.spec.ts |
| Thème            | `theme:`        |     [x]      |     [ ]     | themes.e2e.spec.ts                   |
| Mise en page     | `layout:`       |     [x]      |     [ ]     | layout.e2e.spec.ts                   |
| Sidebar config   | `sidebar:`      |     [x]      |     [ ]     | sidebar-layout.e2e.spec.ts           |

## 7. Attributs (`{...}`)

| Feature              | Syntaxe                    | HTML Builder | PDF Builder | Test E2E               |
|:---------------------|:---------------------------|:------------:|:-----------:|:-----------------------|
| Identifiant          | `{#id}`                    |     [x]      |     [ ]     | attributes.e2e.spec.ts |
| Classe CSS           | `{.class}`                 |     [x]      |     [ ]     | attributes.e2e.spec.ts |
| Style Inline         | `{color=red}`              |     [x]      |     [ ]     | attributes.e2e.spec.ts |
| Attributs génériques | `{attr=value}`             |     [x]      |     [ ]     | attributes.e2e.spec.ts |
| Rendu sur bloc       | `{#id}` sur ligne suivante |     [x]      |     [ ]     | attributes.e2e.spec.ts |
