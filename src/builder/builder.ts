import { ASTNode, DocumentNode } from '../parser/types';

export interface Builder {
  build(node: ASTNode): string;
  buildDocument(node: DocumentNode): string;
}
