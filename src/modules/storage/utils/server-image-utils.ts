import sharp from 'sharp';

export async function compressServerImage(
  buffer: Buffer,
  quality: number = 80,
  maxWidth: number = 1920
): Promise<Buffer> {
  const metadata = await sharp(buffer).metadata();

  let chain = sharp(buffer);
  chain = chain.rotate();

  if (metadata.width && metadata.width > maxWidth) {
    chain = chain.resize(maxWidth, null, {
      withoutEnlargement: true,
      fit: 'inside',
    });
  }

  const format = metadata.format || 'webp';

  switch (format) {
    case 'jpeg':
    case 'jpg':
      chain = chain.jpeg({ quality, mozjpeg: true });
      break;
    case 'png':
      chain = chain.png({ quality, compressionLevel: 8 });
      break;
    default:
      chain = chain.webp({ quality });
  }

  return chain.toBuffer();
}
