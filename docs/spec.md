# 📘 Spécification Complète : Zolt v0.2

_Zolt : The high-voltage successor to Markdown_

## 0. Introduction et Philosophie

Le **Zolt** est un langage de balisage léger conçu pour être entièrement lisible en texte brut tout en
offrant la puissance sémantique du HTML5 et la précision du LaTeX.

### 0.1 Philosophie de Conception

- **Zéro HTML :** Tout ce qui est faisable en HTML/CSS doit avoir une syntaxe Zolt native
- **Stricte mais Flexible :** Une erreur de syntaxe ne casse pas le document, mais le moteur de rendu doit avertir
  l'auteur
- **Extensibilité par Blocs :** Utilisation systématique des "Triple Colon" `:::` pour les fonctions avancées
- **Rétrocompatibilité :** Un fichier `.md` classique passera dans un parseur Zolt sans erreur, mais un fichier `.zlt`
  profitera de toute la puissance structurelle

### 0.2 Objectifs

- Créer des documents interactifs et professionnels (rapports de données, ebooks) avec la même rapidité qu'une prise de
  notes
- Le fichier reste un simple `.txt`, mais avec une intelligence de structure bien supérieure
- Permettre la maintenance facile grâce aux variables et références dynamiques

---

## 1. Le Système d'Attributs Universel `{}`

C'est le **"cœur" du langage**. Tout élément (titre, image, lien, paragraphe, texte) peut accepter des propriétés de
style ou de comportement entre accolades placées immédiatement après l'élément, sans espace.

### 1.1 Syntaxe Générale

```
élément{id=mon-id class=ma-classe style=valeur}
```

Tout élément (titre, image, lien, paragraphe, liste, bloc, texte) peut accepter des propriétés.

### 1.2 Attributs sur les Éléments de Bloc

| Élément          | Exemple de syntaxe                       | Rendu HTML (approximatif)                      |
|------------------|------------------------------------------|------------------------------------------------|
| **Paragraphe**   | `Ceci est un paragraphe.{#para-1}`       | `<p id="para-1">...</p>`                       | 
| **Liste**        | `- Item 1\n- Item 2\n{#ma-liste}`        | `<ul id="ma-liste">...</ul>`                   |
| **Blockquote**   | `> Citation\n{#citation-1}`              | `<blockquote id="citation-1">...</blockquote>` |
| **Tableau**      | `[[table id=stats]]` ou après le tableau | `<table id="stats">...</table>`                |
| **Code Block**   | `\```js {#code-js}\n...\n\``` `          | `<pre id="code-js">...</pre>`                  |
| **Triple Colon** | `:::info {#note}\n...\n:::`              | `<div id="note" class="info">...</div>`        |

### 1.3 Attributs sur le Texte Inline

| Syntaxe                  | Description        | Exemple                             |
|--------------------------|--------------------|-------------------------------------|
| `{color=blue}`           | Couleur du texte   | `Texte{color=blue}`                 |
| `{size=2em}`             | Taille du texte    | `Gros texte{size=2em}`              |
| `{#mon-ancre}`           | Identifiant unique | `Texte avec ancre{#mon-ancre}`      |
| `{.ma-classe-css}`       | Classes CSS        | `Texte stylé{.ma-classe-css}`       |
| `{background=soft-blue}` | Couleur de fond    | `Texte surligné{background=yellow}` |
| `{font-weight=bold}`     | Poids de police    | `Important{font-weight=bold}`       |

Tout élément inline supporte les attributs :

- `**gras**{#id}`
- `//italique//{.class}`
- `__souligné__{style="color: blue"}`
- `||groupe de mots||{#ancre}`

### 1.3 Attributs sur les Titres

```
## Chapitre 1{#intro}
```

Génère automatiquement une ancre pour les références croisées.

| Attribut           | Description               | Exemple                     |
|--------------------|---------------------------|-----------------------------|
| `{#id}`            | Identifiant unique        | `## Titre{#intro}`          |
| `{numbered}`       | Active la numérotation    | `## Chapitre{numbered}`     |
| `{numbered=false}` | Désactive la numérotation | `## Annexe{numbered=false}` |

### 1.4 Attributs sur les Images

```
![Alt](url.jpg){w=300 h=200 align=center shadow=true}
```

| Attribut                  | Description                      |
|---------------------------|----------------------------------|
| `w=300` ou `width=300px`  | Largeur                          |
| `h=200` ou `height=200px` | Hauteur                          |
| `align=center`            | Alignement (left, center, right) |
| `shadow=true`             | Ombre portée                     |
| `float=right`             | Flottement                       |

### 1.5 Attributs sur les Vidéos

```
!![Alt](video.mp4){autoplay loop muted}
```

| Attribut   | Description         |
|------------|---------------------|
| `autoplay` | Lecture automatique |
| `loop`     | Boucle              |
| `muted`    | Son désactivé       |

### 1.6 Autonumérotation des Titres

Le Zolt permet de numéroter automatiquement les titres de manière hiérarchique, avec différents styles de numérotation.

#### Activation Globale

Les variables globales permettent d'activer la numérotation pour tout le document :

```
$numbering = true           # Active la numérotation globale
$numbering_style = "decimal"# Style : 1, 1.1, 1.1.1 (défaut)
```

#### Activation Locale

L'attribut `{numbered}` sur un titre active la numérotation pour ce titre et ses sous-titres :

```
# Introduction {numbered}
## Concepts de base        # Devient 1.1 Concepts de base
## Architecture            # Devient 1.2 Architecture
### Composants             # Devient 1.2.1 Composants
# Conclusion {numbered}    # Devient 2. Conclusion
```

#### Désactivation Locale

Pour désactiver la numérotation sur une section spécifique tout en la gardant active globalement :

```
# Annexe {numbered=false}
## Code source            # Non numéroté
## Ressources             # Non numéroté
```

#### Styles de Numérotation Disponibles

| Style         | Description          | Exemple de rendu |
|---------------|----------------------|------------------|
| `decimal`     | Nombres décimaux     | 1, 1.1, 1.1.1    |
| `roman-lower` | Chiffres romains min | i, ii, iii       |
| `roman-upper` | Chiffres romains maj | I, II, III       |
| `alpha-lower` | Lettres minuscules   | a, b, c          |
| `alpha-upper` | Lettres majuscules   | A, B, C          |

#### Exemples d'Utilisation

```
$numbering = true
$numbering_style = "decimal"

# Mémoire de Fin d'Études {numbered}
## Introduction
### Contexte
### Problématique
## Méthodologie
### Collecte de données
### Analyse

# Bibliographie {numbered=false}
```

Rendu :

-
    1. Mémoire de Fin d'Études

    - 1.1 Introduction
        - 1.1.1 Contexte
        - 1.1.2 Problématique
    - 1.2 Méthodologie
        - 1.2.1 Collecte de données
        - 1.2.2 Analyse

- Bibliographie

#### Comportement par Défaut

Par défaut (sans variable `$numbering`), les titres ne sont pas numérotés. L'ajout de `{numbered}` sur un titre active
la numérotation hiérarchique à partir de ce point.

---

## 2. Typographie et Mise en Forme

Le Zolt utilise des symboles distinctifs pour éviter les conflits avec les listes et autres éléments.

### 2.1 Tableau des Symboles de Formatage

| Symbole     | Rendu HTML            | Description                                           |
|-------------|-----------------------|-------------------------------------------------------|
| `**texte**` | **Gras**              | Formatage classique                                   |
| `//texte//` | _Italique_            | Remplace `*` pour éviter les conflits avec les listes |
| `__texte__` | <u>Souligné</u>       | Natif en Zolt                                         |
| `~~texte~~` | ~~Barré~~             | Formatage classique                                   |
| `^{texte}`  | <sup>Exposant</sup>   | Natif (supporte l'imbrication)                        |
| `_{texte}`  | <sub>Indice</sub>     | Natif (supporte l'imbrication)                        |
| `==texte==` | <mark>Surligné</mark> | Natif                                                 |

### 2.2 Priorité de Traitement

Le parseur traite les éléments dans cet ordre :

1. Variables `{$var}`
2. Blocs `[[...]]` et `:::`
3. Inline (gras, italique, etc.)
4. Attributs `{}` appliqués à l'élément immédiatement à gauche

### 2.3 Commentaires

Le Zolt permet d'ajouter des commentaires qui ne seront pas affichés dans le rendu final (HTML, PDF, etc.). Ces
commentaires sont utiles pour les notes de l'auteur, les TODO, ou la documentation interne.

#### Commentaires de Bloc (Multi-lignes)

Les blocs de commentaires utilisent la syntaxe des "Triple Colons" :

```
:::comment
Ceci est un commentaire multi-lignes
qui ne sera pas affiché dans le rendu final.

Utile pour :
- Notes de rédaction
- TODO et sections à compléter
- Documentation interne
- Explications pour les contributeurs
:::
```

#### Commentaires Inline

Les commentaires inline permettent des notes rapides au sein du texte :

```
Ceci est du texte normal %% et ceci est un commentaire inline %%.

# Titre principal %% TODO: revoir cette section %%

## Introduction %% Note: vérifier les sources %% Suite du titre
```

Les caractères entre `%%` et `%%` sont ignorés par le moteur de rendu.

#### Cas d'Usage

| Usage                       | Syntaxe recommandée                    |
|-----------------------------|----------------------------------------|
| Notes de rédaction longues  | `:::comment ... :::`                   |
| TODO temporaires            | `%% TODO: action %%`                   |
| Notes pour contributeurs    | `:::note ... :::` ou `%% Note: ... %%` |
| Commentaire de fin de ligne | `Texte %% commentaire %%`              |

#### Remarques Importantes

- Les commentaires ne sont **pas** inclus dans le rendu final
- Les commentaires inline `%%` doivent être fermés par un second `%%`
- Les blocs `:::comment` peuvent contenir n'importe quel texte, y compris du code
- Les commentaires sont conservés dans le fichier source `.zlt` pour la maintenance

### 2.4 Listes

Le Zolt supporte tous les types de listes avec une syntaxe cohérente et proche de Markdown classique, enrichie par les
attributs.

#### Listes à Puces

```
- Item 1
- Item 2
- Item 3
```

#### Listes sans puce (Plain)

Utilisent le préfixe `+ ` pour afficher des éléments sans marqueur visuel (puce ou numéro) et sans décalage à gauche.

```
+ Premier élément
+ Deuxième élément
```

#### Listes Numérotées

```
1. Premier item
2. Deuxième item
3. Troisième item
```

La numérotation automatique est gérée par le moteur de rendu.

#### Listes de Tâches (Checkboxes)

```
- [ ] Tâche à faire
- [x] Tâche complétue
- [ ] Tâche prioritaire{color=red}
```

#### Listes Imbriquées

L'imbrication se fait par indentation (2 espaces ou 1 tabulation) :

```
- Item niveau 1
  - Sous-item niveau 2
  - Autre sous-item
- Autre item niveau 1
    - Sous-item niveau 3
```

#### Listes de Définition

Les listes de définitions utilisent le préfixe `:` pour cohérence avec les autres types de listes :

```
: HTML
:   HyperText Markup Language, langage de balisage pour le web

: CSS
:   Cascading Style Sheets, langage de description de styles
:   Permet de séparer le contenu de la présentation

: JavaScript
:   Langage de programmation pour le web interactif
```

La définition peut s'étendre sur plusieurs lignes tant qu'elle reste indentée.

#### Attributs sur les Items de Liste

```
- Item normal
- Item important{color=red font-weight=bold}
- Item avec note{.highlight}
- [ ] Tâche urgente{background=yellow}
```

#### Règles de Syntaxe

- Les items de liste commencent en début de ligne
- L'imbrication se fait par 2 espaces ou 1 tabulation
- Les listes de même type se suivent naturellement
- Les types de listes peuvent être mélangés

### 2.5 Liens

Le Zolt propose une syntaxe riche pour les liens, avec attributs et références automatiques.

#### Liens Externes

```
[Zolt](https://zolt.marmotz.dev)
[Texte du lien](https://zolt.marmotz.dev/page)
```

#### Liens avec Attributs

```
[Lien externe](https://zolt.marmotz.dev){target=_blank rel=noopener}
[Google](https://google.com){target=_blank}
[Lien important](page.html){color=blue font-weight=bold}
```

#### Références Automatiques

Pour éviter de répéter les URLs longues :

```
[Zolt][zolt] est un langage de balisage. Consultez la [documentation][zolt].

[zolt]: https://zolt.marmotz.dev
```

#### Liens Internes (Références Croisées)

```
[Voir l'introduction](@intro)
[Retour au sommaire](@sommaire)
```

Le symbole `@` fait référence aux IDs des titres ou éléments.

#### Liens vers Ancres

```
Aller à la [section sur les listes](#listes).

[Retour en haut](@top)
```

#### Liens avec Variables

```
$site_web = "https://zolt.marmotz.dev"

Visitez [notre site]({$site_web}) pour plus d'informations.
```

---

### 2.6 Citations et Blockquotes

Les citations permettent de mettre en valeur du texte cité ou des blocs sémantiques.

#### Citation Simple

```
> Ceci est une citation.
> Elle peut s'étendre sur plusieurs lignes.
```

#### Citations avec Attributs

```
> Cette citation a un identifiant{#citation1}
> Cette citation est en rouge{color=red}
```

#### Citations Imbriquées

```
> Citation niveau 1
>
> > Citation niveau 2
> >
> > > Citation niveau 3
```

#### Blocs Sémantiques (Différence avec `:::`)

Les citations `>` sont pour les **textes cités**, tandis que les blocs `:::` sont pour les **conteneurs sémantiques** (
alertes, notes, etc.).

---

### 2.7 Indentation Technique

L'indentation permet de décaler du texte visuellement, distinctement des citations (qui utilisent `>`).

#### Indentation Simple

```
& Texte indenté (1 niveau)
& Autre ligne indentée
```

#### Indentation Multiple

```
& Indentation niveau 1
&& Indentation niveau 2
&&& Indentation niveau 3
```

#### Différence avec Citations

```
> Ceci est une citation (style "quote")
& Ceci est une indentation technique (style "code block")
```

| Syntaxe | Usage                 | Style visuel                    |
|---------|-----------------------|---------------------------------|
| `>`     | Citations, extraits   | Bordure gauche, fond gris clair |
| `&`     | Indentation technique | Décalage sans bordure           |

#### Cas d'Usage

- Extraits de code sans coloration
- Sorties de terminal
- Blocs techniques à présenter différemment du texte normal

---

### 2.8 Séparateurs Horizontaux

Les séparateurs permettent de diviser visuellement les sections.

#### Syntaxe de Base

```
---      # Séparateur standard
***      # Séparateur épais
___      # Séparateur fin
```

#### Séparateurs avec Attributs

```
--- {color=red style=dashed}
*** {color=blue}
___ {width=50% align=center}
```

| Attribut | Description                 |
|----------|-----------------------------|
| `color`  | Couleur du séparateur       |
| `style`  | `solid`, `dashed`, `dotted` |
| `width`  | Largeur (px, %, em)         |
| `align`  | `left`, `center`, `right`   |

#### Utilisation dans les Specs

Dans ce document, `---` est utilisé comme séparateur de sections principales. Vous pouvez également l'utiliser pour
marquer des transitions dans vos documents.

---

### 2.9 Inline Stylé

Pour appliquer des styles à des groupes de mots au sein d'une phrase, utilisez les doubles pipes `||`.

#### Syntaxe

```
||texte à styliser||{attributs}
```

#### Exemples

```
Ceci est ||un texte important||{color=red font-weight=bold} dans une phrase.

Vous pouvez ||surligner du texte||{background=yellow} ou le ||mettre en bleu||{color=blue}.
```

#### Différence avec Attributs Seuls

```
# Attribut sur un seul mot
Texte{color=blue} → applique à "Texte"

# Inline stylé pour groupes de mots
||plusieurs mots||{color=blue} → applique au groupe entier
```

#### Imbrication

```
||texte avec du ||gras|| à l'intérieur||{color=blue}
```

---

### 2.10 Échappement de Caractères

Pour afficher littéralement n'importe quel caractère spécial, utilisez l'antislash `\`.

#### Caractère d'Échappement

```
\[Texte entre crochets sans créer un lien\]
\{Texte entre accolades sans attributs\]
\|\|Texte sans marquage inline\|\|
\- Tiret sans créer une liste
1\. Point sans liste numérotée
```

#### Échapper l'Antislash

```
Voici un antislash: \\
```

#### Cas d'Usage Courants

```
Pour afficher du code: utilisez la fonction \`print()\`

Ceci n'est pas un \| lien\: [exemple](url)

Liste littérale: \- item 1, \- item 2
```

#### Règles

- L'antislash devant un caractère spécial le rend littéral
- L'antislash devant un caractère normal n'a aucun effet
- Pour afficher un backslash, doublez-le: `\\`

---

## 3. Blocs de Structure et Conteneurs

### 3.1 Les "Triple Colons" (Conteneurs Sémantiques)

Utilisés pour les alertes, les encadrés ou les sections spéciales.

#### Syntaxe

```
:::type [Titre optionnel] {attributs}
Contenu du bloc
:::
```

#### Types Natifs

| Type       | Usage                  |
|------------|------------------------|
| `info`     | Informations générales |
| `warning`  | Avertissements         |
| `error`    | Erreurs critiques      |
| `success`  | Confirmations          |
| `note`     | Notes et remarques     |
| `abstract` | Résumés                |

#### Exemples

```
:::info [Le saviez-vous ?] {background=soft-blue}
Ceci est une boîte d'information native.
Le rendu est géré par le thème, pas par du code injecté.
:::

:::warning [Danger Zone] {border=red}
Ceci est un avertissement critique.
:::
```

### 3.2 Les Tableaux de Grille (Grid Tables)

Les tableaux Zolt supportent la fusion de cellules et les en-têtes complexes, avec une syntaxe plus claire que les pipes
simples.

#### Syntaxe

```
[[table id=ventes-2026]]
| [h] Colonne 1 | [h] Colonne 2 | [h] Colonne 3 |
| :--- | :--- | :--- |
| Donnée 1 | Donnée 2 | Donnée 3 |
| [colspan=2] Cellule fusionnée | Donnée 4 |
| [rowspan=2] Cellule verticale | Donnée 5 |
| | Donnée 6 |
[[/table]]
```

#### Marqueurs Spéciaux

| Marqueur      | Description                         |
|---------------|-------------------------------------|
| `[h]`         | Cellule d'en-tête (header)          |
| `[colspan=N]` | Fusionne N cellules horizontalement |
| `[rowspan=N]` | Fusionne N cellules verticalement   |
| `:---`        | Alignement gauche                   |
| `:---:`       | Alignement center                   |
| `---:`        | Alignement droite                   |

#### Exemple Complet

```
[[table id=specs-tech]]
| [h] Composant | [h] Détails | [h] Performance |
| :--- | :--- | :--- |
| Moteurs | Brushless X-100 | 2500 KV |
| Batterie | LiPo 6S {color=green} | 5000 mAh |
| [rowspan=2] Capteurs | Optique | 4K @60fps |
| | LiDAR | Portée 50m |
| [colspan=2] **Poids Total** | **850g** |
[[/table]]
```

### 3.3 Accordéons (Details/Summary)

Les accordéons permettent de masquer/afficher du contenu à la demande de l'utilisateur.

#### Syntaxe

```
:::details [Titre cliquable]
Contenu masqué par défaut.
Peut contenir plusieurs paragraphes.
:::
```

#### Avec Attributs

```
:::details [Configuration avancée] {open=true}
Ce contenu est visible par défaut.
:::
```

#### Attributs Disponibles

| Attribut    | Description                 |
|-------------|-----------------------------|
| `open=true` | Accordéon ouvert par défaut |

#### Exemples

```
:::details [FAQ - Comment installer ?]
1. Téléchargez l'installateur
2. Exécutez le fichier .exe
3. Suivez les instructions à l'écran
:::

:::details [Voir le code source] {open=false}
\`\`\`python
def hello():
    print("Hello World")
\`\`\`

:::

```

### 3.4 Onglets

Les onglets permettent d'organiser du contenu en sections navigables.

#### Syntaxe

```

:::tabs
:::tab [JavaScript]
Code JavaScript ici...
:::

:::tab [Python]
Code Python ici...
:::

:::tab [Ruby]
Code Ruby ici...
:::
:::

```

#### Avec Attributs

```

:::tabs {default=Python}
:::tab [JavaScript]
console.log("Hello");
:::

:::tab [Python] {active=true}
print("Hello")
:::
:::

```

#### Attributs Disponibles

| Élément   | Attribut      | Description                   |
|-----------|---------------|-------------------------------|
| `:::tabs` | `default=Nom` | Onglet actif par défaut       |
| `:::tab`  | `active=true` | Marque cet onglet comme actif | 

#### Exemple Complet

```

:::tabs
:::tab [Installation]

\```

npm install zolt-parser

\```

:::

:::tab [Utilisation]

\```

const zolt = require('zolt-parser');
const html = zolt.parse('# Hello Zolt');

\```

:::

:::tab [Configuration]

\```

{
"theme": "dark",
"numbering": true
}

\```

:::
:::

```

### 3.5 Colonnes

Les colonnes permettent de disposer le contenu côte à côte.

#### Syntaxe

```

:::columns
:::column
Contenu de la première colonne.
:::

:::column
Contenu de la deuxième colonne.
:::
:::

```

#### Avec Largeurs Personnalisées

```

:::columns
:::column {width=70%}
Contenu principal (70% de la largeur).
:::

:::column {width=30%}
Barre latérale (30% de la largeur).
:::
:::

```

#### Attributs Disponibles

| Élément      | Attribut    | Description            |
|--------------|-------------|------------------------|
| `:::columns` | `cols=N`    | Nombre de colonnes     |
| `:::column`  | `width=N%`  | Largeur de la colonne  |
| `:::column`  | `width=Npx` | Largeur fixe en pixels |

#### Exemple à Trois Colonnes

```

:::columns {cols=3}
:::column
**Gauche**
Première colonne.
:::

:::column
**Centre**
Deuxième colonne.
:::

:::column
**Droite**
Troisième colonne.
:::
:::

```

#### Colonnes avec Images

```

:::columns
:::column
![Photo 1](photo1.jpg){width=100%}
Légende de la photo 1.
:::

:::column
![Photo 2](photo2.jpg){width=100%}
Légende de la photo 2.
:::
:::

```

---

## 4. Gestion des Médias (Préfixes Distincts)

Le Zolt utilise un système de préfixes pour que le parseur sache immédiatement quel lecteur charger.

### 4.1 Tableau des Préfixes

| Préfixe | Type    | Balise HTML générée | Usage                                     |
|---------|---------|---------------------|-------------------------------------------|
| `!`     | Image   | `<img>`             | Images statiques (jpg, png, gif, svg)     |
| `!!`    | Vidéo   | `<video>`           | Fichiers vidéo (mp4, webm, ogg)           |
| `??`    | Audio   | `<audio>`           | Fichiers audio (mp3, wav, ogg)            |
| `@@`    | Embed   | `<iframe>`          | Embeds externes (YouTube, Vimeo, Spotify) |
| `&&`    | Fichier | `<a>` avec icône    | Fichiers téléchargeables (pdf, doc, zip)  |

### 4.2 Syntaxe Générale

```

[prefixes][Texte alternatif](url_fichier){attributs}

```

### 4.3 Exemples

```

# Image

![Logo](image.png){width=200px float=right}

# Vidéo

!![Démo](video.mp4){autoplay loop muted}

# Audio

??[Podcast](audio.mp3)

# Embed YouTube

@@[Tuto](https://youtube.com/watch?v=xxx)

# Fichier PDF

&&[Manuel PDF](documentation.pdf)

```

---

## 5. Variables et Logique de Document

Le Zolt permet de centraliser des informations pour une maintenance facile et éviter la répétition.

### 5.1 Déclaration de Variables locales

Les variables se définissent généralement en haut de fichier.

```

$version = "2.4.1"
$client_name = "Acme Corp"
$statut = "En cours"
$numbering = true
$numbering_style = "decimal"

```

Elles ne sont locales qu'au fichier actuel et aux fichiers inclus via `{{include}}`.

### 5.2 Déclaration de Variables globales

Les variables globales utilisent le préfixe `$$` et sont disponibles dans tous les fichiers du projet lors du build.

```

$$site_name = "Mon Site Web"
$$company_name = "Acme Corp"
$$author = "Équipe Zolt"
$$year = 2026

```

#### Portée des Variables Globales

Les variables globales sont accessibles dans :

- Les fichiers inclus via `{{include}}`
- Les fichiers liés par des références croisées
- Tous les fichiers du projet lors de la génération

```

# Dans header.zlt

$$site_name = "Mon Site"

# Dans content.zlt (inclus ou lié)

# {$site_name} est disponible ici

```

#### Hiérarchie des Variables

| Préfixe | Portée  | Usage                            |
|---------|---------|----------------------------------|
| `$var`  | Locale  | Variable propre au fichier       |
| `$$var` | Globale | Variable partagée dans le projet |

#### Configuration Centrale

Il est recommandé de définir les variables globales dans un fichier de configuration central (ex: `config.zlt`) et de
l'inclure dans tous les fichiers.

```

# config.zlt

$$site_name = "Mon Site"
$$author = "Équipe Zolt"
$$version = "1.0.0"

# fichier1.zlt

{{include config.zlt}}

# {$site_name} = "Mon Site"

```

### 5.3 Utilisation des Variables

Les variables sont appelées avec la syntaxe `{$nom_variable}`.

```
Bienvenue chez {$client_name}, nous utilisons la version {$version}.

Statut actuel : **{$statut}** (v{$version}).
```

#### Opérateur Ternaire

Zolt supporte l'opérateur ternaire pour l'affichage conditionnel simple au sein des variables ou des expressions.

**Syntaxe :** `{$condition ? valeur_si_vrai : valeur_si_faux}` ou `{{ condition ? valeur_si_vrai : valeur_si_faux }}`

**Exemple :**

```
Featured: {$featured ? "Oui" : "Non"}
Statut: {{ $age >= 18 ? "Adulte" : "Mineur" }}
```

### 5.4 Calculs (Optionnel)

Le Zolt supporte les calculs avec des opérateurs mathématiques et des fonctions utilitaires organisées en namespaces.

#### Opérateurs de Base

```

{{ 10 + 5 }} # Addition : 15
{{ 20 - 8 }} # Soustraction : 12
{{ 3 * 4 }} # Multiplication : 12
{{ 15 / 3 }} # Division : 5
{{ 10 % 3 }} # Modulo : 1
{{ 2 ^ 10 }} # Puissance : 1024

```

#### Précédence des Opérateurs

Les opérateurs sont évalués dans cet ordre (du plus prioritaire au moins prioritaire) :

1. Parenthèses `()`
2. Puissance `^`
3. Multiplication `*`, Division `/`, Modulo `%`
4. Addition `+`, Soustraction `-`

```

{{ 3 + 2 * 5 }} # 13 (pas 25)
{{ (3 + 2) * 5 }} # 25
{{ 2 ^ 3 ^ 2 }} # 512 (associativité droite : 2^(3^2))

```

#### Avec Variables

```

{{ $prix * 1.2 }} # Calcul avec TVA
{{ $total + $taxe }}
{{ $quantite * $prix_unitaire }}

```

#### Namespace Math

Fonctions mathématiques utilitaires :

```

{{ Math.floor(3.7) }} # 3
{{ Math.ceil(3.2) }} # 4
{{ Math.round(3.5) }} # 4
{{ Math.abs(-5) }} # 5
{{ Math.min(10, 5) }} # 5
{{ Math.max(10, 5) }} # 10
{{ Math.pow(2, 8) }} # 256
{{ Math.sqrt(16) }} # 4

```

#### Namespace List

Fonctions pour manipuler les listes/tableaux :

```

{{ List.length($items) }} # Nombre d'éléments
{{ List.first($items) }} # Premier élément
{{ List.last($items) }} # Dernier élément
{{ List.sum($numbers) }} # Somme des éléments
{{ List.avg($numbers) }} # Moyenne
{{ List.count($items) }} # Nombre d'éléments (alias de length)

```

#### Namespace String

Fonctions de manipulation de chaînes :

```

{{ String.upper("hello") }} # "HELLO"
{{ String.lower("HELLO") }} # "hello"
{{ String.length("text") }} # 4
{{ String.trim("  text  ") }} # "text"
{{ String.replace("hello", "l", "r") }} # "herro"

```

#### Exemples Pratiques

```

# Prix avec TVA

Prix HT : {$prix_ht}€
Prix TTC : {{ $prix_ht * 1.2 }}€

# Statistiques

Moyenne des ventes : {{ List.avg($ventes) }}
Total : {{ List.sum($ventes) }}€

# Formatage

Code en majuscules : {{ String.upper($code) }}

```

### 5.5 Notes de Bas de Page

Les notes de bas de page permettent d'ajouter des références ou des explications sans alourdir le texte principal.

#### Syntaxe de Base

```

Ceci est un texte avec une note[^1].

[^1]: Contenu de la note de bas de page.

```

#### Notes Multiples

```

Premier paragraphe avec une note[^1].

Deuxième paragraphe avec une autre note[^2].

[^1]: Première note explicative.
[^2]: Deuxième note explicative.

```

#### Références Multiples

```

Ce concept[^concept] est important. Nous le reverrons plus tard[^concept].

[^concept]: Explication détaillée du concept.

```

#### Notes avec Attributs

```

Texte avec note importante[^important].

[^important]: Cette note est critique.{color=red}

```

#### Emplacement des Définitions

Les définitions de notes sont généralement placées en fin de document, mais peuvent apparaître n'importe où après leur
référence.

```

# Corps du document

Contenu avec notes[^1] et[^2].

# Notes

[^1]: Première note.
[^2]: Deuxième note.

```

### 5.6 Métadonnées de fichier

Les métadonnées de fichier permet de définir des métadonnées au début du fichier en utilisant la syntaxe YAML.

#### Syntaxe

```yaml
---
title: 'Titre du Document'
author: 'Jean Dupont'
date: 2026-02-18
version: 1.0
tags: [ zolt, markdown, documentation ]
description: 'Description courte du document'
---
```

#### Variables Automatiques

Les métadonnées de fichier sont accessibles comme des variables :

```
# {$title}

Auteur : {$author}
Date : {$date}
Version : v{$version}
```

#### Métadonnées Supportées

| Champ          | Type          | Description                         |
|----------------|---------------|-------------------------------------|
| `title`        | string        | Titre du document                   |
| `author`       | string        | Auteur                              |
| `date`         | date          | Date de création                    |
| `version`      | string/number | Version du document                 |
| `tags`         | array         | Liste de tags                       |
| `description`  | string        | Description courte                  |
| `keywords`     | array/string  | Mots-clés pour le SEO               |
| `robots`       | string        | Instructions robots (ex: "noindex") |
| `image`        | string        | Image de partage (Open Graph)       |
| `lang`         | string        | Code langue (fr, en, etc.)          |
| `toc`          | boolean       | Afficher la TOC automatiquement     |
| `theme`        | string        | Thème de rendu (voir ci-dessous)    |
| `color-scheme` | string        | `auto`, `light`, `dark`             |

#### Thèmes Disponibles

Zolt propose plusieurs thèmes intégrés qui s'adaptent automatiquement aux préférences de l'utilisateur (Light/Dark
mode) :

- **`default`** (par défaut) : Moderne, propre et équilibré.
- **`professional`** : Typographie serif pour les titres, couleurs sobres, idéal pour les rapports.
- **`technical`** : Inspiré des documentations techniques, polices monospace, contrastes élevés.
- **`playful`** : Bordures arrondies, couleurs vives, typographie plus informelle.

#### Schéma de Couleur (Light/Dark Mode)

La métadonnée `color-scheme` permet de contrôler l'apparence du document :

- **`auto`** (par défaut) : Utilise la préférence système de l'utilisateur.
- **`light`** : Force le mode clair.
- **`dark`** : Force le mode sombre.

```yaml
---
title: "Mon Rapport Dark"
theme: "professional"
color-scheme: "dark"
---
```

#### Exemple Complet

```yaml
---
title: "Guide Zolt Complet"
author: "Équipe Zolt"
date: 2026-02-18
version: 2.0
tags: [ documentation, tutorial, zolt ]
toc: true
theme: "professional"
---

# {$title}

  **Auteur :** {$author}
  **Date :** {$date}
  **Version :** v{$version}

Tags: { { String.join($tags, ", ") } }
```

### 5.7 Dates Automatiques

Le Zolt fournit des variables automatiques pour les dates de fichier.

#### Variables Disponibles

```
{$created}      # Date de création du fichier (timestamp ISO 8601)
{$modified}     # Date de dernière modification (timestamp ISO 8601)
```

Les variables `{$created}` et `{$modified}` retournent des timestamps au format ISO 8601 (ex:
`2026-02-23T14:30:45.123Z`).

#### Namespace Date

Le Zolt fournit un namespace `Date` pour formater les dates, similaire aux namespaces `Math`, `String` et `List`.

```
{{ Date.format($created, "DD/MM/YYYY") }}        # 23/02/2026
{{ Date.format($modified, "YYYY-MM-DD HH:mm") }} # 2026-02-23 14:30
```

#### Fonctions Disponibles

| Fonction                    | Description                    | Exemple                                      |
|-----------------------------|--------------------------------|----------------------------------------------|
| `Date.format(date, format)` | Formate une date               | `Date.format($created, "DD/MM/YYYY")`        |
| `Date.parse(text, format)`  | Parse une chaîne en objet Date | `Date.parse("25/02/2026", "DD/MM/YYYY")`     |
| `Date.calc(date, duration)` | Calcule une date (objet dur.)  | `Date.calc($created, { days: 7, hours: 2 })` |
| `Date.diff(d1, d2, unit)`   | Différence entre deux dates    | `Date.diff($end, $start, "days")`            |

| `Date.now()`                | Timestamp actuel (ms)                   |
`Date.now()`                                            |
| `Date.timestamp(date)`      | Timestamp en secondes | `Date.timestamp($created)`                              |
| `Date.msTimestamp(date) `   | Timestamp en millisecondes | `Date.msTimestamp($created)`                            |

#### Unités pour Date.calc et Date.diff

La fonction `calc` accepte un objet de durée avec les clés suivantes :
`years`, `months`, `weeks`, `days`, `hours`, `minutes`, `seconds`.
Elle supporte également les valeurs négatives pour les soustractions.

La fonction `diff` accepte l'unité en troisième argument.

```
{{ Date.calc($created, { months: 1, days: 5 }) }}
{{ Date.calc($modified, { hours: -2 }) }}
{{ Date.diff($modified, $created, "hours") }}
```

#### Format Tokens

| Token  | Description         | Exemple  |
|--------|---------------------|----------|
| `DD`   | Jour (2 chiffres)   | 14       |
| `D`    | Jour (1-2 chiffres) | 2, 14    |
| `dddd` | Jour (minuscules)   | mercredi |
| `DDDD` | Jour (MAJUSCULES)   | MERCREDI |
| `Dddd` | Jour (Capitalisé)   | Mercredi |
| `ddd`  | Jour abr. (min.)    | mer.     |
| `DDD`  | Jour abr. (MAJ.)    | MER.     |
| `Ddd`  | Jour abr. (Cap.)    | Mer.     |
| `MM`   | Mois (2 chiffres)   | 02       |
| `M`    | Mois (1-2 chiffres) | 2        |
| `mmmm` | Mois (minuscules)   | février  |
| `MMMM` | Mois (MAJUSCULES)   | FÉVRIER  |
| `Mmmm` | Mois (Capitalisé)   | Février  |
| `mmm`  | Mois abr. (min.)    | févr.    |
| `MMM`  | Mois abr. (MAJ.)    | FÉVR.    |
| `Mmm`  | Mois abr. (Cap.)    | Févr.    |
| `YYYY` | Année (4 chiffres)  | 2026     |
| `YY`   | Année (2 chiffres)  | 26       |
| `HH`   | Heure (24h, 00-23)  | 02, 14   |
| `H`    | Heure (24h, 0-23)   | 2, 14    |
| `hh`   | Heure (12h, 01-12)  | 02       |
| `h`    | Heure (12h, 1-12)   | 2        |
| `a`    | am/pm (minuscule)   | am       |
| `A`    | AM/PM (majuscule)   | AM       |
| `mm`   | Minutes (00-59)     | 05, 30   |
| `m`    | Minutes (0-59)      | 5        |
| `ss`   | Secondes (00-59)    | 07, 30   |
| `s`    | Secondes (0-59)     | 7        |

#### Localisation

Le formatage des noms de jours (`dddd`, `ddd`) et de mois (`MMMM`, `MMM`) dépend de la locale définie dans les variables
`$lang` (souvent via le file metadata). Si aucune n'est définie, la locale du système est utilisée.

Exemple en file metadata :

```yaml
---
lang: fr-FR
---
```

#### Exemples d'Utilisation

```
# Dates brutes (format ISO 8601)
Créé le : {$created}
Modifié le : {$modified}

# Dates formatées
Date de création : {{ Date.format($created, "DD/MM/YYYY") }}
Dernière modification : {{ Date.format($modified, "DD MMMM YYYY à HH:mm") }}

# Format ISO
Publié le : {{ Date.format($created, "YYYY-MM-DD") }}

# Format américain
Date : {{ Date.format($created, "MM/DD/YYYY") }}

# Manipulation de dates
Échéance (dans 7 jours) : {{ Date.format(Date.calc($created, { days: 7 }), "DD/MM/YYYY") }}
Âge du document : {{ Date.diff(Date.now(), $created, "days") }} jours
```

#### Combinaison avec d'autres Fonctions

```
# Dans une expression
Année de création : {{ String.upper(Date.format($created, "YYYY")) }}

# Formatage conditionnel
:::if {{ $modified > $created }}
Dernière mise à jour : {{ Date.format($modified, "DD/MM/YYYY HH:mm") }}
:::
```

### 5.8 Abbréviations

Les abbréviations permettent de définir des explications pour des termes techniques.

#### Syntaxe Inline

```
HTML{abbr="HyperText Markup Language"} est le langage de base du web.
CSS{abbr="Cascading Style Sheets"} gère la présentation.
```

#### Rendu HTML

```html
<abbr title="HyperText Markup Language">HTML</abbr> est le langage de base du web.
```

#### Définitions Locales

Les abbréviations locales (document courant uniquement) utilisent `*[ABBR]` :

```
*[HTML]: HyperText Markup Language
*[CSS]: Cascading Style Sheets
*[JS]: JavaScript

HTML et CSS sont essentiels. L'API est puissante.
```

Les définitions locales ne sont appliquées qu'au document courant et ne sont pas partagées avec les autres documents
liés ou inclus.

#### Définitions Globales

Les abbréviations globales (partagées entre tous les documents) utilisent `**[ABBR]` :

```
**[HTML]: HyperText Markup Language
**[CSS]: Cascading Style Sheets
**[JS]: JavaScript
```

Les définitions globales sont disponibles dans :

- Tous les documents du projet lors du build
- Les fichiers inclus via `{{include}}`
- Les fichiers liés par des références croisées

C'est similaire au système des variables :

- `*[ABBR]` équivaut à `$var` (local au document)
- `**[ABBR]` équivaut à `$$var` (global au projet)

#### Portée des Abréviations

| Syntaxe      | Portée            | Usage                                 |
|--------------|-------------------|---------------------------------------|
| `*[ABBR]`    | Document courant  | Définitions spécifiques au fichier    |
| `**[ABBR]`   | Globale au projet | Définitions communes à tout le projet |
| `ABBR{abbr}` | Inline (une fois) | Définition à usage unique             |

#### Avec Attributs Supplémentaires

```
HTML{abbr="HyperText Markup Language" class=tech-term}
```

### 5.9 Table des Matières (TOC)

La table des matières peut être générée automatiquement et insérée n'importe où dans le document.

#### Syntaxe de Base

```
[[toc]]
```

#### Avec Attributs

```
[[toc {depth=3}]]
[[toc {from=2 to=4}]]
[[toc {numbered=true}]]
```

#### Attributs Disponibles

| Attribut        | Description               | Défaut |
|-----------------|---------------------------|--------|
| `depth=N`       | Profondeur maximale (1-6) | 3      |
| `from=N`        | Niveau de départ (1-6)    | 1      |
| `to=N`          | Niveau de fin (1-6)       | 6      |
| `numbered=true` | Inclure la numérotation   | false  |
| `class=...`     | Classe CSS                | -      |

#### Exemples

```
# Table des Matières

[[toc {depth=2 numbered=true}]]

# Chapitre 1
## Section 1.1
## Section 1.2
### Sous-section  (non incluse, depth=2)

# Chapitre 2
```

#### TOC Partielle

```
# Sections Avancées

[[toc {from=3 to=5}]]

## Introduction
### Contexte      # Incluse (niveau 3)
#### Détails      # Incluse (niveau 4)
### Problématique # Incluse (niveau 3)
```

### 5.10 Boucles

Les boucles permettent d'itérer sur des tableaux de données pour générer du contenu dynamique.

#### Syntaxe de Base

```
:::foreach {$items as $item}
Contenu pour chaque élément : {$item.name}
:::
```

#### Variables de Boucle

Des variables automatiques sont disponibles dans chaque itération :

| Variable            | Description                 |
|---------------------|-----------------------------|
| `{$foreach.index}`  | Index actuel (commence à 0) |
| `{$foreach.index1}` | Index actuel (commence à 1) |
| `{$foreach.first}`  | `true` si premier élément   |
| `{$foreach.last}`   | `true` si dernier élément   |
| `{$foreach.even}`   | `true` si index pair        |
| `{$foreach.odd}`    | `true` si index impair      |

#### Exemple Complet

```
$products = [
  {name: "Laptop", price: 999},
  {name: "Mouse", price: 29},
  {name: "Keyboard", price: 79}
]

# Liste des Produits

:::foreach {$products as $product}
{$foreach.index1}. **{$product.name}** - {$product.price}€
:::if {$foreach.first}
   *Meilleure vente !*
:::
:::
:::
```

#### Imbrication de Boucles

```
$categories = [
  {id: "tech", name: "Technologie"},
  {id: "home", name: "Maison"}
]

$products = {
  tech: [
    {name: "Laptop", price: 999},
    {name: "Tablet", price: 599}
  ],
  home: [
    {name: "Lamp", price: 49},
    {name: "Chair", price: 149}
  ]
}

:::foreach {$categories as $category}
## {$category.name}

:::foreach {$products[$category.id] as $product}
- {$product.name} : {$product.price}€
:::
:::
```

#### Boucle avec Condition

```
:::foreach {$products as $product}
:::if {$product.price > 100}
- **{$product.name}** : {$product.price}€ (Premium)
:::
:::
```

#### Style Alterné

```
:::foreach {$products as $product}
:::if {$foreach.even}
- {$product.name} {.row-even}
:::
:::if {$foreach.odd}
- {$product.name} {.row-odd}
:::
:::
```

### 5.11 Inclusion de Fichiers

L'inclusion de fichiers permet de réutiliser du contenu commun à plusieurs documents, comme des en-têtes, pieds de page,
ou sections récurrentes.

#### Syntaxe

```
{{include chemin/vers/fichier.zlt}}
```

Le contenu du fichier spécifié est inséré à l'emplacement de la directive `{{include}}`.

#### Exemples

```
# Structure d'une page web

{{include header.zlt}}
{{include navigation.zlt}}

# Contenu principal

Bienvenue sur notre site !

{{include footer.zlt}}
```

#### Chemin Relatif

Les inclusions utilisent des chemins relatifs au fichier courant :

```
# Dans /docs/guide.zlt
{{include ../shared/header.zlt}}    # Remonte d'un niveau
{{include ./sections/intro.zlt}}    # Sous-dossier local
{{include footer.zlt}}              # Même dossier
```

#### Récursion et Profondeur

- Les fichiers inclus peuvent eux-mêmes inclure d'autres fichiers
- Une protection contre la récursion infinie est appliquée (profondeur maximale de 10 niveaux)
- Une erreur est levée si une boucle d'inclusion est détectée

```
# header.zlt peut inclure navigation.zlt
{{include navigation.zlt}}

# navigation.zlt ne devrait pas ré-inclure header.zlt (éviter la boucle)
```

#### Variables dans les Fichiers Inclus

Les variables définies dans le fichier parent sont accessibles dans les fichiers inclus :

```
# parent.zlt
$site_name = "Mon Site"
{{include header.zlt}}
```

```
# header.zlt
# {$site_name} est accessible ici
# Bienvenue sur {$site_name}
```

#### Cas d'Usage Recommandés

| Usage                  | Exemple                     |
|------------------------|-----------------------------|
| En-tête commun         | `{{include header.zlt}}`    |
| Pied de page           | `{{include footer.zlt}}`    |
| Navigation             | `{{include nav.zlt}}`       |
| Sections réutilisables | `{{include changelog.zlt}}` |
| Templates de page      | Structure commune aux pages |

#### Erreurs Possibles

- **Fichier non trouvé** : Le chemin spécifié n'existe pas
- **Boucle d'inclusion** : Détection de récursion circulaire
- **Profondeur maximale dépassée** : Trop de niveaux d'inclusion imbriqués
- **Permission refusée** : Accès au fichier impossible

---

## 6. Blocs de Code et Fonctions Spéciales

### 6.1 Blocs de Code Avancés

Les blocs de code supportent des attributs pour la mise en évidence et le titrage.

#### Syntaxe

```language {attributs}
code ici
```

#### Attributs Disponibles

| Attribut        | Description                | Exemple           |
|-----------------|----------------------------|-------------------|
| `title="..."`   | Titre du bloc              | `title="main.py"` |
| `highlight=N-M` | Surlignage de lignes       | `highlight=2-4`   |
| `start=N`       | Numérotation starting line | `start=10`        |

#### Exemple

```python {highlight=2-4 title="main.py"}
def hello():
    print("Hello World") # Ligne surlignée
    return True
```

### 6.2 Mathématiques (LaTeX natif)

Le Zolt intègre une version légère de LaTeX pour les formules mathématiques.

#### Inline

```
La formule est : $ E = mc^2 $
```

#### Bloc

```
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

### 6.3 Diagrammes et Graphiques

#### Mermaid

```
:::mermaid
graph TD
    A[Début] --> B[Processus]
    B --> C[Fin]
:::
```

#### Chart (Graphiques natifs)

Les graphiques utilisent un conteneur principal avec des sous-graphiques individuels.

```
:::chart
:::chart-line {color-scheme=cool}
Janvier: 20
Février: 45
Mars: 80
Avril: 100
:::

:::chart-bar {color-scheme=warm}
Produit A: 150
Produit B: 200
Produit C: 175
:::
:::
```

#### Types de Graphiques Disponibles

| Type            | Description          | Données requises        |
|-----------------|----------------------|-------------------------|
| `:::chart-line` | Graphique linéaire   | Série temporelle        |
| `:::chart-bar`  | Graphique à barres   | Catégories + valeurs    |
| `:::chart-pie`  | Graphique circulaire | Parts + pourcentages    |
| `:::chart-area` | Graphique en aires   | Série avec aire remplie |

#### Attributs du Conteneur

```
:::chart {width=100% height=400px}
:::chart-line {title="Ventes 2026"}
Jan: 100
Feb: 120
:::
:::
```

| Attribut | Description                                      |
|----------|--------------------------------------------------|
| `width`  | Largeur du conteneur                             |
| `height` | Hauteur du conteneur                             |
| `layout` | `horizontal` ou `vertical` pour multi-graphiques |

#### Attributs des Sous-Graphiques

```
:::chart-line {color-scheme=cool title="Évolution" legend=true}
```

| Attribut       | Description         |
|----------------|---------------------|
| `title`        | Titre du graphique  |
| `color-scheme` | Palette de couleurs |
| `legend`       | Afficher la légende |
| `grid`         | Afficher la grille  |

#### Multi-Graphiques

```
:::chart {layout=horizontal}
:::chart-pie {title="Répartition"}
Alpha: 30%
Beta: 45%
Gamma: 25%
:::

:::chart-bar {title="Comparaison"}
2024: 1200
2025: 1450
2026: 1680
:::
:::
```

#### Exemple Complet

```
# Rapport de Ventes

:::chart
:::chart-line {title="Évolution mensuelle" color-scheme=blue grid=true}
Janvier: 20000
Février: 25000
Mars: 23000
Avril: 28000
Mai: 32000
:::

:::chart-bar {title="Par catégorie" color-scheme=warm}
Électronique: 45000
Vêtements: 32000
Alimentation: 28000
Autres: 15000
:::

:::chart-pie {title="Répartition canal" color-scheme=pastel}
En ligne: 45%
Magasin: 35%
Distributeurs: 20%
:::
:::
```

---

## 7. Architecture Technique (Pour le Développeur)

Zolt utilise une architecture en trois couches distinctes : **Lexer** (analyse lexicale), **Parser** (analyse
syntaxique), et **Builder** (génération de sortie). Cette séparation garantit un code maintenable et extensible.

### 7.1 Flux de Traitement

```
Fichier Zolt → Lexer → Tokens → Parser → AST → Builder → Sortie (HTML/PDF)
```

### 7.2 Couche 1 : Lexer (Analyse Lexicale)

Le Lexer transforme le texte brut en stream de Tokens. Il ne comprend pas la structure du langage, il ne fait que
reconnaître les motifs syntaxiques.

**Responsabilités :**

- Produire des Tokens avec position (ligne, colonne)
- Gérer les états du lexer (BLOCK, INLINE, CODE, FILE_METADATA)
- Détecter les motifs syntaxiques (headings, listes, blocs de code, etc.)

**Types de Tokens produits :**

- Tokens structuraux : NEWLINE, INDENT, DEDENT, EOF
- Tokens de headings : HEADING (contient le niveau et le contenu)
- Tokens de listes : BULLET_LIST, ORDERED_LIST, TASK_LIST, DEFINITION
- Tokens de blocs : BLOCKQUOTE, CODE_BLOCK, HORIZONTAL_RULE, FILE_METADATA
- Tokens spéciaux : TRIPLE_COLON_START, TRIPLE_COLON_END, DOUBLE_BRACKET_START, DOUBLE_BRACKET_END
- Tokens inline : TEXT, BOLD, ITALIC, UNDERLINE, STRIKETHROUGH, CODE, etc.
- Tokens médias : IMAGE, VIDEO, AUDIO, EMBED, FILE
- Tokens de variables : VARIABLE, GLOBAL_VARIABLE, EXPRESSION, INCLUDE
- Tokens spéciaux : ESCAPE, COMMENT_INLINE, ABBREVIATION, ANCHOR, FOOTNOTE_DEF

### 7.3 Couche 2 : Parser (Analyse Syntaxique)

Le Parser consume le stream de Tokens et produit un AST (Abstract Syntax Tree). Il utilise une approche récursive
descendante (Recursive Descent Parser).

**Responsabilités :**

- Construire l'AST avec des nœuds correctement imbriqués
- Gérer l'imbrication des blocs (listes, blockquotes, etc.)
- Valider la structure et produire des erreurs explicites avec ligne/colonne

**Types de Nœuds AST :**

- Nœuds de document : DocumentNode (racine)
- Nœuds de blocs : HeadingNode, ParagraphNode, BlockquoteNode, ListNode, ListItemNode, CodeBlockNode,
  TripleColonBlockNode, DoubleBracketBlockNode, HorizontalRuleNode, IndentationNode
- Nœuds inline : BoldNode, ItalicNode, UnderlineNode, StrikethroughNode, CodeNode, SuperscriptNode, SubscriptNode,
  HighlightNode, InlineStyleNode
- Nœuds médias : LinkNode, ImageNode, VideoNode, AudioNode, EmbedNode, FileNode
- Nœuds spéciaux : VariableNode, ExpressionNode, IncludeNode, ForeachNode, IfNode, FootnoteNode, FootnoteDefinitionNode,
  AbbreviationNode, FileMetadataNode

### 7.4 Couche 3 : Builder (Génération de Sortie)

Le Builder transforme l'AST en format de sortie (HTML, PDF, etc.). Il utilise le pattern Visitor.

**Responsabilités :**

- Transformer chaque type de nœud en sortie correspondante
- Parcourir récursivement les nœuds enfants
- Être spécifique au format de sortie (HTMLBuilder → HTML string)

### 7.5 Règles Architecturales

1. **Séparation des préoccupations** : Le Lexer ne connaît pas l'AST, le Parser ne connaît pas HTML/PDF, le Builder ne
   fait pas de parsing
2. **Erreurs résilientes** : En cas d'erreur syntaxique, le parseur doit continuer et émettre un avertissement
3. **Informations de position** : Chaque Token et Nœud doit inclure ligne et colonne pour les messages d'erreur
4. **Extensibilité** : Ajouter un nouveau format de sortie = ajouter un nouveau Builder

---

## 8. Comparaison avec Markdown Classique

### 8.1 Compatibilité des Paragraphes

Zolt respecte les conventions standards de Markdown pour le formatage des paragraphes :

- **Sauts de ligne simples** : Les lignes séparées par un seul saut de ligne sont jointes en un seul paragraphe

```
  Ligne 1
  Ligne 2
  → <p>Ligne 1 Ligne 2</p>
```

- **Sauts de ligne multiples** : Les lignes vides séparent les paragraphes

```
  Paragraphe 1

  Paragraphe 2
  → <p>Paragraphe 1</p><p>Paragraphe 2</p>
```

Cette compatibilité garantit que les fichiers `.md` existants fonctionnent correctement dans Zolt.

### 8.2 Tableau Comparatif des Fonctionnalités

| Fonctionnalité           | Markdown Classique   | Zolt                                   |
|--------------------------|----------------------|----------------------------------------| 
| **Couleur texte**        | `<span style="...">` | `Texte{color=red}`                     |
| **Gras**                 | `**texte**`          | `**texte**` (identique)                |
| **Italique**             | `*texte*`            | `//texte//` (évite conflits listes)    |
| **Souligné**             | `<u>...</u>`         | `__texte__` (natif)                    |
| **Exposant**             | `<sup>...</sup>`     | `^{texte}` (natif, imbrication)        |
| **Indice**               | `<sub>...</sub>`     | `_{texte}` (natif, imbrication)        |
| **Surligné**             | `<mark>...</mark>`   | `==texte==` (natif)                    |
| **Taille image**         | Non supporté         | `![..](..){w=100}`                     |
| **Alignement image**     | HTML requis          | `![..](..){align=right}`               |
| **Alertes/Callouts**     | `> [!NOTE]` (hack)   | `:::note` (natif)                      |
| **Ancre ID**             | HTML manuel          | `## Titre{#id}` (natif)                |
| **Tableaux avancés**     | Limité               | `[[table]]` avec colspan/rowspan       |
| **Vidéo**                | HTML requis          | `!![alt](url)` (natif)                 |
| **Audio**                | HTML requis          | `??[alt](url)` (natif)                 |
| **Embed**                | HTML requis          | `@@[alt](url)` (natif)                 |
| **Variables**            | Non supporté         | `$var = "val"` + `{$var}`              |
| **Calculs**              | Non supporté         | `{{ 10 + 5 }}`                         |
| **Mathématiques**        | Extension requise    | `$...$` (natif)                        |
| **Diagrammes**           | Extension requise    | `:::mermaid` (natif)                   |
| **Graphiques**           | Non supporté         | `:::chart` (natif)                     |
| **Numérotation titres**  | Non supporté         | `$numbering=true` + `{numbered}`       |
| **Commentaires**         | `<!-- -->`           | `:::comment` et `%% %%` (natif)        |
| **Listes de définition** | Non supporté         | `: terme` / `: définition`             |
| **Liens avancés**        | Basique              | `[text](url){target=_blank}`           |
| **Références liens**     | Non supporté         | `[text][ref]` + `[ref]: url`           |
| **Citations stylées**    | Basique              | `> texte{color=red}`                   |
| **Indentation tech**     | Non supporté         | `& texte` (vs `>` citation)            |
| **Séparateurs stylés**   | Limité               | `--- {color=red style=dashed}`         |
| **Inline stylé**         | Non supporté         | `**texte**{attr}`                      |
| **Notes de bas de page** | Extension            | `[^1]` natif + définitions             |
| **File metadata**        | Non supporté         | YAML natif avec variables auto         |
| **Dates auto**           | Non supporté         | `{$created}`, `{$modified}`            |
| **Abréviations**         | Non supporté         | `{abbr="..."}`                         |
| **TOC dynamique**        | Extension            | `[[toc {from=2 to=4}]]`                |
| **Calculs avancés**      | Non supporté         | `Math.*`, `List.*`, `String.*`         |
| **Boucles**              | Non supporté         | `:::foreach` avec `$foreach.*`         |
| **Accordéons**           | Non supporté         | `:::details [Titre]`                   |
| **Onglets**              | Non supporté         | `:::tabs` / `:::tab`                   |
| **Colonnes**             | Non supporté         | `:::columns` / `:::column`             |
| **Échappement**          | Backslash limité     | `\` universel pour tous les opérateurs |

---

## 9. Cas d'Usage Recommandés

### 9.1 Documentation Technique

- Variables pour versions et numéros de build
- Blocs de code avec numérotation et surlignage
- Tableaux avec colspan pour spécifications
- Alertes pour warnings et notes importantes

### 9.2 Rapports Professionnels

- Mise en forme typographique avancée (exposants, indices)
- Numérotation automatique des titres
- Graphiques intégrés
- Styles cohérents via attributs
- Références croisées

### 9.3 Présentations et Ebooks

- Structure sémantique claire
- Médias riches (vidéo, audio)
- Navigation par ancres
- Mise en page précise

### 9.4 Notes de Cours

- Formules mathématiques natives
- Diagrammes et schémas
- Coloration syntaxique du code
- Alertes pour points importants

---

## 10. Bonnes Pratiques

### 10.1 Structure de Document

1. Commencer par les variables globales
2. Utiliser des titres avec des ID pour les références
3. Grouper le contenu dans des blocs sémantiques
4. Terminer par les références et annexes

### 10.2 Attributs

- Toujours placer les attributs juste après l'élément, sans espace
- Préférer les classes CSS `.ma-classe` aux styles inline `color=red`
- Utiliser des ID descriptifs `#intro` plutôt que `#section1`

### 10.3 Numérotation des Titres

- Activer la numérotation globalement avec `$numbering = true` pour les documents structurés
- Utiliser des styles cohérents : `decimal` pour les rapports techniques, `roman-upper` pour les préfaces
- Désactiver la numérotation pour les annexes et bibliographies avec `{numbered=false}`
- Éviter de mélanger les styles de numérotation dans un même document

### 10.4 Accessibilité

- Toujours fournir un texte alternatif pour les médias
- Utiliser les types de blocs appropriés (`:::warning` vs `:::info`)
- Structurer les tableaux avec des en-têtes `[h]`

### 10.5 Performance

- Limiter l'utilisation des attributs inline
- Préférer les classes CSS réutilisables
- Optimiser les poids des images et vidéos

### 10.6 Commentaires

- Utiliser `:::comment` pour les notes de rédaction longues et la documentation interne
- Utiliser `%% commentaire %%` pour les TODO et notes rapides inline
- Les commentaires ne sont pas destinés à être publiés dans le rendu final
- Nettoyer régulièrement les TODO obsolètes avant publication

### 10.7 Listes

- Maintenir une cohérence de style dans un même document
- Utiliser 2 espaces ou 1 tabulation pour l'imbrication (pas de mélange)
- Préférer les listes de définition `:terme` aux listes à puces pour les glossaires
- Utiliser les attributs sur les items pour mettre en valeur des éléments importants

### 10.8 Liens

- Préférer les références automatiques `[texte][ref]` pour les URLs répétées
- Toujours spécifier `target=_blank` et `rel=noopener` pour les liens externes
- Utiliser des textes de lien explicites, éviter "cliquez ici"
- Vérifier les liens internes avec les IDs avant publication

### 10.9 Échappement

- Toujours échapper les caractères spéciaux dans le code et les exemples
- Vérifier le rendu des backslashes doublés `\\`
- Utiliser l'échappement plutôt que les blocs de code pour les exemples courts

### 10.10 Boucles et Logique

- Utiliser des noms de variables explicites (`{$product_name}` plutôt que `{$p}`)
- Commenter les boucles complexes imbriquées
- Vérifier les tableaux de données avant les boucles pour éviter les erreurs
- Utiliser `$foreach.first` et `$foreach.last` pour un rendu conditionnel

---

## 11. Migration depuis Markdown

### 11.1 Changements Majeurs

1. **Italique :** `*texte*` → `//texte//`
2. **Attributs :** Ajouter `{}` après les éléments
3. **Tableaux :** Envelopper avec `[[table]]` et `[[/table]]`
4. **Alertes :** Remplacer `> [!NOTE]` par `:::note`
5. **Commentaires :** `<!-- -->` reste compatible, mais `:::comment` et `%% %%` recommandés

### 11.2 Compatibilité

Le Zolt est **rétrocompatible** avec le Markdown standard. Les fichiers `.md` existants seront parsés correctement, mais
n'utiliseront pas les nouvelles fonctionnalités.

### 11.3 Extension de Fichier

- `.md` : Markdown classique (parsé en mode compatibilité)
- `.zlt` : Zolt (toutes les fonctionnalités activées)

---

## 12. Exemples Complets

### 12.1 Fiche Produit

```
$produit = "Nebula Drone X1"
$prix = "1299€"

:::comment
TODO: Ajouter les photos de haute résolution
Note: Vérifier les spécifications techniques avec l'équipe R&D
:::

# {$produit} {#top}

:::info [Fiche Technique] {background=blue}
Le {$produit} est un drone de course professionnel vendu au prix de **{$prix}**.
:::

## Spécifications

[[table id=specs]]
| [h] Caractéristique | [h] Valeur |
| :--- | :--- |
| [rowspan=2] Moteurs | Brushless 2500KV %% TODO: vérifier KV exact %% |
| | 4 unités |
| Batterie | LiPo 6S 5000mAh |
| Poids | 850g |
[[/table]]

## Médias

![Vue du dessus](photo.jpg){w=600 align=center}

!![Vol de démonstration](demo.mp4){loop}

:::warning [Attention]
Ce drone n'est pas recommandé pour les débutants.
:::
```

### 12.2 Rapport Scientifique

```
# Analyse Thermique {#thermique}

## Équations

La chaleur spécifique est définie par :

$$
Q = mc\Delta T
$$

Où :
- $Q$ est la chaleur{color=blue}
- $m$ est la masse
- $c$ est la chaleur spécifique^{1}
- $\Delta T$ est la variation de température

## Résultats

:::chart [type=bar]
Essai 1: 25
Essai 2: 30
Essai 3: 28
:::

:::note [Conclusion]
Les résultats sont cohérents avec la théorie.
:::
```

### 12.3 Document Complet avec Toutes les Fonctionnalités

````yaml
---
title: "Guide Complet Zolt"
author: "Marie Dupont"
date: { $created }
version: 2.0
tags: [ documentation, tutorial, zolt ]
toc: true
numbering: true
---

# {$title}

  **Auteur :** {$author} | **Version :** v{$version}

---

## Table des Matières

[ [ toc { depth=2 numbered=true } ] ]

---

## 1. Introduction

  Bienvenue dans ce guide complet sur ||Zolt||{color=blue font-weight=bold}, le langage de balisage moderne.

  :::details [Pourquoi Zolt ?]
  Zolt combine la simplicité de Markdown avec la puissance des langages de balisage modernes.
:::

---

## 2. Listes et Structure

### Types de Listes

- Liste à puces standard
- Avec imbrication
  - Sous-niveau 1
  - Sous-niveau 2

  1. Liste numérotée
  2. Deuxième item
  1. Sous-numérotation
  2. Autre sous-item

- [ ] Tâche à faire
- [ x ] Tâche complétue
- [ ] Tâche importante{color=red}

  : HTML
  : HyperText Markup Language

  : CSS
  : Cascading Style Sheets

---

## 3. Blocs Interactifs

:::tabs
:::tab [Documentation]
```zolt
$variable = "valeur"
# Titre
````

:::

:::tab [Exemple]
Contenu texte de l'exemple avec du **gras** et de l'//italique//.
:::
:::

---

## 4. Données et Boucles

$team = [
{name: "Alice", role: "Développeuse", level: "Senior"},
{name: "Bob", role: "Designer", level: "Junior"},
{name: "Charlie", role: "Chef de projet", level: "Senior"}
]

### Équipe

:::foreach {$team as $member}
:::if {$member.level == "Senior"}

- **{$member.name}** — {$member.role} {.senior-badge}
  :::
  :::if {$member.level == "Junior"}
- {$member.name} — {$member.role}
  :::
  :::

---

## 5. Colonnes

:::columns
:::column {width=60%}
**Contenu Principal**

Texte principal avec explications détaillées...

- Point 1
- Point 2
- Point 3

> Une citation pour illustrer un point important.
> :::

:::column {width=40%}
**Barre Latérale**

Informations complémentaires :

:::info [Note]
Ceci est une information importante à retenir.
:::

& Code sans coloration syntaxique
& pour les sorties de terminal
:::
:::
:::

---

## 6. Graphiques

:::chart
:::chart-line {title="Progression mensuelle"}
Jan: 20
Feb: 35
Mar: 50
Apr: 75
:::

:::chart-bar {title="Répartition par catégorie"}
A: 45
B: 30
C: 25
:::
:::

---

## 7. Calculs et Statistiques

$ventes = [120, 145, 160, 180, 195, 210]

### Statistiques

- **Total** : {{ List.sum($ventes) }}€
- **Moyenne** : {{ List.avg($ventes) }}€
- **Maximum** : {{ List.max($ventes) }}€
- **Arrondi** : {{ Math.avg($ventes) }}€ (arrondi : {{ Math.round(List.avg($ventes)) }}€)

---

## 8. Notes et Références

Texte avec une note[^1] et une autre note[^note2].

[^1]: Première note explicative détaillée.

[^note2]: Deuxième note avec du ||texte important||{color=red}.

---

## Footer

**Liens utiles :** [Documentation](@docs){target=\_blank} | [GitHub](https://github.com/marmotz/zolt)
{target=\_blank} | [Guide complet](@docs)

---

_[HTML]: HyperText Markup Language
_[CSS]: Cascading Style Sheets \*[Zolt]: Modern Markup Language

---

_Document créé le {$created} — Dernière modification : {$modified}_

```

---

## 13. Références et Ressources

### 13.1 Extensions Possibles

Le Zolt est conçu pour être extensible. Des blocs personnalisés peuvent être ajoutés :

```

:::custom-type [Titre]
Contenu personnalisé
:::

```

### 13.2 Thèmes et Styles

Les blocs sémantiques (`:::type`) sont rendus selon le thème actif :

- Thème clair/sombre automatique
- Couleurs personnalisables via CSS
- Support des thèmes utilisateurs

### 13.3 Outils de Développement

Pour développer un parseur Zolt :

1. Suivre les phases de traitement définies section 7
2. Implémenter les marqueurs de tableau
3. Gérer les priorités des attributs
4. Valider la syntaxe avec avertissements

---

## 14. Glossaire

| Terme                  | Définition                                                       |
|------------------------|------------------------------------------------------------------|
| **Zolt**               | Le langage de balisage                                           |
| **Bloc sémantique**    | Conteneur `:::` avec une signification structurelle              |
| **Attribut universel** | Syntaxe `{}` applicable à tout élément                           |
| **Préfixe média**      | Symbole (`!`, `!!`, `??`, `@@`, `&&`) indiquant le type de média |
| **Variable**           | Définition `$var = "val"` utilisable avec `{$var}`               |
| **Référence croisée**  | Lien vers un ID avec `@ref`                                      |
| **Grille table**       | Tableau avancé avec fusion de cellules                           |
| **Commentaire**        | Texte non affiché : `:::comment` bloc ou `%% inline %%`          |
| **Liste de définition** | Liste terme/définition avec syntaxe `:terme`                     |
| **Échappement**        | Caractère `\` pour afficher littéralement les opérateurs         |
| **File metadata**      | Métadonnées YAML en haut de fichier (titre, auteur, etc.)        |
| **TOC**                | Table des matières générée avec `[[toc]]`                        |
| **Note de bas de page** | Référence `[^n]` avec définition en bas de page                 |
| **Boucle**             | Structure `:::foreach` pour itérer sur des tableaux              |
| **Namespace**          | Préfixe Math/List/String pour les fonctions utilitaires         |
| **Indentation technique** | `&` pour décaler le texte (différent de citation `>`)        |
| **Inline stylé**       | `||texte||{attr}` pour marquer du texte avec attributs           |
| **Accordéon**          | Conteneur pliable `:::details` avec titre cliquable              |
| **Onglet**             | Navigation par `:::tabs` et `:::tab`                            |
| **Colonne**            | Mise en page avec `:::columns` et `:::column`                    |

---

**Version de la spécification :** 0.2
**Dernière mise à jour :** 2026-02-18
**Statut :** Draft

Pour toute question ou suggestion d'amélioration, consultez la documentation du projet Zolt.
```
