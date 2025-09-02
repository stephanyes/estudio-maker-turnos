import crypto from 'crypto';
import type { ChangeDetectionState, FetchWithCacheHeadersInput, FetchWithCacheHeadersOutput } from './types';

export function computeContentHash(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

export async function fetchWithCacheHeaders(
  input: FetchWithCacheHeadersInput
): Promise<FetchWithCacheHeadersOutput> {
  const { url, prior } = input;
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (compatible; EstudioMakerBot/1.0)',
  };
  if (prior?.etag) headers['If-None-Match'] = prior.etag;
  if (prior?.lastModified) headers['If-Modified-Since'] = prior.lastModified;

  const res = await fetch(url, { headers });
  if (res.status === 304) {
    return {
      status: 304,
      etag: res.headers.get('etag'),
      lastModified: res.headers.get('last-modified'),
    };
  }
  const text = await res.text();
  return {
    status: res.status,
    html: text,
    etag: res.headers.get('etag'),
    lastModified: res.headers.get('last-modified'),
    contentHash: computeContentHash(text),
  };
}

export function parseCurrencyToNumber(value: string): number {
  const cleaned = value
    .replace(/\s+/g, '')
    .replace(/[.,](?=\d{3}(?:\D|$))/g, '') // remove thousands separators
    .replace(/[^\d.,-]/g, '')
    .replace(',', '.');
  const parsed = Number.parseFloat(cleaned);
  if (Number.isNaN(parsed)) return 0;
  return parsed;
}


