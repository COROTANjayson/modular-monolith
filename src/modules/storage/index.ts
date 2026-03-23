import { createStorageRouter } from './routes/storage.routes';

export const createStorageModule = () => {
  const router = createStorageRouter();
  return { router };
};
