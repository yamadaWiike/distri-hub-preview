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

// Validate S3 configuration in production
if (!isDevelopment) {
  const requiredEnvVars = {
    VITE_AWS_DEFAULT_REGION: import.meta.env.VITE_AWS_DEFAULT_REGION,
    VITE_AWS_ACCESS_KEY_ID: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    VITE_AWS_SECRET_ACCESS_KEY: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
    VITE_AWS_BUCKET: import.meta.env.VITE_AWS_BUCKET,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('❌ Missing required S3 environment variables:', missingVars.join(', '));
  } else {
    console.log('✅ S3 configuration loaded:', {
      region: import.meta.env.VITE_AWS_DEFAULT_REGION,
      bucket: import.meta.env.VITE_AWS_BUCKET,
      hasAccessKey: !!import.meta.env.VITE_AWS_ACCESS_KEY_ID,
      hasSecretKey: !!import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
    });
  }
}

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
const MAX_STORAGE_SIZE = 2 * 1024 * 1024; // 2MB - maximum size for localStorage (base64 increases size by ~33%, so this gives us ~2.7MB max in base64)

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
  // For development localStorage, use more aggressive compression
  const targetSize = isDevelopment ? Math.min(maxSizeInBytes, 1.5 * 1024 * 1024) : maxSizeInBytes; // 1.5MB max for dev
  
  // If file is already smaller than target size, return as-is
  if (file.size <= targetSize) {
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
        
        // More aggressive scaling for localStorage
        let scaleFactor = Math.sqrt(targetSize / file.size);
        
        // Additional size reduction for very large images in development
        if (isDevelopment && file.size > 3 * 1024 * 1024) {
          scaleFactor *= 0.8; // Extra 20% reduction for localStorage
        }
        
        width *= scaleFactor;
        height *= scaleFactor;
        
        // Ensure minimum reasonable dimensions
        const minDimension = 200;
        const maxDimension = isDevelopment ? 1200 : 1600;
        
        if (width < minDimension || height < minDimension) {
          const scale = minDimension / Math.min(width, height);
          width *= scale;
          height *= scale;
        }
        
        if (width > maxDimension || height > maxDimension) {
          const scale = maxDimension / Math.max(width, height);
          width *= scale;
          height *= scale;
        }
        
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Start with lower quality for development to save storage space
        const startingQuality = isDevelopment ? 0.7 : 0.9;
        
        const tryCompress = (q: number) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                if (blob.size <= targetSize || q <= 0.1) {
                  // Successfully compressed or reached minimum quality
                  const compressedFile = new File([blob], file.name, {
                    type: file.type === 'image/png' ? 'image/jpeg' : file.type, // Convert PNG to JPEG for better compression
                    lastModified: Date.now(),
                  });
                  
                  console.log(`Compression result: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB (${(compressedFile.size / file.size * 100).toFixed(1)}%)`);
                  resolve(compressedFile);
                } else {
                  // Try lower quality
                  tryCompress(Math.max(0.1, q - 0.1));
                }
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            file.type === 'image/png' ? 'image/jpeg' : file.type, // Convert PNG to JPEG for better compression
            q
          );
        };
        
        tryCompress(startingQuality);
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
    // Check if SKU deletion is in progress and prevent uploads that might interfere
    const windowWithFlags = window as Window & { __skuDeletionInProgress?: boolean };
    if (windowWithFlags.__skuDeletionInProgress) {
      console.warn('Upload blocked: SKU deletion in progress');
      return {
        success: false,
        error: 'Upload temporarily blocked due to system operation in progress. Please try again in a moment.'
      };
    }
    
    // Check if file is too large (before compression)
    if (file.size > MAX_UNCOMPRESSED_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      const maxSizeMB = (MAX_UNCOMPRESSED_SIZE / 1024 / 1024).toFixed(0);
      throw new Error(`File size (${sizeMB}MB) exceeds maximum allowed size of ${maxSizeMB}MB. Please choose a smaller image.`);
    }
    
    // Compress image if it's an image file BEFORE any localStorage operations
    let processedFile = file;
    if (file.type.startsWith('image/')) {
      console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      
      // Compress first to avoid localStorage quota issues
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
      // Clean up old images BEFORE processing the new one
      const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(folder));
      
      // More aggressive cleanup - keep only 5 most recent images
      if (storageKeys.length > 5) {
        const sortedKeys = storageKeys.sort();
        const keysToRemove = sortedKeys.slice(0, storageKeys.length - 5);
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn(`Failed to remove key: ${key}`, e);
          }
        });
        console.log(`[DEV] Cleaned up ${keysToRemove.length} old images from localStorage`);
      }
      
      // Also clean up any non-folder specific old files to free space
      const allKeys = Object.keys(localStorage);
      const imageKeys = allKeys.filter(key => 
        key.includes('-') && 
        (key.endsWith('.jpg') || key.endsWith('.jpeg') || key.endsWith('.png') || key.endsWith('.webp'))
      );
      if (imageKeys.length > 20) {
        const sortedImageKeys = imageKeys.sort();
        const keysToRemove = sortedImageKeys.slice(0, imageKeys.length - 20);
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn(`Failed to remove image key: ${key}`, e);
          }
        });
        console.log(`[DEV] Cleaned up ${keysToRemove.length} old image files from localStorage`);
      }
      
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = processedFile.name.split('.').pop();
      const storageKey = `${folder}/${timestamp}-${randomString}.${fileExtension}`;
      
      try {
        // Convert to data URL only AFTER compression and cleanup
        const dataURL = await fileToDataURL(processedFile);
        
        // Validate data URL before storing
        if (!dataURL || !dataURL.startsWith('data:')) {
          throw new Error('Invalid data URL generated');
        }
        
        // Store in localStorage
        localStorage.setItem(storageKey, dataURL);
        console.log(`[DEV] File stored in localStorage: ${storageKey} (${(dataURL.length / 1024).toFixed(2)}KB)`);
      } catch (error) {
        console.error('[DEV] Failed to store file in localStorage:', error);
        
        // If still fails, do emergency cleanup and try one more time
        console.warn('[DEV] Doing emergency localStorage cleanup...');
        try {
          // Clear all image-related items
          const allStorageKeys = Object.keys(localStorage);
          const imageStorageKeys = allStorageKeys.filter(key => 
            key.includes('/') || key.includes('-') && 
            (key.endsWith('.jpg') || key.endsWith('.jpeg') || key.endsWith('.png') || key.endsWith('.webp'))
          );
          imageStorageKeys.forEach(key => {
            try {
              localStorage.removeItem(key);
            } catch (e) {
              console.warn(`Failed to remove storage key: ${key}`, e);
            }
          });
          
          // Try one more time after emergency cleanup
          const dataURL = await fileToDataURL(processedFile);
          localStorage.setItem(storageKey, dataURL);
          console.log(`[DEV] File stored in localStorage after emergency cleanup: ${storageKey}`);
        } catch (retryError) {
          console.error('[DEV] Failed to store file even after emergency cleanup:', retryError);
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

    // Validate S3 configuration
    if (!BUCKET_NAME) {
      throw new Error('S3 bucket name is not configured. Please check VITE_AWS_BUCKET environment variable.');
    }

    if (!import.meta.env.VITE_AWS_DEFAULT_REGION) {
      throw new Error('AWS region is not configured. Please check VITE_AWS_DEFAULT_REGION environment variable.');
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await fileToArrayBuffer(processedFile);
    const buffer = new Uint8Array(arrayBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = processedFile.name.split('.').pop();
    const fileName = `${folder}/${timestamp}-${randomString}.${fileExtension}`;

    console.log('📤 Uploading to S3:', {
      bucket: BUCKET_NAME,
      key: fileName,
      size: `${(processedFile.size / 1024).toFixed(2)}KB`,
      type: processedFile.type,
    });

    // Prepare upload parameters (removed ACL - relying on bucket policy instead)
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: processedFile.type,
      // Note: ACL removed - ensure your S3 bucket has proper bucket policy for public access
      // or configure based on your security requirements
    };

    // Upload to S3
    try {
      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);
      console.log('✅ Successfully uploaded to S3:', fileName);
    } catch (s3Error) {
      console.error('❌ S3 upload failed:', s3Error);
      
      // Provide more specific error messages
      if (s3Error instanceof Error) {
        if (s3Error.message.includes('AccessDenied')) {
          throw new Error('Access denied to S3 bucket. Please check AWS credentials and bucket permissions.');
        } else if (s3Error.message.includes('NoSuchBucket')) {
          throw new Error(`S3 bucket '${BUCKET_NAME}' does not exist or is not accessible.`);
        } else if (s3Error.message.includes('InvalidAccessKeyId')) {
          throw new Error('Invalid AWS Access Key ID. Please check your credentials.');
        } else if (s3Error.message.includes('SignatureDoesNotMatch')) {
          throw new Error('Invalid AWS Secret Access Key. Please check your credentials.');
        }
      }
      
      throw s3Error;
    }

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
  if (!storageKey) {
    console.warn('getImageUrl: No storage key provided');
    return null;
  }
  
  console.log('getImageUrl called with:', storageKey);
  console.log('isDevelopment:', isDevelopment);
  
  // Development mode - retrieve from localStorage
  if (isDevelopment && !storageKey.startsWith('http')) {
    console.log('Development mode: Retrieving from localStorage');
    const dataURL = localStorage.getItem(storageKey);
    console.log('Retrieved data URL length:', dataURL?.length || 0);
    
    if (!dataURL) {
      console.error('Failed to retrieve data URL from localStorage for key:', storageKey);
      console.log('Available localStorage keys:', Object.keys(localStorage).filter(k => k.includes(storageKey.split('/')[0])));
      return null;
    }
    
    // Validate the stored data URL
    if (!dataURL.startsWith('data:')) {
      console.error(`[DEV] Invalid data URL format in localStorage: ${storageKey}`);
      localStorage.removeItem(storageKey); // Clean up invalid data
      return null;
    }
    
    console.log(`[DEV] Successfully retrieved valid data URL from localStorage: ${storageKey} (${(dataURL.length / 1024).toFixed(2)}KB)`);
    return dataURL;
  }
  
  // Production mode - return S3 URL as-is
  console.log('Production mode: Returning S3 URL as-is');
  return storageKey;
}

