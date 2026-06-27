import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { GetChatAnswerUseCase } from '../../../application/use-cases/get-chat-answer.use-case'
import { rateLimiter } from '../middleware/rate-limiter'

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  session_id: z.string().optional(),
})

export function chatRoutes(getChatAnswer: GetChatAnswerUseCase): Hono {
  const router = new Hono()

  router.post('/', rateLimiter(), zValidator('json', chatSchema), async (c) => {
    const { message } = c.req.valid('json')
    const result = await getChatAnswer.execute(message)
    return c.json(result)
  })

  return router
}
