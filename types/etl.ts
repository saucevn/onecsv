export type UploadResult = {
  source: string;
  filename: string;
  rows: number;
  errors: string[];
  preview: Record<string, unknown>[];
};
