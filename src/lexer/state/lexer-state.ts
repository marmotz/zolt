export type LexerMode = 'BLOCK' | 'INLINE' | 'CODE' | 'FILE_METADATA' | 'TABLE' | 'TRIPLE_COLON';

export class LexerState {
  mode: LexerMode;
  indentStack: number[];
  codeLanguage: string | null;
  blockDepth: number;

  constructor() {
    this.mode = 'BLOCK';
    this.indentStack = [0];
    this.codeLanguage = null;
    this.blockDepth = 0;
  }

  pushIndent(level: number): void {
    this.indentStack.push(level);
  }

  popIndent(): number {
    return this.indentStack.pop() ?? 0;
  }

  getCurrentIndent(): number {
    return this.indentStack[this.indentStack.length - 1];
  }

  setMode(mode: LexerMode): void {
    this.mode = mode;
  }

  enterCodeBlock(language: string | null): void {
    this.mode = 'CODE';
    this.codeLanguage = language;
    this.blockDepth++;
  }

  exitCodeBlock(): void {
    this.mode = 'BLOCK';
    this.codeLanguage = null;
    this.blockDepth = Math.max(0, this.blockDepth - 1);
  }
}
