import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { zoltLanguage } from '../src/builder/html/shiki/zolt';

const VSCODE_DIR = path.join(process.cwd(), 'editors/vscode');
const SYNTAX_DIR = path.join(VSCODE_DIR, 'syntaxes');

// 1. Créer les dossiers
if (!fs.existsSync(SYNTAX_DIR)) {
  fs.mkdirSync(SYNTAX_DIR, { recursive: true });
}

// 2. Générer le fichier tmLanguage.json avec UUID et extensions corrigées
const grammarWithUuid = {
  ...zoltLanguage,
  fileTypes: ['zlt', 'zolt'], // Ajout explicite de .zlt pour JetBrains
  uuid: randomUUID(),
};

const grammarPath = path.join(SYNTAX_DIR, 'zolt.tmLanguage.json');
fs.writeFileSync(grammarPath, JSON.stringify(grammarWithUuid, null, 2));

// 3. Générer le package.json de l'extension
const packageJson = {
  name: 'zolt',
  displayName: 'Zolt Language Support',
  description: 'Syntax highlighting for Zolt files',
  version: '0.1.0',
  publisher: 'zolt',
  engines: {
    vscode: '^1.50.0',
  },
  categories: ['Programming Languages'],
  contributes: {
    languages: [
      {
        id: 'zolt',
        aliases: ['Zolt', 'zolt'],
        extensions: ['.zlt'],
        configuration: './language-configuration.json',
      },
    ],
    grammars: [
      {
        language: 'zolt',
        scopeName: 'source.zolt',
        path: './syntaxes/zolt.tmLanguage.json',
      },
    ],
  },
};

fs.writeFileSync(path.join(VSCODE_DIR, 'package.json'), JSON.stringify(packageJson, null, 2));

// 4. Configuration de base
const langConfig = {
  comments: {
    blockComment: ['%%', '%%'],
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
    ['{{', '}}'],
    ['[[', ']]'],
    ['||', '||'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: "'", close: "'", notIn: ['string', 'comment'] },
    { open: '"', close: '"', notIn: ['string'] },
    { open: '`', close: '`', notIn: ['string', 'comment'] },
    { open: '%%', close: '%%' },
    { open: '**', close: '**' },
    { open: '//', close: '//' },
    { open: '__', close: '__' },
    { open: '~~', close: '~~' },
    { open: '==', close: '==' },
    { open: '||', close: '||' },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: "'", close: "'" },
    { open: '"', close: '"' },
    { open: '`', close: '`' },
    { open: '%%', close: '%%' },
    { open: '**', close: '**' },
    { open: '//', close: '//' },
    { open: '__', close: '__' },
    { open: '~~', close: '~~' },
    { open: '==', close: '==' },
    { open: '||', close: '||' },
  ],
};

fs.writeFileSync(path.join(VSCODE_DIR, 'language-configuration.json'), JSON.stringify(langConfig, null, 2));

console.log('✅ Extension VS Code (v3 avec .zlt support) générée dans ./editors/vscode');
