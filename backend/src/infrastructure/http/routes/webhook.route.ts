import { Hono } from "hono";
import type { GetChatAnswerUseCase } from "../../../application/use-cases/get-chat-answer.use-case";
import { telegramAuth } from "../middleware/telegram-auth";

interface TelegramMessage {
  message?: {
    text?: string;
    chat?: { id: number };
  };
}

export function webhookRoutes(
  getChatAnswer: GetChatAnswerUseCase,
): Hono {
  const router = new Hono();

  router.post("/telegram", telegramAuth, async (c) => {
    const body = (await c.req.json()) as TelegramMessage;
    const text = body.message?.text;

    if (!text) {
      return c.json({ error: { code: "BAD_REQUEST", message: "Missing message text" } }, 400);
    }

    const result = await getChatAnswer.execute(text);
    return c.json(result);
  });

  return router;
}
