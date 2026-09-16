import { createWriteStream } from 'node:fs'
import { mkdir, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Transform } from 'node:stream'

import { INGESTION_CONFIG } from '../../config/ingestion.js'
import { IngestionError } from '../../lib/errors/ingestion-error.js'
import { getObjectStream } from '../../lib/r2/client.js'

export async function downloadSourceToTemp(input: {
  r2ObjectKey: string
  sourceId: string
}): Promise<string> {
  const dir = join(tmpdir(), 'training-ia-ingest')
  await mkdir(dir, { recursive: true })
  const filePath = join(dir, `${input.sourceId}.pdf`)

  try {
    const stream = await getObjectStream(input.r2ObjectKey)
    let totalBytes = 0

    const limiter = new Transform({
      transform(chunk, _encoding, callback) {
        totalBytes += chunk.length
        if (totalBytes > INGESTION_CONFIG.maxPdfBytes) {
          callback(new IngestionError('R2_DOWNLOAD_FAILED'))
          return
        }
        callback(null, chunk)
      },
    })

    await pipeline(stream, limiter, createWriteStream(filePath))
    return filePath
  } catch (error) {
    await unlink(filePath).catch(() => undefined)
    if (error instanceof IngestionError) {
      throw error
    }
    throw new IngestionError('R2_DOWNLOAD_FAILED', error)
  }
}

export async function removeTempFile(filePath: string): Promise<void> {
  await unlink(filePath).catch(() => undefined)
}
