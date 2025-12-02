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
 * 
 * Files are automatically compressed to max 2MB while maintaining quality
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
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
const MAX_UNCOMPRESSED_SIZE = 10 * 1024 * 1024; // 10MB - reject files larger than this even before compression
const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB - maximum size for localStorage (base64 increases size by ~33%)

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Compress image file to target size while maintaining quality
 * @param file - The image file to compress
 * @param maxSizeInBytes - Maximum file size in bytes (default 2MB)
 * @returns Compressed file
 */
async function compressImage(file: File, maxSizeInBytes: number = MAX_FILE_SIZE): Promise<File> {
  // If file is already smaller than max size, return as-is
  if (file.size <= maxSizeInBytes) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate initial scale to get close to target size
        const scaleFactor = Math.sqrt(maxSizeInBytes / file.size);
        width *= scaleFactor;
        height *= scaleFactor;
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels to hit target size
        const quality = 0.9;
        const compressedBlob: Blob | null = null;
        
        const tryCompress = (q: number) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                if (blob.size <= maxSizeInBytes || q <= 0.1) {
                  // Successfully compressed or reached minimum quality
                  const compressedFile = new File([blob], file.name, {
                    type: file.type,
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  // Try lower quality
                  tryCompress(q - 0.1);
                }
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            file.type,
            q
          );
        };
        
        tryCompress(quality);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
  });
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
 * Files are automatically compressed if they exceed MAX_FILE_SIZE (2MB)
 * @param file - The file to upload
 * @param folder - Optional folder path in S3 bucket (e.g., 'store-photos', 'products')
 * @returns Upload result with URL or error
 */
export async function uploadFileToS3(
  file: File,
  folder: string = 'uploads'
): Promise<UploadResult> {
  try {
    // Check if file is too large (before compression)
    if (file.size > MAX_UNCOMPRESSED_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      const maxSizeMB = (MAX_UNCOMPRESSED_SIZE / 1024 / 1024).toFixed(0);
      throw new Error(`File size (${sizeMB}MB) exceeds maximum allowed size of ${maxSizeMB}MB. Please choose a smaller image.`);
    }
    
    // Compress image if it's an image file
    let processedFile = file;
    if (file.type.startsWith('image/')) {
      console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      processedFile = await compressImage(file);
      console.log(`Compressed file size: ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`);
      
      // Check if compressed file is still too large for localStorage (in development)
      if (isDevelopment && processedFile.size > MAX_STORAGE_SIZE) {
        const sizeMB = (processedFile.size / 1024 / 1024).toFixed(2);
        const maxSizeMB = (MAX_STORAGE_SIZE / 1024 / 1024).toFixed(0);
        throw new Error(`Compressed image (${sizeMB}MB) is still too large for storage (max ${maxSizeMB}MB). Please choose a smaller or lower quality image.`);
      }
    }

    // Development mode - use localStorage with cleanup
    if (isDevelopment) {
      const dataURL = await fileToDataURL(processedFile);
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = processedFile.name.split('.').pop();
      const storageKey = `${folder}/${timestamp}-${randomString}.${fileExtension}`;
      
      try {
        // Clean up old images if storage is getting full
        const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(folder));
        
        // If we have more than 10 images in this folder, remove the oldest ones
        if (storageKeys.length > 10) {
          const sortedKeys = storageKeys.sort();
          const keysToRemove = sortedKeys.slice(0, storageKeys.length - 10);
          keysToRemove.forEach(key => localStorage.removeItem(key));
          console.log(`[DEV] Cleaned up ${keysToRemove.length} old images from localStorage`);
        }
        
        // Store in localStorage
        localStorage.setItem(storageKey, dataURL);
        console.log(`[DEV] File stored in localStorage: ${storageKey}`);
      } catch (error) {
        // If quota exceeded, clear all images from this folder and try again
        console.warn('[DEV] localStorage quota exceeded, clearing old images...');
        const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(folder));
        storageKeys.forEach(key => localStorage.removeItem(key));
        
        // Try storing again after cleanup
        try {
          localStorage.setItem(storageKey, dataURL);
          console.log(`[DEV] File stored in localStorage after cleanup: ${storageKey}`);
        } catch (retryError) {
          console.error('[DEV] Failed to store file even after cleanup:', retryError);
          // Image is too large even after cleanup
          throw new Error('Failed to upload image: File is too large for storage. Please use a smaller image (recommended: under 2MB).');
        }
      }
      
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
    const arrayBuffer = await fileToArrayBuffer(processedFile);
    const buffer = new Uint8Array(arrayBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = processedFile.name.split('.').pop();
    const fileName = `${folder}/${timestamp}-${randomString}.${fileExtension}`;

    // Prepare upload parameters
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: processedFile.type,
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
