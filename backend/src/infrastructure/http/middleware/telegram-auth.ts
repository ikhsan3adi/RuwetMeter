import type { Context, Next } from 'hono'
import { config } from '../../../config'

export async function telegramAuth(c: Context, next: Next) {
  const token = c.req.header('x-telegram-bot-api-secret-token')
  if (token !== config.TELEGRAM_WEBHOOK_SECRET) {
    return c.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid webhook token.',
        },
      },
      401,
    )
  }
  return next()
}
