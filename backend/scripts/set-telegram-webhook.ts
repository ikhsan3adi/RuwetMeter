import { config } from '../src/config'

const TELEGRAM_API_BASE = 'https://api.telegram.org'

async function main() {
  const botToken = config.TELEGRAM_BOT_TOKEN
  const secretToken = config.TELEGRAM_WEBHOOK_SECRET

  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN is not configured in .env')
    process.exit(1)
  }

  const webhookUrl = process.argv[2]
  if (!webhookUrl) {
    console.error('Usage: bun run scripts/set-telegram-webhook.ts <WEBHOOK_URL>')
    console.error(
      'Example: bun run scripts/set-telegram-webhook.ts https://xxxx.ngrok-free.app/api/v1/webhook/telegram',
    )
    process.exit(1)
  }

  const body: Record<string, unknown> = {
    url: webhookUrl,
    allowed_updates: ['message'],
  }
  if (secretToken) {
    body.secret_token = secretToken
  }

  console.log('[Telegram] Setting webhook...')
  console.log(`  URL:         ${webhookUrl}`)
  console.log(`  Secret token: ${secretToken ? 'yes' : 'no (not configured)'}`)

  const res = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (data.ok) {
    console.log('[Telegram] Webhook set successfully!')
  } else {
    console.error(`[Telegram] Failed to set webhook: ${data.description}`)
    process.exit(1)
  }

  const infoRes = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/getWebhookInfo`)
  const infoData = (await infoRes.json()) as any
  if (infoData.ok) {
    console.log('\n[Telegram] Webhook info:')
    console.log(`  URL:           ${infoData.result.url}`)
    console.log(`  Has secret:    ${!!infoData.result.has_custom_certificate}`)
    console.log(`  Pending count: ${infoData.result.pending_update_count}`)
  }
}

main()
