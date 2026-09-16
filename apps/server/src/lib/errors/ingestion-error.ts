export type IngestionErrorCode =
  | 'SOURCE_NOT_FOUND'
  | 'INVALID_PDF_SIGNATURE'
  | 'PDF_WITHOUT_TEXT'
  | 'PDF_TOO_MANY_PAGES'
  | 'PDF_TOO_MUCH_TEXT'
  | 'TOO_MANY_CHUNKS'
  | 'VERSION_CONFLICT'
  | 'R2_DOWNLOAD_FAILED'
  | 'OPENROUTER_EMBEDDING_FAILED'
  | 'CLAIM_LOST'

const PERMANENT_CODES = new Set<IngestionErrorCode>([
  'SOURCE_NOT_FOUND',
  'INVALID_PDF_SIGNATURE',
  'PDF_WITHOUT_TEXT',
  'PDF_TOO_MANY_PAGES',
  'PDF_TOO_MUCH_TEXT',
  'TOO_MANY_CHUNKS',
  'VERSION_CONFLICT',
  'CLAIM_LOST',
])

const PUBLIC_MESSAGES: Record<IngestionErrorCode, string> = {
  SOURCE_NOT_FOUND: 'Fonte não encontrada',
  INVALID_PDF_SIGNATURE: 'Arquivo PDF inválido',
  PDF_WITHOUT_TEXT: 'PDF sem texto extraível',
  PDF_TOO_MANY_PAGES: 'PDF excede o limite de páginas',
  PDF_TOO_MUCH_TEXT: 'PDF excede o limite de texto',
  TOO_MANY_CHUNKS: 'PDF gera demasiados fragmentos',
  VERSION_CONFLICT: 'Versão desatualizada do processamento',
  R2_DOWNLOAD_FAILED: 'Falha ao baixar o arquivo',
  OPENROUTER_EMBEDDING_FAILED: 'Falha ao gerar embeddings',
  CLAIM_LOST: 'Processamento assumido por outra execução',
}

export class IngestionError extends Error {
  readonly code: IngestionErrorCode
  readonly publicMessage: string
  readonly retryable: boolean

  constructor(code: IngestionErrorCode, cause?: unknown) {
    super(PUBLIC_MESSAGES[code])
    this.name = 'IngestionError'
    this.code = code
    this.publicMessage = PUBLIC_MESSAGES[code]
    this.retryable = !PERMANENT_CODES.has(code)
    if (cause !== undefined) {
      this.cause = cause
    }
  }
}

export function isPermanentIngestionError(error: unknown): error is IngestionError {
  return error instanceof IngestionError && !error.retryable
}
