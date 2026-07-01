import { Hono } from 'hono'
import type { GetChatAnswerUseCase } from '../../../application/use-cases/get-chat-answer.use-case'
import type { TelegramServicePort } from '../../../application/ports/telegram-service.port'
import { telegramAuth } from '../middleware/telegram-auth'

interface TelegramMessage {
  message?: {
    text?: string
    chat?: { id: number }
  }
}

export function webhookRoutes(
  getChatAnswer: GetChatAnswerUseCase,
  telegramService: TelegramServicePort,
): Hono {
  const router = new Hono()

  router.post('/telegram', telegramAuth, async (c) => {
    const body = (await c.req.json()) as TelegramMessage
    const text = body.message?.text
    const chatId = body.message?.chat?.id

    if (!text) {
      return c.json({ error: { code: 'BAD_REQUEST', message: 'Missing message text' } }, 400)
    }

    if (!chatId) {
      return c.json({ error: { code: 'BAD_REQUEST', message: 'Missing chat id' } }, 400)
    }

    try {
      await telegramService.sendChatAction(chatId, 'typing')
      const result = await getChatAnswer.execute(text)
      await telegramService.sendMessage({ chatId, text: result.reply })
      return c.json({ ok: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[Telegram Webhook] Error processing message:', {
        chatId,
        text,
        error: message,
      })

      try {
        await telegramService.sendMessage({
          chatId,
          text: 'Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi.',
        })
      } catch {
        // silent — already logged above
      }

      return c.json({ ok: false, error: message }, 500)
    }
  })

  return router
}
