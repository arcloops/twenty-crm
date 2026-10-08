#!/usr/bin/env node
/**
 * Flush workspace flat-entity Redis keys and bump metadataVersion.
 *
 * Usage (against the Redis that LIVE crm-api uses — often not the public
 * proxy URL in packages/twenty-server/.env):
 *
 *   PG_DATABASE_URL=... REDIS_URL=... node scripts/repair-prod-workspace-cache.mjs
 *
 * After this, restart the Railway server/worker so in-process memoizers clear.
 */
import pg from 'pg';
import Redis from 'ioredis';

const WS_ID =
  process.env.WORKSPACE_ID ?? '3d4e1530-4bc2-4ee0-8187-533873c0996b';

const { Client } = pg;

if (!process.env.PG_DATABASE_URL || !process.env.REDIS_URL) {
  console.error('PG_DATABASE_URL and REDIS_URL are required');
  process.exit(1);
}

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  connectTimeout: 20000,
});

const client = new Client({
  connectionString: process.env.PG_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await redis.ping();
  let cursor = '0';
  let deleted = 0;

  do {
    const [next, keys] = await redis.scan(
      cursor,
      'MATCH',
      `*${WS_ID}*`,
      'COUNT',
      500,
    );
    cursor = next;
    if (keys.length > 0) {
      deleted += await redis.del(...keys);
    }
  } while (cursor !== '0');

  console.log(`redis deleted ${deleted} keys for workspace ${WS_ID}`);

  await client.connect();
  const bumped = await client.query(
    `UPDATE core.workspace
     SET "metadataVersion" = "metadataVersion" + 1, "updatedAt" = NOW()
     WHERE id = $1
     RETURNING "metadataVersion"`,
    [WS_ID],
  );
  console.log('metadataVersion', bumped.rows[0]);
  console.log('Restart crm-api / worker on Railway next.');
} finally {
  await redis.quit().catch(() => undefined);
  await client.end().catch(() => undefined);
}
