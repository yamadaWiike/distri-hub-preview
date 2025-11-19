/**
 * File Upload Utility
 * 
 * Development Mode: Files are stored in browser localStorage as base64 data URLs
 * Production Mode: Files are uploaded to AWS S3 bucket
 * 
 * This dual approach allows for:
 * - No AWS credentials needed in development
 * - No CORS configuration needed for local testing
 * - Seamless transition to S3 in production
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const isDevelopment = import.meta.env.MODE === 'development';

const s3Client = !isDevelopment ? new S3Client({
  region: import.meta.env.VITE_AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
}) : null;

const BUCKET_NAME = import.meta.env.VITE_AWS_BUCKET;

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Convert File to Data URL for local storage (development)
 */
async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as Data URL'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Convert File to ArrayBuffer for AWS SDK
 */
async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Upload a file to S3 (production) or save to localStorage (development)
 * @param file - The file to upload
 * @param folder - Optional folder path in S3 bucket (e.g., 'store-photos', 'products')
 * @returns Upload result with URL or error
 */
export async function uploadFileToS3(
  file: File,
  folder: string = 'uploads'
): Promise<UploadResult> {
  try {
    // Development mode - use localStorage
    if (isDevelopment) {
      const dataURL = await fileToDataURL(file);
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const storageKey = `${folder}/${timestamp}-${randomString}.${fileExtension}`;
      
      // Store in localStorage
      localStorage.setItem(storageKey, dataURL);
      
      console.log(`[DEV] File stored in localStorage: ${storageKey}`);
      
      return {
        success: true,
        url: storageKey, // Return the storage key as URL for development
      };
    }

    // Production mode - upload to S3
    if (!s3Client) {
      throw new Error('S3 client not initialized');
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await fileToArrayBuffer(file);
    const buffer = new Uint8Array(arrayBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${folder}/${timestamp}-${randomString}.${fileExtension}`;

    // Prepare upload parameters
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read' as const,
    };

    // Upload to S3
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Construct the public URL
    const url = `https://${BUCKET_NAME}.s3.${import.meta.env.VITE_AWS_DEFAULT_REGION}.amazonaws.com/${fileName}`;

    return {
      success: true,
      url,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Upload store photo specifically
 * @param file - The photo file to upload
 * @returns Upload result with URL or error
 */
export async function uploadStorePhoto(file: File): Promise<UploadResult> {
  return uploadFileToS3(file, 'store-photos');
}

/**
 * Upload product image
 * @param file - The product image file to upload
 * @returns Upload result with URL or error
 */
export async function uploadProductImage(file: File): Promise<UploadResult> {
  return uploadFileToS3(file, 'product-images');
}

/**
 * Get image URL - retrieves from localStorage in development or returns S3 URL in production
 * @param storageKey - The storage key (development) or S3 URL (production)
 * @returns The actual URL or data URL to display
 */
export function getImageUrl(storageKey: string | null | undefined): string | null {
  if (!storageKey) return null;
  
  // Development mode - retrieve from localStorage
  if (isDevelopment && !storageKey.startsWith('http')) {
    const dataURL = localStorage.getItem(storageKey);
    return dataURL || null;
  }
  
  // Production mode - return S3 URL as-is
  return storageKey;
}
