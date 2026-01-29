import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OcrCacheService {
  private readonly logger = new Logger(OcrCacheService.name);
  private cacheDir = path.join(process.cwd(), '.ocr-cache');

  constructor() {
    this.initializeCacheDir();
  }

  private initializeCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      this.logger.log('OCR cache directory initialized');
    }
  }

  /**
   * Calculate SHA256 hash of file buffer
   */
  calculateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Get cached OCR result if exists
   */
  getCachedResult(fileHash: string): any | null {
    try {
      const cachePath = path.join(this.cacheDir, `${fileHash}.json`);
      
      if (fs.existsSync(cachePath)) {
        const cached = fs.readFileSync(cachePath, 'utf-8');
        this.logger.debug(`Cache hit for hash: ${fileHash}`);
        return JSON.parse(cached);
      }

      return null;
    } catch (error: any) {
      this.logger.error(`Error reading cache: ${error?.message}`);
      return null;
    }
  }

  /**
   * Save OCR result to cache
   */
  saveCachedResult(fileHash: string, result: any): void {
    try {
      const cachePath = path.join(this.cacheDir, `${fileHash}.json`);
      fs.writeFileSync(cachePath, JSON.stringify(result, null, 2));
      this.logger.log(`Cached OCR result for hash: ${fileHash}`);
    } catch (error: any) {
      this.logger.error(`Error saving cache: ${error?.message}`);
    }
  }

  /**
   * Clear cache (for testing or maintenance)
   */
  clearCache(): void {
    try {
      if (fs.existsSync(this.cacheDir)) {
        fs.rmSync(this.cacheDir, { recursive: true });
        fs.mkdirSync(this.cacheDir);
      }
      this.logger.log('OCR cache cleared');
    } catch (error: any) {
      this.logger.error(`Error clearing cache: ${error?.message}`);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    try {
      const files = fs.readdirSync(this.cacheDir);
      const stats = {
        totalCached: files.length,
        cacheDir: this.cacheDir,
        files: files.slice(0, 10), // First 10 files
      };
      return stats;
    } catch (error: any) {
      this.logger.error(`Error getting cache stats: ${error?.message}`);
      return null;
    }
  }
}
