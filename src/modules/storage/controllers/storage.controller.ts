import { Request, Response } from 'express';
import { storageService } from '../services/storage.factory';
import { compressServerImage } from '../utils/server-image-utils';

export class StorageController {
  async getUploadTicket(req: Request, res: Response): Promise<void> {
    try {
      const { filename, mimeType, folder } = req.body;

      if (!filename || !mimeType) {
        res.status(400).json({ error: 'Filename and mimeType are required' });
        return;
      }

      const ticket = await storageService.createUploadTicket(filename, mimeType, folder);
      res.json(ticket);
    } catch (error: any) {
      console.error('Storage ticket error:', error);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  }

  async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file provided in form data.' });
        return;
      }

      let buffer = req.file.buffer;
      let finalMimeType = req.file.mimetype;
      const folder = req.body.folder;

      // Optional Server-Side compression for common images
      if (req.file.mimetype.startsWith('image/') && !['image/svg+xml', 'image/gif'].includes(req.file.mimetype)) {
        buffer = await compressServerImage(buffer);
        finalMimeType = 'image/webp';
      }

      const { url, fileId } = await storageService.uploadFile(
        buffer,
        req.file.originalname,
        finalMimeType,
        folder
      );

      res.json({ url, fileId });
    } catch (error: any) {
      console.error('Storage upload error:', error);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  }
}
