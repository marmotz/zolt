import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Content } from 'pdfmake/interfaces';
import type {
  AbbreviationNode,
  AnchorNode,
  ASTNode,
  AudioNode,
  CodeNode,
  CommentInlineNode,
  EmbedNode,
  ExpressionNode,
  FileNode,
  FootnoteNode,
  HighlightNode,
  ImageNode,
  LinkNode,
  MathNode,
  SubscriptNode,
  SuperscriptNode,
  TextNode,
  VariableNode,
  VideoNode,
} from '../../../parser/types';
import { formatValue } from '../../../utils/value-formatter';
import type { ExpressionEvaluator } from '../../evaluator/expression-evaluator';
import { applyAttributes } from '../utils/attribute-applier';

export class InlineVisitor {
  constructor(
    private visitNode: (node: ASTNode) => Promise<Content>,
    private assetResolver?: (path: string) => string,
    private evaluator?: ExpressionEvaluator,
    private baseDir?: string,
    private sourceFile?: string
  ) {}

  /**
   * Nettoie un ID pour pdfmake (évite les caractères spéciaux qui pourraient bloquer les liens)
   */
  private cleanId(id: string): string {
    return id.replace(/[:.#/\\ ]/g, '_');
  }

  visitText(node: TextNode): Content {
    return { text: this.evaluateString(node.content) };
  }

  visitAnchor(node: AnchorNode): Content {
    // pdfmake a parfois du mal avec les textes vides pour les IDs
    // On utilise un zero-width space (\u200B) pour assurer la présence de l'élément
    return applyAttributes({ text: '\u200B', id: this.cleanId(node.id) }, node);
  }

  visitCode(node: CodeNode): Content {
    return applyAttributes({ text: this.evaluateString(node.content), style: 'code' }, node);
  }

  async visitLink(node: LinkNode): Promise<Content> {
    const children = await Promise.all(node.children.map((child) => this.visitNode(child)));
    const href = this.evaluateString(node.href);

    // Transformation des liens internes Zolt
    if (href.endsWith('.zlt') || href.includes('.zlt#') || href.startsWith('#')) {
      const [rawPath, rawAnchor] = href.startsWith('#') ? ['', href.substring(1)] : href.split('#');

      // Nettoyage de l'ancre si elle contient des attributs {...}
      const anchor = rawAnchor ? rawAnchor.replace(/\{[^}]*}$/, '').trim() : '';
      const filePath = rawPath;

      // Si c'est un lien relatif, on essaie de le résoudre
      let absolutePath = filePath;
      if (filePath && !path.isAbsolute(filePath) && this.sourceFile) {
        absolutePath = path.resolve(path.dirname(this.sourceFile), filePath);
      } else if (!filePath && this.sourceFile) {
        absolutePath = this.sourceFile;
      }

      if (this.baseDir && absolutePath) {
        const relativePath = path.relative(this.baseDir, absolutePath);
        const destination = anchor ? anchor : `file:${relativePath}`;

        return applyAttributes(
          {
            text: children,
            linkToDestination: this.cleanId(destination),
            color: 'blue',
            decoration: 'underline',
          },
          node
        );
      } else if (anchor) {
        // Lien interne pur (ex: #mon-ancre)
        return applyAttributes(
          {
            text: children,
            linkToDestination: this.cleanId(anchor),
            color: 'blue',
            decoration: 'underline',
          },
          node
        );
      }
    }

    return applyAttributes(
      {
        text: children,
        link: href,
        color: 'blue',
        decoration: 'underline',
      },
      node
    );
  }

  async visitImage(node: ImageNode): Promise<Content> {
    const src = this.assetResolver ? this.assetResolver(this.evaluateString(node.src)) : this.evaluateString(node.src);

    let content: any;
    try {
      if (src.startsWith('http')) {
        content = {
          image: src,
          width: 500,
        };
      } else {
        const imageBuffer = fs.readFileSync(src);
        const extension = src.split('.').pop()?.toLowerCase() || 'png';
        const base64Data = imageBuffer.toString('base64');
        const dataUrl = `data:image/${extension};base64,${base64Data}`;

        content = {
          image: dataUrl,
          width: 500,
        };
      }
    } catch {
      content = { text: `[Image not found: ${src}]`, color: 'red' };
    }

    return applyAttributes(content, node);
  }

  async visitVideo(node: VideoNode): Promise<Content> {
    return applyAttributes(
      {
        text: `[Video: ${this.evaluateString(node.alt || node.src)}]`,
        link: this.evaluateString(node.src),
        color: 'blue',
        decoration: 'underline',
      },
      node
    );
  }

  async visitAudio(node: AudioNode): Promise<Content> {
    return applyAttributes(
      {
        text: `[Audio: ${this.evaluateString(node.alt || node.src)}]`,
        link: this.evaluateString(node.src),
        color: 'blue',
        decoration: 'underline',
      },
      node
    );
  }

  async visitEmbed(node: EmbedNode): Promise<Content> {
    return applyAttributes(
      {
        text: `[Embed: ${this.evaluateString(node.title || node.src)}]`,
        link: this.evaluateString(node.src),
        color: 'blue',
        decoration: 'underline',
      },
      node
    );
  }

  async visitFile(node: FileNode): Promise<Content> {
    return applyAttributes(
      {
        text: `[File: ${this.evaluateString(node.title || node.src)}]`,
        link: this.evaluateString(node.src),
        color: 'blue',
        decoration: 'underline',
      },
      node
    );
  }

  async visitFootnote(node: FootnoteNode): Promise<Content> {
    return applyAttributes(
      {
        text: `[${node.id}]`,
        linkToDestination: `fn_${this.cleanId(node.id)}`,
        color: 'blue',
        sup: true,
      },
      node
    );
  }

  visitVariable(node: VariableNode): Content {
    if (!this.evaluator) {
      return { text: `{$${node.name}}` };
    }
    try {
      const value = this.evaluator.evaluate(`$${node.name}`);
      if (value === null || value === undefined) {
        return { text: `{$${node.name}}` };
      }

      return { text: formatValue(value) };
    } catch {
      return { text: `{$${node.name}}` };
    }
  }

  visitExpression(node: ExpressionNode): Content {
    if (!this.evaluator) {
      return { text: `{{${node.expression}}}` };
    }
    try {
      const value = this.evaluator.evaluate(node.expression);
      if (value === null || value === undefined) {
        return { text: `{{${node.expression}}}` };
      }

      return { text: formatValue(value) };
    } catch {
      return { text: `{{${node.expression}}}` };
    }
  }

  visitAbbreviation(node: AbbreviationNode): Content {
    return applyAttributes({ text: node.abbreviation }, node);
  }

  visitCommentInline(_node: CommentInlineNode): Content {
    return { text: '' };
  }

  visitMath(node: MathNode): Content {
    return applyAttributes({ text: node.content, italics: true, color: '#444444' }, node);
  }

  async visitSuperscript(node: SuperscriptNode): Promise<Content> {
    const children = await Promise.all(node.children.map((child) => this.visitNode(child)));

    return applyAttributes(
      {
        text: children,
        sup: true,
      },
      node
    );
  }

  async visitSubscript(node: SubscriptNode): Promise<Content> {
    const children = await Promise.all(node.children.map((child) => this.visitNode(child)));

    return applyAttributes(
      {
        text: children,
        sub: true,
      },
      node
    );
  }

  async visitHighlight(node: HighlightNode): Promise<Content> {
    const children = await Promise.all(node.children.map((child) => this.visitNode(child)));

    return applyAttributes(
      {
        text: children,
        background: 'yellow',
      },
      node
    );
  }

  async visitInlineStyle(node: any): Promise<Content> {
    const children = await Promise.all(node.children.map((child: ASTNode) => this.visitNode(child)));
    const styleMap: Record<string, string> = {
      Bold: 'bold',
      Italic: 'italic',
      Underline: 'underline',
      Strikethrough: 'strikethrough',
    };

    return applyAttributes(
      {
        text: children,
        style: styleMap[node.type] || '',
      },
      node
    );
  }

  private evaluateString(text: string): string {
    if (!this.evaluator) {
      return text;
    }

    return text.replace(/\{\$([a-zA-Z_][a-zA-Z0-9_]*[^}]*)?}/g, (_, name) => {
      try {
        const val = this.evaluator!.evaluate(`$${name}`);

        return formatValue(val);
      } catch {
        return `{$${name}}`;
      }
    });
  }
}
