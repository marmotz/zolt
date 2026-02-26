export const zoltLanguage = {
  name: 'Zolt',
  scopeName: 'source.zolt',
  fileTypes: ['zolt'],
  repository: {},
  patterns: [
    {
      name: 'comment.line.number-sign.zolt',
      match: '^\\s*#.*$',
    },
    {
      name: 'heading.zolt',
      match: '^#{1,6}\\s+.*$',
    },
    {
      name: 'strong.zolt',
      match: '\\*\\*[^*]+\\*\\*|__[^_]+__',
    },
    {
      name: 'emphasis.zolt',
      match: '(?<!\\*)\\*(?!\\*)[^*]+\\*(?!\\*)|(?<!_)_(?!_)[^_]+_(?!_)',
    },
    {
      name: 'inline.code.zolt',
      match: '`[^`]+`',
    },
    {
      name: 'link.zolt',
      match: '\\[([^\\]]+)\\]\\(([^)]+)\\)',
    },
    {
      name: 'image.zolt',
      match: '!\\[([^\\]]*)\\]\\(([^)]+)\\)',
    },
    {
      name: 'variable.zolt',
      match: '\\{\\{[^{}]+\\}\\}',
    },
    {
      name: 'special.block.zolt',
      match: '^:::\\{[^}]+\\}',
    },
    {
      name: 'blockquote.zolt',
      match: '^>\\s+.*$',
    },
    {
      name: 'list.markup.zolt',
      match: '^\\s*([-*+]|\\d+\\.)\\s+',
    },
    {
      name: 'hr.zolt',
      match: '^[-*_]{3,}\\s*$',
    },
    {
      name: 'table.row.zolt',
      match: '^\\|.*\\|',
    },
    {
      name: 'fence.definition.zolt',
      match: '^```\\{?[\\w-]*',
    },
  ],
};
