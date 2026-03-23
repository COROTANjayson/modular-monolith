import { IStorageProvider, UploadTicket } from './storage.interface';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';
import { AWS_REGION, AWS_S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from '../../../shared/utils/config';

export class S3Provider implements IStorageProvider {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.region = AWS_REGION || 'us-east-1';
    this.bucketName = AWS_S3_BUCKET_NAME || '';

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID || '',
        secretAccessKey: AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  private generateUniqueFilename(filename: string, folder?: string): string {
    const ext = filename.includes('.') ? filename.split('.').pop() : '';
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const path = folder ? `${folder}/` : '';
    return ext ? `${path}${uniqueId}.${ext}` : `${path}${uniqueId}`;
  }

  async uploadFile(file: Buffer, filename: string, mimeType: string, folder?: string): Promise<{ url: string; fileId: string; }> {
    const fileId = this.generateUniqueFilename(filename, folder);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileId,
      Body: file,
      ContentType: mimeType,
    });

    await this.s3Client.send(command);

    return {
      url: `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileId}`,
      fileId,
    };
  }

  async createUploadTicket(filename: string, mimeType: string, folder?: string): Promise<UploadTicket> {
    const fileId = this.generateUniqueFilename(filename, folder);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileId,
      ContentType: mimeType,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

    return {
      url,
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
      },
      fileUrl: `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileId}`,
      fileId,
    };
  }

  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileId,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      return false;
    }
  }
}
