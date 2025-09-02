import { NextResponse } from 'next/server';
import { scrapeCerini } from '../../../../lib/competitors/cerini';
import { scrapeMala } from '../../../../lib/competitors/mala';
import { createScrapeRun, finishScrapeRun, getLastScrapeRun, insertPrices } from '../../../../lib/competitors/store';

export const runtime = 'nodejs';

const TTL_HOURS = 24;
const MIN_INTERVAL_HOURS = 6;
const LOCK_MINUTES = 10;

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';
    const nocache = url.searchParams.get('nocache') === 'true';
    const now = Date.now();
    const sources: Array<'cerini' | 'mala'> = ['cerini', 'mala'];
    const results: any = {};

    for (const source of sources) {
      const lastRun = await getLastScrapeRun(source);
      const lastFinished = lastRun?.finished_at ? new Date(lastRun.finished_at).getTime() : 0;
      const lockExpires = lastRun?.lock_expires_at ? new Date(lastRun.lock_expires_at).getTime() : 0;

      // rate limit: no más de una vez cada MIN_INTERVAL_HOURS
      if (!force && lastFinished && now - lastFinished < MIN_INTERVAL_HOURS * 3600_000) {
        results[source] = { status: 'skipped', reason: 'min_interval' };
        continue;
      }

      // lock activo
      if (!force && lockExpires && lockExpires > now && lastRun?.status === 'running') {
        results[source] = { status: 'skipped', reason: 'locked' };
        continue;
      }

      const run = await createScrapeRun(source, LOCK_MINUTES);
      try {
        if (source === 'cerini') {
          const res = await scrapeCerini(
            nocache
              ? undefined
              : {
                  etag: lastRun?.result?.etag ?? null,
                  lastModified: lastRun?.result?.lastModified ?? null,
                  contentHash: lastRun?.result?.contentHash ?? null,
                }
          );
          if (res.items.length > 0) {
            await insertPrices(res.items);
          }
          await finishScrapeRun(run.id, 'success', res.meta);
          results[source] = { status: 'success', inserted: res.items.length, meta: res.meta };
        } else {
          const res = await scrapeMala(
            nocache
              ? undefined
              : {
                  etag: lastRun?.result?.etag ?? null,
                  lastModified: lastRun?.result?.lastModified ?? null,
                  contentHash: lastRun?.result?.contentHash ?? null,
                }
          );
          if (res.items.length > 0) {
            await insertPrices(res.items);
          }
          await finishScrapeRun(run.id, 'success', res.meta);
          results[source] = { status: 'success', inserted: res.items.length, meta: res.meta };
        }
      } catch (err: any) {
        await finishScrapeRun(run.id, 'failed', undefined, err?.message || String(err));
        results[source] = { status: 'failed', error: err?.message || String(err) };
      }
    }

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 });
  }
}


