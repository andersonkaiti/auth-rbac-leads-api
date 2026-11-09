import { app } from '@infra/http/app.ts'
import { env } from '@shared/env.ts'

app.listen(env.PORT, () => {
  console.log(`🚀 Server running at http://localhost:${env.PORT}`)
})
