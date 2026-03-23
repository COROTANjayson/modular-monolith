import { IStorageProvider } from './storage.interface';
import { S3Provider } from './s3.provider';
import { ImageKitProvider } from './imagekit.provider';
import { STORAGE_PROVIDER } from '../../../shared/utils/config';

class StorageFactory {
  private static instance: IStorageProvider;

  public static getProvider(): IStorageProvider {
    if (this.instance) {
      return this.instance;
    }

    const providerType = STORAGE_PROVIDER?.toLowerCase();

    switch (providerType) {
      case 's3':
        console.log('📦 Initializing S3 Storage Provider');
        this.instance = new S3Provider();
        break;
      case 'imagekit':
        console.log('🖼️ Initializing ImageKit Storage Provider');
        this.instance = new ImageKitProvider();
        break;
      default:
        console.warn('⚠️ No STORAGE_PROVIDER defined in environment, defaulting to ImageKit');
        this.instance = new ImageKitProvider();
        break;
    }

    return this.instance;
  }
}

export const storageService = StorageFactory.getProvider();
