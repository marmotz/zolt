export interface FileMetadata {
  created: Date;
  modified: Date;
}

export function createFileDateVariables(metadata: FileMetadata): { created: string; modified: string } {
  return {
    created: metadata.created.toISOString(),
    modified: metadata.modified.toISOString(),
  };
}
