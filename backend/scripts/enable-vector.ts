import { enableVectorExtension } from '../src/infrastructure/database/enable-vector'

await enableVectorExtension()
console.log('[DB] vector extension enabled.')
process.exit(0)
