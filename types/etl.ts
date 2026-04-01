// Re-export từ canonical type mới — backward compat
export type { CanonicalRow as UnifiedRow } from "@/lib/types/canonical";
export type UploadResult = {
  source:   string;
  filename: string;
  rows:     number;
  errors:   string[];
  preview:  import("@/lib/types/canonical").CanonicalRow[];
};
