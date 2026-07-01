import type {
  TelegramServicePort,
  TelegramSendMessageParams,
} from '../../application/ports/telegram-service.port'
import { config } from '../../config'

const TELEGRAM_API_BASE = 'https://api.telegram.org'

export class TelegramService implements TelegramServicePort {
  private botToken: string

  constructor() {
    this.botToken = config.TELEGRAM_BOT_TOKEN
    if (!this.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured')
    }
  }

  async sendChatAction(chatId: number, action: 'typing'): Promise<void> {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${this.botToken}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[TelegramService] Failed to send chat action:', {
        chatId,
        action,
        status: res.status,
        error: err,
      })
    }
  }

  async sendMessage(params: TelegramSendMessageParams): Promise<void> {
    const { chatId, text, parseMode } = params

    const body: Record<string, unknown> = {
      chat_id: chatId,
      text,
    }
    if (parseMode) {
      body.parse_mode = parseMode
    }

    const res = await fetch(`${TELEGRAM_API_BASE}/bot${this.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[TelegramService] Failed to send message:', {
        chatId,
        status: res.status,
        error: err,
      })
      throw new Error(`Telegram API error (${res.status}): ${err}`)
    }
  }
}
