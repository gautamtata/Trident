/**
 * Hardcoded digest configuration.
 * Change these values directly — no DB needed for a single config.
 */
export const digestConfig = {
  recipients: ['rktata@gmail.com', 'rktata@bechtel.com'],
  cron: '0 6 * * 1', // Every Monday at 6:00 AM
  timezone: 'Asia/Kolkata',
  maxArticlesPerDigest: 15,
} as const;
