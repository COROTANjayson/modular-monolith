import { IStorageProvider, UploadTicket } from './storage.interface';
import ImageKit from 'imagekit';
import * as crypto from 'crypto';
import { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } from '../../../shared/utils/config';

export class ImageKitProvider implements IStorageProvider {
  private imagekit: ImageKit;

  constructor() {
    this.imagekit = new ImageKit({
      publicKey: IMAGEKIT_PUBLIC_KEY || '',
      privateKey: IMAGEKIT_PRIVATE_KEY || '',
      urlEndpoint: IMAGEKIT_URL_ENDPOINT || '',
    });
  }

  async uploadFile(file: Buffer, filename: string, mimeType: string, folder?: string): Promise<{ url: string; fileId: string; }> {
    const response = await this.imagekit.upload({
      file: file,
      fileName: filename,
      folder: folder || '/',
      useUniqueFileName: true,
    });

    return {
      url: response.url,
      fileId: response.fileId,
    };
  }

  async createUploadTicket(filename: string, mimeType: string, folder?: string): Promise<UploadTicket> {
    const auth = this.imagekit.getAuthenticationParameters();
    
    const uploadUrl = 'https://upload.imagekit.io/api/v1/files/upload';
    const predictedFileId = crypto.randomUUID(); 

    return {
      url: uploadUrl,
      method: 'POST',
      fields: {
        token: auth.token,
        expire: auth.expire.toString(),
        signature: auth.signature,
        publicKey: IMAGEKIT_PUBLIC_KEY || '',
        fileName: filename,
        useUniqueFileName: 'true',
        folder: folder || '/',
      },
      fileUrl: '', 
      fileId: predictedFileId,
    };
  }

  async deleteFile(fileId: string): Promise<boolean> {
    try {
      await this.imagekit.deleteFile(fileId);
      return true;
    } catch (error) {
      console.error('Error deleting file from ImageKit:', error);
      return false;
    }
  }
}
