import { embedQuery } from '../lib/openrouter/embeddings.js'
import { presignPut } from '../lib/r2/client.js'

async function main() {
  const vector = await embedQuery('smoke test embedding')
  console.log(`embedding dimensions: ${vector.length}`)

  const uploadUrl = await presignPut({
    key: `development/smoke/${Date.now()}.pdf`,
    contentType: 'application/pdf',
    expiresInSeconds: 60,
  })

  console.log(`presigned put url length: ${uploadUrl.length}`)
  console.log('integrations ok')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
