import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export type VehicleMediaFolder = 'vehicles' | 'branding' | 'general';

export interface StorageUploadOptions {
  tenantId: string;
  folder: VehicleMediaFolder;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

export interface StorageUploadResult {
  objectKey: string;
  url: string;
  sizeBytes: number;
  mimeType: string;
}

export interface StorageProvider {
  upload(options: StorageUploadOptions): Promise<StorageUploadResult>;
  delete(tenantId: string, objectKey: string): Promise<boolean>;
  isKeyOwnedByTenant(tenantId: string, objectKey: string): boolean;
}

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
]);

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const APP_STORAGE_PREFIX = (process.env.STORAGE_PREFIX || 'onlycars').replace(/^\/+|\/+$/g, '') || 'onlycars';

export function sanitizeFileName(name: string): string {
  return String(name || 'imagen')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9._-]/g, '')
    .slice(-140) || 'imagen.webp';
}

export function validateImageBuffer(mimeType: string, buffer: Buffer): { valid: boolean; error?: string } {
  const mime = String(mimeType || '').toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(mime)) {
    return { valid: false, error: 'Formato no permitido. Usá JPG, PNG, WebP o AVIF.' };
  }
  if (!buffer.length || buffer.length > MAX_IMAGE_SIZE_BYTES) {
    return { valid: false, error: 'La imagen debe pesar entre 1 byte y 10 MB.' };
  }

  const ascii = buffer.subarray(0, 16).toString('ascii');
  const signatureOk =
    (mime === 'image/jpeg' || mime === 'image/jpg')
      ? buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
      : mime === 'image/png'
        ? buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
        : mime === 'image/webp'
          ? ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP'
          : mime === 'image/avif'
            ? ascii.includes('ftypavif') || ascii.includes('ftypavis')
            : false;

  return signatureOk
    ? { valid: true }
    : { valid: false, error: 'El contenido del archivo no coincide con el formato declarado.' };
}

function tenantPrefix(tenantId: string): string {
  return `${APP_STORAGE_PREFIX}/tenants/${tenantId}/`;
}

export function generateTenantObjectKey(tenantId: string, folder: VehicleMediaFolder, originalFileName: string): string {
  if (!tenantId) throw new Error('STORAGE_ERROR: tenantId es requerido.');
  const safe = sanitizeFileName(originalFileName);
  const ext = path.extname(safe) || '.webp';
  const base = path.basename(safe, ext) || 'imagen';
  const suffix = crypto.randomBytes(5).toString('hex');
  return `${tenantPrefix(tenantId)}${folder}/${Date.now()}_${suffix}_${base}${ext}`;
}

class LocalStorageProvider implements StorageProvider {
  private readonly root = path.join(process.cwd(), 'public', 'uploads');

  isKeyOwnedByTenant(tenantId: string, objectKey: string): boolean {
    return Boolean(tenantId && objectKey && objectKey.startsWith(tenantPrefix(tenantId)));
  }

  async upload(options: StorageUploadOptions): Promise<StorageUploadResult> {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_LOCAL_STORAGE !== 'true') {
      throw new Error('STORAGE_ERROR: almacenamiento local deshabilitado en producción. Configurá STORAGE_PROVIDER=r2.');
    }
    const validation = validateImageBuffer(options.mimeType, options.buffer);
    if (!validation.valid) throw new Error(validation.error);

    const objectKey = generateTenantObjectKey(options.tenantId, options.folder, options.fileName);
    const target = path.join(this.root, ...objectKey.split('/'));
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, options.buffer);
    return {
      objectKey,
      url: `/uploads/${objectKey}`,
      sizeBytes: options.buffer.length,
      mimeType: options.mimeType.toLowerCase(),
    };
  }

  async delete(tenantId: string, objectKey: string): Promise<boolean> {
    if (!this.isKeyOwnedByTenant(tenantId, objectKey)) throw new Error('STORAGE_FORBIDDEN: objeto fuera del tenant.');
    const target = path.join(this.root, ...objectKey.split('/'));
    try {
      await fs.unlink(target);
      return true;
    } catch (error: any) {
      if (error?.code === 'ENOENT') return true;
      throw error;
    }
  }
}

function sha256Hex(value: Buffer | string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function hmac(key: Buffer | string, value: string): Buffer {
  return crypto.createHmac('sha256', key).update(value).digest();
}

function encodeObjectPath(value: string): string {
  return value.split('/').map((part) => encodeURIComponent(part)).join('/');
}

function toFetchBody(buffer: Buffer): ArrayBuffer {
  const bytes = new Uint8Array(buffer.length);
  bytes.set(buffer);
  return bytes.buffer;
}

/**
 * Cliente mínimo AWS Signature V4 para Cloudflare R2.
 * Mantiene el mismo contrato/env de OnlyFood sin sumar una dependencia pesada al runtime.
 */
class R2StorageProvider implements StorageProvider {
  private readonly endpoint: URL;
  private readonly bucket: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly publicBase: string;

  constructor() {
    const endpoint = process.env.R2_ENDPOINT || process.env.S3_ENDPOINT || '';
    this.bucket = process.env.R2_BUCKET || process.env.S3_BUCKET || '';
    this.accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID || '';
    this.secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY || '';
    this.publicBase = (process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_CDN_URL || '').replace(/\/$/, '');

    if (!endpoint || !this.bucket || !this.accessKeyId || !this.secretAccessKey || !this.publicBase) {
      throw new Error('STORAGE_ERROR: faltan R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY o R2_PUBLIC_URL.');
    }
    this.endpoint = new URL(endpoint.endsWith('/') ? endpoint : `${endpoint}/`);
  }

  isKeyOwnedByTenant(tenantId: string, objectKey: string): boolean {
    return Boolean(tenantId && objectKey && objectKey.startsWith(tenantPrefix(tenantId)));
  }

  private async signedRequest(method: 'PUT' | 'DELETE', objectKey: string, body?: Buffer, mimeType?: string): Promise<Response> {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = sha256Hex(body || Buffer.alloc(0));
    const canonicalUri = `/${encodeURIComponent(this.bucket)}/${encodeObjectPath(objectKey)}`;
    const url = new URL(this.endpoint.toString());
    url.pathname = canonicalUri;

    const headers: Record<string, string> = {
      host: url.host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    };
    if (method === 'PUT') {
      headers['cache-control'] = 'public, max-age=31536000, immutable';
      headers['content-type'] = mimeType || 'application/octet-stream';
    }

    const headerNames = Object.keys(headers).sort();
    const canonicalHeaders = headerNames.map((name) => `${name}:${headers[name].trim()}\n`).join('');
    const signedHeaders = headerNames.join(';');
    const canonicalRequest = [method, canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
    const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
    const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256Hex(canonicalRequest)].join('\n');

    const kDate = hmac(`AWS4${this.secretAccessKey}`, dateStamp);
    const kRegion = hmac(kDate, 'auto');
    const kService = hmac(kRegion, 's3');
    const kSigning = hmac(kService, 'aws4_request');
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
    const authorization = `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const requestHeaders = new Headers();
    for (const [key, value] of Object.entries(headers)) if (key !== 'host') requestHeaders.set(key, value);
    requestHeaders.set('Authorization', authorization);

    const requestBody = method === 'PUT' && body ? toFetchBody(body) : undefined;
    return fetch(url, { method, headers: requestHeaders, body: requestBody });
  }

  async upload(options: StorageUploadOptions): Promise<StorageUploadResult> {
    const validation = validateImageBuffer(options.mimeType, options.buffer);
    if (!validation.valid) throw new Error(validation.error);

    const objectKey = generateTenantObjectKey(options.tenantId, options.folder, options.fileName);
    const response = await this.signedRequest('PUT', objectKey, options.buffer, options.mimeType.toLowerCase());
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`STORAGE_ERROR: R2 rechazó la subida (${response.status})${detail ? `: ${detail.slice(0, 240)}` : ''}`);
    }

    return {
      objectKey,
      url: `${this.publicBase}/${objectKey}`,
      sizeBytes: options.buffer.length,
      mimeType: options.mimeType.toLowerCase(),
    };
  }

  async delete(tenantId: string, objectKey: string): Promise<boolean> {
    if (!this.isKeyOwnedByTenant(tenantId, objectKey)) throw new Error('STORAGE_FORBIDDEN: objeto fuera del tenant.');
    const response = await this.signedRequest('DELETE', objectKey);
    if (!response.ok && response.status !== 404) {
      throw new Error(`STORAGE_ERROR: R2 rechazó el borrado (${response.status}).`);
    }
    return true;
  }
}

let cachedProvider: StorageProvider | null = null;

export function getObjectStorage(): StorageProvider {
  if (cachedProvider) return cachedProvider;
  const provider = String(process.env.STORAGE_PROVIDER || 'local').toLowerCase();
  cachedProvider = provider === 'r2' || provider === 's3' ? new R2StorageProvider() : new LocalStorageProvider();
  return cachedProvider;
}
