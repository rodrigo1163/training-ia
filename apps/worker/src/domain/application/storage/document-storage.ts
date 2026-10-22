export interface DownloadDocumentParams {
  key: string;
}

export interface DownloadDocumentResult {
  body: Buffer;
  contentType?: string;
}

export abstract class DocumentStorage {
  abstract download(
    params: DownloadDocumentParams,
  ): Promise<DownloadDocumentResult>;
}
