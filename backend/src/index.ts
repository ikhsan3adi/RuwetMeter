import app from './infrastructure/http/app'

console.log(`[RuwetMeter] Server starting on port ${app.port}`)
console.log(`[RuwetMeter] Environment: ${process.env.NODE_ENV ?? 'development'}`)

export default app
