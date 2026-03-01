import type { ASTNode, DocumentNode } from '../parser/types';

export interface Builder {
  build(node: ASTNode): Promise<string>;
  buildDocument(node: DocumentNode): Promise<string>;
}
