export interface Attributes {
  id?: string;
  class?: string;
  [key: string]: string | undefined;
}

export interface TextNode {
  type: 'Text';
  content: string;
}

export interface BoldNode {
  type: 'Bold';
  content: string;
  attributes?: Attributes;
}

export interface ItalicNode {
  type: 'Italic';
  content: string;
  attributes?: Attributes;
}

export interface UnderlineNode {
  type: 'Underline';
  content: string;
  attributes?: Attributes;
}

export interface StrikethroughNode {
  type: 'Strikethrough';
  content: string;
  attributes?: Attributes;
}

export interface CodeNode {
  type: 'Code';
  content: string;
  attributes?: Attributes;
}

export interface SuperscriptNode {
  type: 'Superscript';
  content: string;
  attributes?: Attributes;
}

export interface SubscriptNode {
  type: 'Subscript';
  content: string;
  attributes?: Attributes;
}

export interface HighlightNode {
  type: 'Highlight';
  content: string;
  attributes?: Attributes;
}

export interface InlineStyleNode {
  type: 'InlineStyle';
  content: string;
  attributes?: Attributes;
}

export interface LinkNode {
  type: 'Link';
  content: string;
  href: string;
  title?: string;
  attributes?: Attributes;
}

export interface ImageNode {
  type: 'Image';
  src: string;
  alt: string;
  title?: string;
  attributes?: Attributes;
}

export interface VideoNode {
  type: 'Video';
  src: string;
  alt?: string;
  attributes?: Attributes;
}

export interface AudioNode {
  type: 'Audio';
  src: string;
  alt?: string;
  attributes?: Attributes;
}

export interface EmbedNode {
  type: 'Embed';
  src: string;
  title?: string;
  attributes?: Attributes;
}

export interface FileNode {
  type: 'File';
  src: string;
  title?: string;
}

export interface VariableNode {
  type: 'Variable';
  name: string;
  isGlobal: boolean;
}

export interface ExpressionNode {
  type: 'Expression';
  expression: string;
}

export interface IncludeNode {
  type: 'Include';
  path: string;
}

export interface FootnoteNode {
  type: 'Footnote';
  id: string;
}

export interface FootnoteDefinitionNode {
  type: 'FootnoteDefinition';
  id: string;
  content: string;
}

export interface AbbreviationNode {
  type: 'Abbreviation';
  abbreviation: string;
  definition: string;
}

export interface AnchorNode {
  type: 'Anchor';
  id: string;
}

export interface ParagraphNode {
  type: 'Paragraph';
  content: string;
  attributes?: Attributes;
}

export interface HeadingNode {
  type: 'Heading';
  level: number;
  content: string;
  attributes?: Attributes;
}

export interface BlockquoteNode {
  type: 'Blockquote';
  level: number;
  children: ASTNode[];
  attributes?: Attributes;
}

export interface ListNode {
  type: 'List';
  kind: 'bullet' | 'numbered' | 'task' | 'definition';
  children: ListItemNode[];
  attributes?: Attributes;
}

export interface ListItemNode {
  type: 'ListItem';
  content: string;
  checked?: boolean;
  children: ASTNode[];
  attributes?: Attributes;
}

export interface CodeBlockNode {
  type: 'CodeBlock';
  language?: string;
  content: string;
  attributes?: Attributes;
}

export interface HorizontalRuleNode {
  type: 'HorizontalRule';
  style?: string;
  attributes?: Attributes;
}

export interface FrontmatterNode {
  type: 'Frontmatter';
  data: Record<string, unknown>;
}

export interface TripleColonBlockNode {
  type: 'TripleColonBlock';
  blockType: string;
  content: string;
  attributes?: Attributes;
}

export interface DoubleBracketBlockNode {
  type: 'DoubleBracketBlock';
  blockType: string;
  content: string;
  attributes?: Attributes;
}

export interface IndentationNode {
  type: 'Indentation';
  level: number;
  children: ASTNode[];
  attributes?: Attributes;
}

export interface DocumentNode {
  type: 'Document';
  children: ASTNode[];
  sourceFile: string;
}

export type ASTNode =
  | TextNode
  | BoldNode
  | ItalicNode
  | UnderlineNode
  | StrikethroughNode
  | CodeNode
  | SuperscriptNode
  | SubscriptNode
  | HighlightNode
  | InlineStyleNode
  | LinkNode
  | ImageNode
  | VideoNode
  | AudioNode
  | EmbedNode
  | FileNode
  | VariableNode
  | ExpressionNode
  | IncludeNode
  | FootnoteNode
  | FootnoteDefinitionNode
  | AbbreviationNode
  | AnchorNode
  | ParagraphNode
  | HeadingNode
  | BlockquoteNode
  | ListNode
  | ListItemNode
  | CodeBlockNode
  | HorizontalRuleNode
  | FrontmatterNode
  | TripleColonBlockNode
  | DoubleBracketBlockNode
  | IndentationNode
  | DocumentNode;

export interface IfNode {
  type: 'If';
  condition: string;
  then: ASTNode[];
  else?: ASTNode[];
}

export interface ForeachNode {
  type: 'Foreach';
  iterator: string;
  collection: string;
  body: ASTNode[];
}
