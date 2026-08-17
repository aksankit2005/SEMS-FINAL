import { v2 as cloudinary } from 'cloudinary';
import { envConfig } from '../config/env.js';

// Configure Cloudinary on backend
cloudinary.config({
  cloud_name: envConfig.cloudinaryCloudName,
  api_key: envConfig.cloudinaryApiKey,
  api_secret: envConfig.cloudinaryApiSecret,
  secure: true,
});

/**
 * Generates an authenticated signed payload for client-side uploads.
 * Ensures the API secret never leaves the server.
 */
export const generateUploadSignature = (customFolder = null) => {
  if (!envConfig.cloudinaryCloudName || !envConfig.cloudinaryApiKey || !envConfig.cloudinaryApiSecret) {
    throw new Error('Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not configured on the server.');
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = customFolder || envConfig.cloudinaryFolder || 'sems_gallery';

  const paramsToSign = {
    timestamp,
    folder,
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, envConfig.cloudinaryApiSecret);

  return {
    signature,
    timestamp,
    folder,
    apiKey: envConfig.cloudinaryApiKey,
    cloudName: envConfig.cloudinaryCloudName,
  };
};

/**
 * Delete a single media asset from Cloudinary.
 * @param {string} publicId - The Cloudinary public_id of the file.
 * @param {string} resourceType - 'image' or 'video' (default: 'image')
 */
export const deleteCloudinaryAsset = async (publicId, resourceType = 'image') => {
  if (!publicId) return null;
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType.toLowerCase() === 'video' ? 'video' : 'image',
      invalidate: true,
    });
    console.log(`🗑️ [Cloudinary Delete] Asset ${publicId} (${resourceType}):`, result.result);
    return result;
  } catch (err) {
    console.error(`⚠️ [Cloudinary Delete Error] Failed to delete ${publicId}:`, err.message);
    return null;
  }
};

/**
 * Batch delete multiple assets from Cloudinary.
 * @param {Array<{ publicId: string, resourceType?: string }>} items
 */
export const deleteCloudinaryBatch = async (items) => {
  if (!items || items.length === 0) return;

  const imageIds = items
    .filter((i) => !i.resourceType || i.resourceType.toLowerCase() === 'image')
    .map((i) => i.publicId)
    .filter(Boolean);

  const videoIds = items
    .filter((i) => i.resourceType && i.resourceType.toLowerCase() === 'video')
    .map((i) => i.publicId)
    .filter(Boolean);

  const promises = [];

  if (imageIds.length > 0) {
    promises.push(
      cloudinary.api.delete_resources(imageIds, { resource_type: 'image', invalidate: true })
        .catch((e) => console.error('Cloudinary Batch Image Delete Error:', e.message))
    );
  }

  if (videoIds.length > 0) {
    promises.push(
      cloudinary.api.delete_resources(videoIds, { resource_type: 'video', invalidate: true })
        .catch((e) => console.error('Cloudinary Batch Video Delete Error:', e.message))
    );
  }

  await Promise.allSettled(promises);
};

export default cloudinary;
