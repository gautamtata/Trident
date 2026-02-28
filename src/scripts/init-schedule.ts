/**
 * Registers the QStash cron schedule for the digest endpoint.
 *
 * Run after deploy:
 *   APP_URL=https://your-app.vercel.app npm run init-schedule
 *
 * Idempotent — uses a fixed scheduleId so re-running overwrites the existing schedule.
 */

import 'dotenv/config';
import { Client } from '@upstash/qstash';
import { digestConfig } from '../lib/digest-config';

const SCHEDULE_ID = 'digest-weekly';

async function main() {
  const token = process.env.QSTASH_TOKEN;
  const appUrl = process.env.APP_URL;

  if (!token) {
    console.error('[init] Missing QSTASH_TOKEN env var');
    process.exit(1);
  }
  if (!appUrl) {
    console.error('[init] Missing APP_URL env var (e.g. https://your-app.vercel.app)');
    process.exit(1);
  }

  const destination = `${appUrl}/api/digest`;
  const cron = `CRON_TZ=${digestConfig.timezone} ${digestConfig.cron}`;

  console.log('[init] Registering QStash schedule...');
  console.log(`[init]   destination: ${destination}`);
  console.log(`[init]   cron: ${cron}`);
  console.log(`[init]   recipients: ${digestConfig.recipients.join(', ')}`);

  const client = new Client({ token });

  const schedule = await client.schedules.create({
    destination,
    cron,
    scheduleId: SCHEDULE_ID,
  });

  console.log('[init] Schedule registered successfully:', schedule);
  process.exit(0);
}

main().catch((err) => {
  console.error('[init] Fatal error:', err);
  process.exit(1);
});
