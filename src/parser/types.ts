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
  children: ASTNode[];
  attributes?: Attributes;
}

export interface ItalicNode {
  type: 'Italic';
  children: ASTNode[];
  attributes?: Attributes;
}

export interface UnderlineNode {
  type: 'Underline';
  children: ASTNode[];
  attributes?: Attributes;
}

export interface StrikethroughNode {
  type: 'Strikethrough';
  children: ASTNode[];
  attributes?: Attributes;
}

export interface CodeNode {
  type: 'Code';
  content: string;
  attributes?: Attributes;
}

export interface SuperscriptNode {
  type: 'Superscript';
  children: ASTNode[];
  attributes?: Attributes;
}

export interface SubscriptNode {
  type: 'Subscript';
  children: ASTNode[];
  attributes?: Attributes;
}

export interface HighlightNode {
  type: 'Highlight';
  children: ASTNode[];
  attributes?: Attributes;
}

export interface InlineStyleNode {
  type: 'InlineStyle';
  children: ASTNode[];
  attributes?: Attributes;
}

export interface LinkNode {
  type: 'Link';
  children: ASTNode[];
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
  attributes?: Attributes;
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
  attributes?: Attributes;
}

export interface AbbreviationDefinitionNode {
  type: 'AbbreviationDefinition';
  abbreviation: string;
  definition: string;
  isGlobal: boolean;
}

export interface LinkReferenceDefinitionNode {
  type: 'LinkReferenceDefinition';
  ref: string;
  url: string;
}

export interface CommentInlineNode {
  type: 'CommentInline';
  content: string;
}

export interface AnchorNode {
  type: 'Anchor';
  id: string;
}

export interface AttributesNode {
  type: 'Attributes';
  attributes: Attributes;
}

export interface ParagraphNode {
  type: 'Paragraph';
  children: ASTNode[];
  attributes?: Attributes;
}

export interface HeadingNode {
  type: 'Heading';
  level: number;
  children: ASTNode[];
  attributes?: Attributes;
}

export interface BlockquoteNode {
  type: 'Blockquote';
  level: number;
  children: ASTNode[];
  attributes?: Attributes;
}

export interface DefinitionTermNode {
  type: 'DefinitionTerm';
  children: ASTNode[];
  attributes?: Attributes;
}

export interface DefinitionDescriptionNode {
  type: 'DefinitionDescription';
  children: ASTNode[];
  attributes?: Attributes;
}

export interface ListNode {
  type: 'List';
  kind: 'bullet' | 'numbered' | 'task' | 'definition';
  children: (ListItemNode | DefinitionTermNode | DefinitionDescriptionNode)[];
  attributes?: Attributes;
}

export interface ListItemNode {
  type: 'ListItem';
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
  data: Record<string, any>;
}

export interface TripleColonBlockNode {
  type: 'TripleColonBlock';
  blockType: string;
  title?: string;
  children: ASTNode[];
  attributes?: Attributes;
}

export interface VariableDefinitionNode {
  type: 'VariableDefinition';
  name: string;
  value: any;
  isGlobal: boolean;
}

export interface TableNode {
  type: 'Table';
  header?: TableRowNode;
  rows: TableRowNode[];
  attributes?: Attributes;
}

export interface TableRowNode {
  type: 'TableRow';
  cells: TableCellNode[];
}

export interface TableCellNode {
  type: 'TableCell';
  children: ASTNode[];
  isHeader?: boolean;
  alignment?: 'left' | 'center' | 'right';
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
  frontmatter?: FrontmatterNode;
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
  | AbbreviationDefinitionNode
  | LinkReferenceDefinitionNode
  | CommentInlineNode
  | AnchorNode
  | AttributesNode
  | ParagraphNode
  | HeadingNode
  | BlockquoteNode
  | ListNode
  | ListItemNode
  | DefinitionTermNode
  | DefinitionDescriptionNode
  | CodeBlockNode
  | HorizontalRuleNode
  | FrontmatterNode
  | TripleColonBlockNode
  | VariableDefinitionNode
  | TableNode
  | TableRowNode
  | TableCellNode
  | DoubleBracketBlockNode
  | IndentationNode
  | DocumentNode
  | IfNode
  | ForeachNode
  | ChartNode
  | ChartSeriesNode
  | MermaidNode;

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

export interface ChartNode {
  type: 'Chart';
  children: ChartSeriesNode[];
  attributes?: Attributes;
  layout?: 'horizontal' | 'vertical';
}

export interface ChartSeriesNode {
  type: 'ChartSeries';
  chartType: 'line' | 'bar' | 'pie' | 'area' | 'doughnut';
  title?: string;
  data: ChartDataPoint[];
  attributes?: Attributes;
}

export interface ChartDataPoint {
  label: string;
  value: string | number;
  dataset?: string;
}

export interface MermaidNode {
  type: 'Mermaid';
  content: string;
}
