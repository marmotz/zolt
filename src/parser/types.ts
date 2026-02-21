export interface ASTNode {
  type: string;
  attributes?: Attributes;
}

export interface Attributes {
  id?: string;
  class?: string;
  [key: string]: unknown;
}

export interface DocumentNode extends ASTNode {
  type: 'Document';
  children: ASTNode[];
  frontmatter?: Record<string, unknown>;
  sourceFile?: string;
}

export interface HeadingNode extends ASTNode {
  type: 'Heading';
  level: number;
  content: string;
}

export interface ParagraphNode extends ASTNode {
  type: 'Paragraph';
  content: string;
}

export interface BlockquoteNode extends ASTNode {
  type: 'Blockquote';
  children: ASTNode[];
  level: number;
}

export interface ListNode extends ASTNode {
  type: 'List';
  kind: 'bullet' | 'numbered' | 'task' | 'definition';
  children: ListItemNode[];
  start?: number;
}

export interface ListItemNode extends ASTNode {
  type: 'ListItem';
  content: string;
  checked?: boolean;
  children: ASTNode[];
}

export interface CodeBlockNode extends ASTNode {
  type: 'CodeBlock';
  language?: string;
  content: string;
}

export interface TripleColonBlockNode extends ASTNode {
  type: 'TripleColonBlock';
  blockType: string;
  title?: string;
  content: string;
  children?: ASTNode[];
}

export interface DoubleBracketBlockNode extends ASTNode {
  type: 'DoubleBracketBlock';
  blockType: 'table' | 'toc' | string;
  content: string;
}

export interface HorizontalRuleNode extends ASTNode {
  type: 'HorizontalRule';
  style: 'solid' | 'dashed' | 'dotted';
}

export interface IndentationNode extends ASTNode {
  type: 'Indentation';
  level: number;
  children: ASTNode[];
}

export interface BoldNode extends ASTNode {
  type: 'Bold';
  content: string;
}

export interface ItalicNode extends ASTNode {
  type: 'Italic';
  content: string;
}

export interface UnderlineNode extends ASTNode {
  type: 'Underline';
  content: string;
}

export interface StrikethroughNode extends ASTNode {
  type: 'Strikethrough';
  content: string;
}

export interface CodeNode extends ASTNode {
  type: 'Code';
  content: string;
}

export interface SuperscriptNode extends ASTNode {
  type: 'Superscript';
  content: string;
}

export interface SubscriptNode extends ASTNode {
  type: 'Subscript';
  content: string;
}

export interface HighlightNode extends ASTNode {
  type: 'Highlight';
  content: string;
}

export interface InlineStyleNode extends ASTNode {
  type: 'InlineStyle';
  content: string;
  attributes?: Record<string, string>;
}

export interface LinkNode extends ASTNode {
  type: 'Link';
  href: string;
  title?: string;
  content: string;
  isInternal?: boolean;
  isReference?: boolean;
}

export interface ImageNode extends ASTNode {
  type: 'Image';
  src: string;
  alt: string;
}

export interface VideoNode extends ASTNode {
  type: 'Video';
  src: string;
  alt: string;
}

export interface AudioNode extends ASTNode {
  type: 'Audio';
  src: string;
  alt: string;
}

export interface EmbedNode extends ASTNode {
  type: 'Embed';
  src: string;
  title?: string;
}

export interface FileNode extends ASTNode {
  type: 'File';
  src: string;
  title?: string;
}

export interface VariableNode extends ASTNode {
  type: 'Variable';
  name: string;
  isGlobal: boolean;
}

export interface ExpressionNode extends ASTNode {
  type: 'Expression';
  expression: string;
}

export interface IncludeNode extends ASTNode {
  type: 'Include';
  path: string;
}

export interface ForeachNode extends ASTNode {
  type: 'Foreach';
  iterable: string;
  variable: string;
  children: ASTNode[];
}

export interface IfNode extends ASTNode {
  type: 'If';
  condition: string;
  children: ASTNode[];
}

export interface FootnoteNode extends ASTNode {
  type: 'Footnote';
  id: string;
  content?: string;
}

export interface FootnoteDefinitionNode extends ASTNode {
  type: 'FootnoteDefinition';
  id: string;
  content: string;
}

export interface AbbreviationNode extends ASTNode {
  type: 'Abbreviation';
  abbr: string;
  definition: string;
}

export interface FrontmatterNode extends ASTNode {
  type: 'Frontmatter';
  data: Record<string, unknown>;
}

export interface TextNode extends ASTNode {
  type: 'Text';
  content: string;
}
