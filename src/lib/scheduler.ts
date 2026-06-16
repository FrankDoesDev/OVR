import cron from 'node-cron'
import { generateDigest } from './aggregator'
import { loadSettings } from './storage'

let initialized = false

function buildCronExpr(intervalHours: number): string {
  const valid = [2, 4, 6, 12, 24]
  const h = valid.includes(intervalHours) ? intervalHours : 6
  return `0 */${h} * * *`
}

export function startScheduler() {
  if (initialized) return
  initialized = true

  const settings = loadSettings()
  const cronExpr = buildCronExpr(settings.refreshIntervalHours)

  console.log(`[Scheduler] Starting cron jobs (every ${settings.refreshIntervalHours}h)...`)

  cron.schedule(cronExpr, async () => {
    console.log('[Scheduler] Running scheduled digest generation...')
    try {
      await generateDigest()
      console.log('[Scheduler] Digest generated successfully')
    } catch (err) {
      console.error('[Scheduler] Digest generation failed:', err)
    }
  })
}
