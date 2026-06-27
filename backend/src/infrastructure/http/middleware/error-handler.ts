import type { Context } from 'hono'

export function errorHandler(err: Error, c: Context) {
  console.error('[HTTP Error]', {
    method: c.req.method,
    path: c.req.path,
    error: err.message,
    stack: err.stack,
  })

  if (err.message.includes('ScoreDimension')) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: err.message } }, 400)
  }

  return c.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
      },
    },
    500,
  )
}
