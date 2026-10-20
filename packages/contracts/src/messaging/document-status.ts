import { z } from 'zod'

export const DOCUMENT_STATUS_CHANNEL = 'document.status.updated'

export const documentStatusEventSchema = z
  .object({
    type: z.literal('document.status.updated'),
    documentId: z.string().min(1),
    botId: z.string().min(1),
    status: z.enum(['READY', 'FAILED']),
    updatedAt: z.string().datetime(),
  })
  .strict()

export type DocumentStatusEvent = z.infer<typeof documentStatusEventSchema>
export type ProcessedDocumentStatus = DocumentStatusEvent['status']
