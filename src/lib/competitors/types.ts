export type CompetitorSource = 'cerini' | 'mala';

export type ServiceCategory =
  | 'corte'
  | 'color'
  | 'cauterizacion'
  | 'peinado'
  | 'tratamientos'
  | 'otros';

export interface CompetitorPriceRecord {
  source: CompetitorSource;
  serviceName: string;
  category: ServiceCategory;
  price: number;
  currency: string; // e.g., ARS
  observations?: string;
  contentHash?: string;
  capturedAt: string; // ISO timestamp
  metadata?: Record<string, unknown>;
}

export interface ScrapeMeta {
  url: string;
  etag?: string | null;
  lastModified?: string | null;
  contentHash?: string;
  fetchedAt: string; // ISO timestamp
  usedCache?: boolean;
  debugPath?: string; // optional path to debug dump file
}

export interface ScrapeResult {
  source: CompetitorSource;
  meta: ScrapeMeta;
  items: CompetitorPriceRecord[];
}

export interface ChangeDetectionState {
  etag?: string | null;
  lastModified?: string | null;
  contentHash?: string | null;
}

export interface FetchWithCacheHeadersInput {
  url: string;
  prior?: ChangeDetectionState;
}

export interface FetchWithCacheHeadersOutput {
  status: number;
  html?: string;
  etag?: string | null;
  lastModified?: string | null;
  contentHash?: string;
}


