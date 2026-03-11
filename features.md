# Registre des Fonctionnalités de Zolt

Ce document liste l'intégralité des fonctionnalités de Zolt, incluant la syntaxe, les blocs, les configurations et les
métadonnées. Il sert de référence pour assurer la parité entre les différents builders.

Légende :

- "[x]"  : Implémenté et testé (E2E)
- "[x]*" : Implémenté mais test incomplet ou manquant (voir `test-to-write.md`)
- "[ ]"  : Non implémenté

## 1. Syntaxe de Base (Inline)

| Feature               | Syntaxe                   | HTML Builder | PDF Builder | Test E2E                        |
|:----------------------|:--------------------------|:------------:|:-----------:|:--------------------------------|
| Texte brut            | `texte`                   |     [x]      |     [x]     | build.e2e.spec.ts               |
| Gras                  | `**texte**`               |     [x]      |     [x]     | attributes.e2e.spec.ts          |
| Italique              | `//texte//`               |     [x]      |     [x]     | attributes.e2e.spec.ts          |
| Souligné              | `__texte__`               |     [x]      |     [x]     | attributes.e2e.spec.ts          |
| Barré                 | `~~texte~~`               |     [x]      |     [x]     | html-inline-missing.e2e.spec.ts |
| Code en ligne         | `` `code` ``              |     [x]      |     [x]     | attributes.e2e.spec.ts          |
| Exposant              | `^{texte}`                |     [x]      |     [x]     | build.e2e.spec.ts               |
| Indice                | `_{texte}`                |     [x]      |     [x]     | build.e2e.spec.ts               |
| Surlignage            | `==texte==`               |     [x]      |     [x]     | html-inline-missing.e2e.spec.ts |
| Style inline          | `\|\|texte\|\|{...}`      |     [x]*     |     [ ]     | -                               |
| Liens (standard)      | `[label](url)`            |     [x]      |     [x]     | links.e2e.spec.ts               |
| Liens (référence)     | `[label][ref]`            |     [x]      |     [x]     | links.e2e.spec.ts               |
| Images                | `![alt](src)`             |     [x]      |     [x]     | images.e2e.spec.ts              |
| Vidéo                 | `!![alt](src)`            |     [x]      |     [x]     | images.e2e.spec.ts              |
| Audio                 | `??[alt](src)`            |     [x]      |     [x]     | html-inline-missing.e2e.spec.ts |
| Embed                 | `@@[title](src)`          |     [x]      |     [x]     | images.e2e.spec.ts              |
| Fichier               | `&&[title](src)`          |     [x]      |     [x]     | html-inline-missing.e2e.spec.ts |
| Variables locales     | `$var`                    |     [x]      |     [x]     | resource-variables.e2e.spec.ts  |
| Variables Globales    | `$#global`                |     [x]      |     [x]     | resource-variables.e2e.spec.ts  |
| Expressions           | `{{ 1 + 1 }}`             |     [x]      |     [x]     | calculations.e2e.spec.ts        |
| Include (Inline)      | `[[include path.zlt]]`    |     [x]      |     [x]     | include.e2e.spec.ts             |
| Footnote Ref          | `[^id]`                   |     [x]      |     [x]     | footnotes.e2e.spec.ts           |
| Abbréviation (Inline) | `abbr{abbr="def"}`        |     [x]      |     [x]     | abbreviations.e2e.spec.ts       |
| Commentaire inline    | `%% commentaire %%`       |     [x]      |     [x]     | inline-comments.e2e.spec.ts     |
| Math Inline           | `$E=mc^2$`                |     [x]      |     [x]     | math.e2e.spec.ts                |
| Retour à la ligne     | `\ ` (backslash + espace) |     [x]      |     [x]     | html-inline-missing.e2e.spec.ts |
| Échappement           | `\*`                      |     [x]      |     [x]     | escaping.e2e.spec.ts            |

## 2. Blocs de Contenu

| Feature                        | Syntaxe               | HTML Builder | PDF Builder | Test E2E                     |
|:-------------------------------|:----------------------|:------------:|:-----------:|:-----------------------------|
| Paragraphe                     | (texte multi-ligne)   |     [x]      |     [x]     | build.e2e.spec.ts            |
| Titre Niveau 1                 | `#`                   |     [x]      |     [x]     | build.e2e.spec.ts            |
| Titre Niveau 2                 | `##`                  |     [x]      |     [x]     | build.e2e.spec.ts            |
| Titre Niveau 3                 | `###`                 |     [x]      |     [x]     | build.e2e.spec.ts            |
| Titre Niveau 4                 | `####`                |     [x]      |     [x]     | build.e2e.spec.ts            |
| Titre Niveau 5                 | `#####`               |     [x]      |     [x]     | build.e2e.spec.ts            |
| Titre Niveau 6                 | `######`              |     [x]      |     [x]     | build.e2e.spec.ts            |
| Bloc de citation               | `>`                   |     [x]      |     [x]     | blockquotes.e2e.spec.ts      |
| Liste à puces (tiret)          | `-`                   |     [x]      |     [x]     | build.e2e.spec.ts            |
| Liste à puces (astérisque)     | `*`                   |     [x]      |     [x]     | build.e2e.spec.ts            |
| Liste à puces (plus)           | `+`                   |     [x]      |     [x]     | build.e2e.spec.ts            |
| Liste numérotée (chiffre)      | `1.`                  |     [x]      |     [x]     | build.e2e.spec.ts            |
| Liste numérotées (lettre min)  | `a.`                  |     [x]      |     [x]     | build.e2e.spec.ts            |
| Liste numérotées (romain min)  | `i.`                  |     [x]      |     [x]     | build.e2e.spec.ts            |
| Liste numérotées (romain maj)  | `I.`                  |     [x]      |     [x]     | build.e2e.spec.ts            |
| Liste numérotées (lettre maj)  | `A.`                  |     [x]      |     [x]     | build.e2e.spec.ts            |
| Liste de tâches (vide)         | `- [ ]`               |     [x]      |     [x]     | build.e2e.spec.ts            |
| Liste de tâches (cochée)       | `- [x]`               |     [x]      |     [x]     | build.e2e.spec.ts            |
| Liste de définition            | `terme : description` |     [x]      |     [x]     | definition-lists.e2e.spec.ts |
| Liste simple                   | `.. item`             |     [x]      |     [x]     | plain-list.e2e.spec.ts       |
| Bloc de code                   | ` ```lang ... ``` `   |     [x]      |     [x]     | code-blocks.e2e.spec.ts      |
| Règle horizontale (tiret)      | `---`                 |     [x]      |     [x]     | separators.e2e.spec.ts       |
| Règle horizontale (astérisque) | `***`                 |     [x]      |     [x]     | separators.e2e.spec.ts       |
| Règle horizontale (underscore) | `___`                 |     [x]      |     [x]     | separators.e2e.spec.ts       |
| Tableaux                       | `\| col \| col \|`    |     [x]      |     [x]     | tables.e2e.spec.ts           |
| Indentation                    | (espaces/tabs)        |     [x]      |     [x]     | indentation.e2e.spec.ts      |
| Footnote Def                   | `[^id]: definition`   |     [x]      |     [x]     | footnotes.e2e.spec.ts        |
| Abbréviation Def               | `*[abbr]: definition` |     [x]      |     [x]     | abbreviations.e2e.spec.ts    |
| Link Reference Def             | `[ref]: url`          |     [x]      |     [x]     | links.e2e.spec.ts            |
| Math Block                     | `$$ ... $$`           |     [x]      |     [x]     | math.e2e.spec.ts             |

## 3. Blocs Spéciaux (Triple Colon `:::`)

| Feature          | Syntaxe               | HTML Builder | PDF Builder | Test E2E                        |
|:-----------------|:----------------------|:------------:|:-----------:|:--------------------------------|
| Alert Info       | `:::info`             |     [x]      |     [x]     | triple-colon-blocks.e2e.spec.ts |
| Alert Warning    | `:::warning`          |     [x]      |     [x]     | triple-colon-blocks.e2e.spec.ts |
| Alert Error      | `:::error`            |     [x]      |     [x]     | triple-colon-blocks.e2e.spec.ts |
| Alert Success    | `:::success`          |     [x]      |     [x]     | triple-colon-blocks.e2e.spec.ts |
| Alert Note       | `:::note`             |     [x]      |     [x]     | triple-colon-blocks.e2e.spec.ts |
| Tabs             | `:::tabs`             |     [x]      |     [x]     | pdf-blocks.e2e.spec.ts          |
| Sidebar          | `:::sidebar`          |     [x]      |     [x]     | pdf-blocks.e2e.spec.ts          |
| Details          | `:::details`          |     [x]      |     [x]     | pdf-blocks.e2e.spec.ts          |
| Columns          | `:::columns`          |     [x]      |     [x]     | columns.e2e.spec.ts             |
| Mermaid          | `:::mermaid`          |     [x]*     |     [ ]     | -                               |
| Chart (Bar)      | `:::chart-bar`        |     [x]      |     [ ]     | charts.e2e.spec.ts              |
| Chart (Line)     | `:::chart-line`       |     [x]      |     [ ]     | charts.e2e.spec.ts              |
| Chart (Pie)      | `:::chart-pie`        |     [x]      |     [ ]     | charts.e2e.spec.ts              |
| Chart (Area)     | `:::chart-area`       |     [x]      |     [ ]     | charts.e2e.spec.ts              |
| Chart (Doughnut) | `:::chart-doughnut`   |     [x]      |     [ ]     | charts.e2e.spec.ts              |
| Include (Block)  | `:::include path.zlt` |     [x]      |     [ ]     | include.e2e.spec.ts             |

## 4. Blocs Dynamiques (Double Bracket `[[...]]`)

| Feature           | Syntaxe            | HTML Builder | PDF Builder | Test E2E                |
|:------------------|:-------------------|:------------:|:-----------:|:------------------------|
| Table of Contents | `[[toc]]`          |     [x]      |     [x]     | pdf-dynamic.e2e.spec.ts |
| File Tree         | `[[filetree]]`     |     [x]      |     [x]     | pdf-dynamic.e2e.spec.ts |
| File Tree Nav     | `[[filetree-nav]]` |     [x]      |     [x]     | pdf-dynamic.e2e.spec.ts |

## 5. Logique et Calculs

| Feature                | Syntaxe         | HTML Builder | PDF Builder | Test E2E                       |
|:-----------------------|:----------------|:------------:|:-----------:|:-------------------------------|
| Conditionnelle         | `:::if`         |     [x]      |     [x]     | calculations.e2e.spec.ts       |
| Boucle                 | `:::foreach`    |     [x]      |     [x]     | calculations.e2e.spec.ts       |
| Définition Var locale  | `$var = value`  |     [x]      |     [x]     | resource-variables.e2e.spec.ts |
| Définition Var globale | `$$var = value` |     [x]      |     [x]     | resource-variables.e2e.spec.ts |

## 6. Métadonnées et Configuration

| Feature          | Localisation    | HTML Builder | PDF Builder | Test E2E                 |
|:-----------------|:----------------|:------------:|:-----------:|:-------------------------|
| Frontmatter YAML | Haut de fichier |     [x]      |     [x]     | pdf-metadata.e2e.spec.ts |
| Titre            | `title:`        |     [x]      |     [x]     | pdf-metadata.e2e.spec.ts |
| Auteur           | `author:`       |     [x]      |     [x]     | pdf-metadata.e2e.spec.ts |
| Thème            | `theme:`        |     [x]      |     [ ]     | themes.e2e.spec.ts       |
| Mise en page     | `layout:`       |     [x]      |     [x]     | pdf-metadata.e2e.spec.ts |
| Sidebar config   | `sidebar:`      |     [x]      |     [x]     | pdf-metadata.e2e.spec.ts |

## 7. Attributs (`{...}`)

| Feature              | Syntaxe                    | HTML Builder | PDF Builder | Test E2E               |
|:---------------------|:---------------------------|:------------:|:-----------:|:-----------------------|
| Identifiant          | `{#id}`                    |     [x]      |     [ ]     | attributes.e2e.spec.ts |
| Classe CSS           | `{.class}`                 |     [x]      |     [ ]     | attributes.e2e.spec.ts |
| Style Inline         | `{color=red}`              |     [x]      |     [ ]     | attributes.e2e.spec.ts |
| Attributs génériques | `{attr=value}`             |     [x]      |     [ ]     | attributes.e2e.spec.ts |
| Rendu sur bloc       | `{#id}` sur ligne suivante |     [x]      |     [ ]     | attributes.e2e.spec.ts |
