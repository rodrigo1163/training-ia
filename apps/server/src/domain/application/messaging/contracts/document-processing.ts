import { z } from 'zod'

export const DOCUMENT_PROCESSING_QUEUE = 'document.processing'

export const documentProcessingMessageSchema = z
  .object({
    documentId: z.string().min(1),
    contentVersion: z.number().int().nonnegative().nullable(),
  })
  .strict()

export type DocumentProcessingMessage = z.infer<
  typeof documentProcessingMessageSchema
>
