import { describe, test, expect } from 'bun:test'
import { Hono } from 'hono'
import type { GetChatAnswerUseCase } from '../../../src/application/use-cases/get-chat-answer.use-case'
import { chatRoutes } from '../../../src/infrastructure/http/routes/chat.route'

describe('POST /api/v1/chat', () => {
  function createApp(chat: GetChatAnswerUseCase) {
    const app = new Hono().basePath('/api/v1')
    app.route('/chat', chatRoutes(chat))
    return app
  }

  test('returns 200 with valid message', async () => {
    const chatUC = {
      execute: (question: string) =>
        Promise.resolve({ reply: `Answer to: ${question}`, sources: [] }),
    } as unknown as unknown as GetChatAnswerUseCase

    const app = createApp(chatUC)
    const res = await app.request('http://localhost/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is happening?' }),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.reply).toBe('Answer to: What is happening?')
  })

  test('returns 400 with empty message', async () => {
    const chatUC = {
      execute: () => Promise.resolve({ reply: '', sources: [] }),
    } as unknown as GetChatAnswerUseCase
    const app = createApp(chatUC)

    const res = await app.request('http://localhost/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '' }),
    })

    expect(res.status).toBe(400)
  })

  test('returns 400 without message field', async () => {
    const chatUC = {
      execute: () => Promise.resolve({ reply: '', sources: [] }),
    } as unknown as GetChatAnswerUseCase
    const app = createApp(chatUC)

    const res = await app.request('http://localhost/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(400)
  })
})
