export const zoltLanguage = {
  name: 'zolt',
  scopeName: 'source.zolt',
  fileTypes: ['zolt'],
  repository: {
    inline: {
      patterns: [
        { include: '#comment_inline' },
        { include: '#variable_interpolation' },
        { include: '#expression' },
        { include: '#bold' },
        { include: '#italic' },
        { include: '#underline' },
        { include: '#strikethrough' },
        { include: '#highlight' },
        { include: '#superscript' },
        { include: '#subscript' },
        { include: '#inline_code' },
        { include: '#inline_styled' },
        { include: '#link' },
        { include: '#media' },
        { include: '#attributes' },
      ],
    },
    bold: {
      name: 'markup.bold.zolt',
      begin: '\\*\\*',
      end: '\\*\\*',
      patterns: [{ include: '#inline' }],
    },
    italic: {
      name: 'markup.italic.zolt',
      begin: '//',
      end: '//',
      patterns: [{ include: '#inline' }],
    },
    underline: {
      name: 'markup.underline.zolt',
      begin: '__',
      end: '__',
      patterns: [{ include: '#inline' }],
    },
    strikethrough: {
      name: 'markup.strikethrough.zolt',
      begin: '~~',
      end: '~~',
      patterns: [{ include: '#inline' }],
    },
    highlight: {
      name: 'markup.changed.zolt',
      begin: '==',
      end: '==',
      patterns: [{ include: '#inline' }],
    },
    superscript: {
      name: 'markup.superscript.zolt',
      begin: '\\^{',
      end: '}',
      patterns: [{ include: '#inline' }],
    },
    subscript: {
      name: 'markup.subscript.zolt',
      begin: '_{',
      end: '}',
      patterns: [{ include: '#inline' }],
    },
    inline_code: {
      name: 'markup.inline.code.zolt',
      begin: '`',
      end: '`',
    },
    inline_styled: {
      name: 'markup.inline.styled.zolt',
      begin: '\\|\\|',
      end: '\\|\\|',
      patterns: [{ include: '#inline' }],
    },
    comment_inline: {
      name: 'comment.block.zolt',
      begin: '%%',
      end: '%%',
    },
    variable_interpolation: {
      name: 'variable.other.interpolation.zolt',
      match: '\\{\\$[a-zA-Z0-9_.]+\\}',
    },
    expression: {
      name: 'variable.other.expression.zolt',
      begin: '\\{\\{',
      end: '\\}\\}',
      patterns: [
        {
          name: 'variable.other.zolt',
          match: '\\$[a-zA-Z0-9_.]+',
        },
        {
          name: 'keyword.operator.zolt',
          match: '\\+|\\-|\\*|\\/|\\^|%|\\?|:',
        },
        {
          name: 'constant.numeric.zolt',
          match: '\\b\\d+(\\.\\d+)?\\b',
        },
        {
          name: 'string.quoted.double.zolt',
          match: '"[^"]*"',
        },
      ],
    },
    attributes: {
      name: 'entity.other.attribute-name.zolt',
      begin: '(?<=\\S)\\{',
      end: '\\}',
      patterns: [
        {
          name: 'variable.parameter.zolt',
          match: '[a-zA-Z0-9_-]+(?==)',
        },
        {
          name: 'string.unquoted.zolt',
          match: '(?<==)[^\\s\\}]+',
        },
        {
          name: 'entity.name.tag.zolt',
          match: '#[a-zA-Z0-9_-]+',
        },
        {
          name: 'entity.other.attribute-name.class.zolt',
          match: '\\.[a-zA-Z0-9_-]+',
        },
      ],
    },
    link: {
      name: 'markup.underline.link.zolt',
      match: '\\[([^\\]]+)\\]\\(([^)]+)\\)',
    },
    media: {
      patterns: [
        {
          name: 'markup.underline.link.image.zolt',
          match: '!\\[([^\\]]*)\\]\\(([^)]+)\\)',
        },
        {
          name: 'markup.underline.link.video.zolt',
          match: '!!\\[([^\\]]*)\\]\\(([^)]+)\\)',
        },
        {
          name: 'markup.underline.link.audio.zolt',
          match: '\\?\\?\\[([^\\]]*)\\]\\(([^)]+)\\)',
        },
        {
          name: 'markup.underline.link.embed.zolt',
          match: '@@\\[([^\\]]*)\\]\\(([^)]+)\\)',
        },
        {
          name: 'markup.underline.link.file.zolt',
          match: '&&\\[([^\\]]*)\\]\\(([^)]+)\\)',
        },
      ],
    },
  },
  patterns: [
    {
      name: 'markup.heading.zolt',
      match: '^#{1,6}\\s+.*$',
    },
    {
      name: 'metadata.yaml.zolt',
      begin: '^---\\s*$',
      end: '^---\\s*$',
      patterns: [{ include: 'source.yaml' }],
    },
    {
      name: 'heading.zolt',
      begin: '^#{1,6}\\s+',
      end: '$',
      patterns: [{ include: '#inline' }],
    },
    {
      name: 'keyword.control.block.zolt',
      begin: '^:::[a-z0-9_-]+',
      end: '$',
      patterns: [
        {
          name: 'string.other.title.zolt',
          match: '\\[[^\\]]+\\]',
        },
        { include: '#attributes' },
      ],
    },
    {
      name: 'keyword.control.block.end.zolt',
      match: '^:::\\s*$',
    },
    {
      name: 'variable.other.assignment.zolt',
      match: '^\\s*\\$\\$?[a-zA-Z0-9_]+\\s*=.*$',
    },
    {
      name: 'blockquote.zolt',
      begin: '^>\\s*',
      end: '$',
      patterns: [{ include: '#inline' }],
    },
    {
      name: 'markup.indentation.zolt',
      match: '^&+\\s+',
    },
    {
      name: 'list.markup.zolt',
      match: '^\\s*([-*+]|\\d+\\.|:)\\s+',
    },
    {
      name: 'hr.zolt',
      match: '^([-*_]){3,}\\s*$',
    },
    {
      name: 'keyword.control.table.zolt',
      match: '^\\[\\[/?table.*?\\]\\]',
    },
    {
      name: 'keyword.other.toc.zolt',
      match: '^\\[\\[toc.*?\\]\\]',
    },
    {
      name: 'keyword.other.include.zolt',
      match: '\\{\\{include\\s+.*?\\}\\}',
    },
    {
      name: 'markup.fenced_code.block.zolt',
      begin: '^```',
      end: '^```',
    },
    {
      name: 'table.row.zolt',
      match: '^\\|.*\\|',
      patterns: [{ include: '#inline' }],
    },
    { include: '#inline' },
  ],
};
