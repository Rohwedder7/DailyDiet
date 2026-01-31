import { app } from './app.js'
import { env } from './env/index.js'

const PORT = env.PORT || 3333

app
  .listen({
    port: PORT,
    host: '0.0.0.0',
  })
  .then(() => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`)
  })
  .catch((err) => {
    console.error('Error starting server:', err)
    process.exit(1)
  })
