export interface UploadTicket {
  url: string;
  method: 'PUT' | 'POST';
  fields?: Record<string, string>;
  headers?: Record<string, string>;
  fileUrl: string;
  fileId: string;
}

export interface IStorageProvider {
  uploadFile(file: Buffer, filename: string, mimeType: string, folder?: string): Promise<{ url: string, fileId: string }>;
  createUploadTicket(filename: string, mimeType: string, folder?: string): Promise<UploadTicket>;
  deleteFile(fileId: string): Promise<boolean>;
}
