/**
 * Registers the Trigger.dev schedule for the daily-digest task.
 *
 * Run after every deploy:
 *   npx tsx src/scripts/init-schedule.ts
 *
 * This is idempotent — the deduplicationKey prevents duplicate schedules.
 */

import 'dotenv/config';
import { schedules } from '@trigger.dev/sdk/v3';
import { digestConfig } from '../lib/digest-config';

async function main() {
  console.log('[init] Registering schedule with Trigger.dev...');
  console.log(`[init]   cron: ${digestConfig.cron}`);
  console.log(`[init]   timezone: ${digestConfig.timezone}`);
  console.log(`[init]   recipients: ${digestConfig.recipients.join(', ')}`);

  const schedule = await schedules.create({
    task: 'daily-digest',
    cron: digestConfig.cron,
    timezone: digestConfig.timezone,
    deduplicationKey: 'user-digest-schedule',
  });

  console.log('[init] Schedule registered successfully:', schedule);
  process.exit(0);
}

main().catch((err) => {
  console.error('[init] Fatal error:', err);
  process.exit(1);
});
