export type FileUploadStatus = "ready" | "uploading" | "success" | "error";

export type FileUploadState = {
  status: FileUploadStatus;
  progress: number;
  error?: string;
};

export type UploadResult = {
  id: string;
  status: "success" | "error";
  error?: string;
};
