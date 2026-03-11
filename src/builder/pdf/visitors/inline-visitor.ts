import * as fs from 'node:fs';
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
    private evaluator?: ExpressionEvaluator
  ) {}

  visitText(node: TextNode): Content {
    return { text: this.evaluateString(node.content) };
  }

  visitAnchor(node: AnchorNode): Content {
    return { text: '', id: node.id };
  }

  visitCode(node: CodeNode): Content {
    return { text: this.evaluateString(node.content), style: 'code' };
  }

  async visitLink(node: LinkNode): Promise<Content> {
    const children = await Promise.all(node.children.map((child) => this.visitNode(child)));
    const href = this.evaluateString(node.href);

    return {
      text: children,
      link: href,
      color: 'blue',
      decoration: 'underline',
    };
  }

  async visitImage(node: ImageNode): Promise<Content> {
    const src = this.assetResolver ? this.assetResolver(this.evaluateString(node.src)) : this.evaluateString(node.src);

    try {
      if (src.startsWith('http')) {
        return {
          image: src,
          width: 500,
        };
      }

      const imageBuffer = fs.readFileSync(src);
      const extension = src.split('.').pop()?.toLowerCase() || 'png';
      const base64Data = imageBuffer.toString('base64');
      const dataUrl = `data:image/${extension};base64,${base64Data}`;

      return {
        image: dataUrl,
        width: 500,
      };
    } catch {
      return { text: `[Image not found: ${src}]`, color: 'red' };
    }
  }

  async visitVideo(node: VideoNode): Promise<Content> {
    return {
      text: `[Video: ${this.evaluateString(node.alt || node.src)}]`,
      link: this.evaluateString(node.src),
      color: 'blue',
      decoration: 'underline',
    };
  }

  async visitAudio(node: AudioNode): Promise<Content> {
    return {
      text: `[Audio: ${this.evaluateString(node.alt || node.src)}]`,
      link: this.evaluateString(node.src),
      color: 'blue',
      decoration: 'underline',
    };
  }

  async visitEmbed(node: EmbedNode): Promise<Content> {
    return {
      text: `[Embed: ${this.evaluateString(node.title || node.src)}]`,
      link: this.evaluateString(node.src),
      color: 'blue',
      decoration: 'underline',
    };
  }

  async visitFile(node: FileNode): Promise<Content> {
    return {
      text: `[File: ${this.evaluateString(node.title || node.src)}]`,
      link: this.evaluateString(node.src),
      color: 'blue',
      decoration: 'underline',
    };
  }

  async visitFootnote(node: FootnoteNode): Promise<Content> {
    return {
      text: `[${node.id}]`,
      linkToDestination: `fn-${node.id}`,
      color: 'blue',
      sup: true,
    };
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
    return { text: node.abbreviation };
  }

  visitCommentInline(_node: CommentInlineNode): Content {
    return { text: '' };
  }

  visitMath(node: MathNode): Content {
    return { text: node.content, italics: true, color: '#444444' };
  }

  async visitSuperscript(node: SuperscriptNode): Promise<Content> {
    const children = await Promise.all(node.children.map((child) => this.visitNode(child)));

    return {
      text: children,
      sup: true,
    };
  }

  async visitSubscript(node: SubscriptNode): Promise<Content> {
    const children = await Promise.all(node.children.map((child) => this.visitNode(child)));

    return {
      text: children,
      sub: true,
    };
  }

  async visitHighlight(node: HighlightNode): Promise<Content> {
    const children = await Promise.all(node.children.map((child) => this.visitNode(child)));

    return {
      text: children,
      background: 'yellow',
    };
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
