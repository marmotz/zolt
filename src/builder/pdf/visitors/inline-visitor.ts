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
  FileNode,
  FootnoteNode,
  HighlightNode,
  ImageNode,
  LinkNode,
  MathNode,
  SubscriptNode,
  SuperscriptNode,
  TextNode,
  VideoNode,
} from '../../../parser/types';
import { applyAttributes } from '../utils/attribute-applier';

export class InlineVisitor {
  constructor(
    private visitNode: (node: ASTNode) => Promise<Content>,
    private assetResolver?: (path: string) => string
  ) {}

  visitText(node: TextNode): Content {
    return { text: node.content };
  }

  visitAnchor(node: AnchorNode): Content {
    return { text: '', id: node.id };
  }

  visitCode(node: CodeNode): Content {
    return { text: node.content, style: 'code' };
  }

  async visitLink(node: LinkNode): Promise<Content> {
    const children = await Promise.all(node.children.map((child) => this.visitNode(child)));

    return {
      text: children,
      link: node.href,
      color: 'blue',
      decoration: 'underline',
    };
  }

  async visitImage(node: ImageNode): Promise<Content> {
    const src = this.assetResolver ? this.assetResolver(node.src) : node.src;

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
      text: `[Video: ${node.alt || node.src}]`,
      link: node.src,
      color: 'blue',
      decoration: 'underline',
    };
  }

  async visitAudio(node: AudioNode): Promise<Content> {
    return {
      text: `[Audio: ${node.alt || node.src}]`,
      link: node.src,
      color: 'blue',
      decoration: 'underline',
    };
  }

  async visitEmbed(node: EmbedNode): Promise<Content> {
    return {
      text: `[Embed: ${node.title || node.src}]`,
      link: node.src,
      color: 'blue',
      decoration: 'underline',
    };
  }

  async visitFile(node: FileNode): Promise<Content> {
    return {
      text: `[File: ${node.title || node.src}]`,
      link: node.src,
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

  visitAbbreviation(node: AbbreviationNode): Content {
    // pdfmake ne supporte pas nativement les tooltips, on affiche juste le texte
    return { text: node.abbreviation };
  }

  visitCommentInline(_node: CommentInlineNode): Content {
    return { text: '' };
  }

  visitMath(node: MathNode): Content {
    // Rendu basique pour l'instant
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
}
