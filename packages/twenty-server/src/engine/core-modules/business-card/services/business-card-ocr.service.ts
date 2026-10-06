import { existsSync } from 'fs';
import { join } from 'path';

import { Injectable, Logger } from '@nestjs/common';

import { createWorker } from 'tesseract.js';

const resolveTesseractLangPath = (): string => {
  const candidates = [
    join(process.cwd(), 'vendor', 'tesseract-lang'),
    join(process.cwd(), 'packages', 'twenty-server', 'vendor', 'tesseract-lang'),
  ];

  const resolved = candidates.find((candidatePath) =>
    existsSync(join(candidatePath, 'eng.traineddata.gz')),
  );

  if (!resolved) {
    throw new Error(
      'Tesseract language data missing. Run: bash packages/twenty-server/scripts/setup-tesseract-vendor.sh',
    );
  }

  return resolved;
};

@Injectable()
export class BusinessCardOcrService {
  private readonly logger = new Logger(BusinessCardOcrService.name);

  async recognizeText(imageBuffer: Buffer): Promise<string> {
    const langPath = resolveTesseractLangPath();

    // Keep language data local — createWorker defaults to CDN fetches
    const worker = await createWorker('eng', 1, {
      langPath,
      cachePath: langPath,
      gzip: true,
    });

    try {
      const result = await worker.recognize(imageBuffer);
      return result.data.text ?? '';
    } catch (error) {
      this.logger.error('Business card OCR failed', error);
      throw error;
    } finally {
      await worker.terminate();
    }
  }
}
