import { Router } from 'express';
import { StorageController } from '../controllers/storage.controller';
import multer from 'multer';

export const createStorageRouter = (): Router => {
  const router = Router();
  const controller = new StorageController();
  
  // Use memory storage to supply a buffer directly to our providers (Sharp, S3, ImageKit)
  const upload = multer({ storage: multer.memoryStorage() });

  router.post('/ticket', controller.getUploadTicket.bind(controller));
  router.post('/upload', upload.single('file'), controller.uploadFile.bind(controller));

  return router;
};
