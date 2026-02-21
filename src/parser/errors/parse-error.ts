export class ParseError extends Error {
  constructor(
    message: string,
    public line: number,
    public column: number,
    public filePath: string,
    public code: string
  ) {
    super(`${message} at line ${line}, column ${column}`);
    this.name = 'ParseError';
  }
}
