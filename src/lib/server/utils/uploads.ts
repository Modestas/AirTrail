import { env } from '$env/dynamic/private';

import * as fs from 'node:fs';
import * as path from 'node:path';

export const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/svg+xml',
  'image/webp',
];
export const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.svg', '.webp'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

class UploadManager {
  #uploadLocation: string | null = null;
  #useVercelBlob: boolean = false;
  #isConfigured: boolean = false;
  #isReady: boolean = false;

  async init(): Promise<void> {
    if (env.BLOB_READ_WRITE_TOKEN) {
      this.#useVercelBlob = true;
      this.#isConfigured = true;
      this.#isReady = true;
      console.log('Upload storage: Vercel Blob');
      return;
    }

    this.#uploadLocation = env.UPLOAD_LOCATION || null;

    if (!this.#uploadLocation) {
      console.warn('UPLOAD_LOCATION not set. File uploads will be disabled.');
      return;
    }

    this.#isConfigured = true;

    try {
      if (!fs.existsSync(this.#uploadLocation)) {
        console.warn(
          `UPLOAD_LOCATION "${this.#uploadLocation}" does not exist. File uploads will fail.`,
        );
        return;
      }

      const testFile = path.join(this.#uploadLocation, '.write_test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);

      this.#isReady = true;
      console.log(`Upload storage: filesystem (${this.#uploadLocation})`);
    } catch (err) {
      console.warn(
        `UPLOAD_LOCATION "${this.#uploadLocation}" is not readable/writable. File uploads will fail.`,
        err,
      );
    }
  }

  get isConfigured(): boolean {
    return this.#isConfigured;
  }

  get isReady(): boolean {
    return this.#isReady;
  }

  get uploadLocation(): string | null {
    return this.#uploadLocation;
  }

  getFilePath(relativePath: string): string | null {
    if (!this.#uploadLocation) return null;
    return path.join(this.#uploadLocation, relativePath);
  }

  /**
   * Save a file. Returns the path/URL to store in the database, or null on failure.
   * - Filesystem: returns the relative path (e.g. "airlines/1.png")
   * - Vercel Blob: returns the full blob URL
   */
  async saveFile(
    relativePath: string,
    data: Buffer | Uint8Array,
  ): Promise<string | null> {
    if (!this.#isReady) return null;

    if (this.#useVercelBlob) {
      const { put } = await import('@vercel/blob');
      const blob = await put(relativePath, data, {
        access: 'public',
        addRandomSuffix: false,
      });
      return blob.url;
    }

    if (!this.#uploadLocation) return null;

    const fullPath = path.join(this.#uploadLocation, relativePath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, data);
    return relativePath;
  }

  async deleteFile(storedPath: string): Promise<boolean> {
    if (!this.#isReady) return false;

    if (this.#useVercelBlob) {
      const { del } = await import('@vercel/blob');
      await del(storedPath);
      return true;
    }

    if (!this.#uploadLocation) return false;

    const fullPath = path.join(this.#uploadLocation, storedPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  }

  fileExists(storedPath: string): boolean {
    // Vercel Blob URLs are always assumed valid (no local check possible)
    if (this.#useVercelBlob) return true;
    if (!this.#uploadLocation) return false;
    return fs.existsSync(path.join(this.#uploadLocation, storedPath));
  }
}

export const uploadManager = new UploadManager();
