import axios from 'axios';
import { galleryApi } from './galleryApi';

/**
 * Uploads an image or video file to Cloudinary using backend-signed authentication.
 * Never exposes the Cloudinary API Secret to the client browser.
 * @param {File} file - The file object from <input type="file">
 * @param {Function} onProgress - Callback receiving (progressPercent: number)
 * @param {string} folder - Custom Cloudinary folder name
 * @returns {Promise<{ url: string, public_id: string, resource_type: string, bytes?: number }>}
 */
export const uploadFileToCloudinary = async (file, onProgress = () => { }, folder = 'sems_gallery') => {
  if (!file) throw new Error('No file selected for upload.');

  const isVideo = file.type.startsWith('video/');
  const resourceType = isVideo ? 'video' : 'image';

  // 1. Obtain authenticated upload signature from backend
  const authData = await galleryApi.getCloudinarySignature(folder);
  const { signature, timestamp, apiKey, cloudName, folder: targetFolder } = authData;

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  if (targetFolder) {
    formData.append('folder', targetFolder);
  }

  try {
    const response = await axios.post(uploadUrl, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    return {
      url: response.data.secure_url || response.data.url,
      public_id: response.data.public_id,
      resource_type: response.data.resource_type || resourceType,
      format: response.data.format,
      bytes: response.data.bytes,
    };
  } catch (err) {
    const errMsg = err.response?.data?.error?.message || err.message || 'Cloudinary upload failed.';
    console.error('Cloudinary Upload Error:', errMsg);
    throw new Error(`Upload Failed: ${errMsg}`);
  }
};

/**
 * Uploads multiple files (images/videos) in batch to Cloudinary using signed authentication
 * @param {File[]} files - Array of File objects
 * @param {Function} onBatchProgress - Callback receiving ({ completedCount, totalCount, currentPercent, currentFileName, overallPercent })
 * @param {string} folder - Custom Cloudinary folder name
 * @returns {Promise<Array<{ url: string, public_id: string, resource_type: string, fileOriginalName: string }>>}
 */
export const uploadMultipleFilesToCloudinary = async (files, onBatchProgress = () => { }, folder = 'sems_gallery') => {
  if (!files || files.length === 0) return [];

  const results = [];
  const totalCount = files.length;

  for (let i = 0; i < totalCount; i++) {
    const file = files[i];
    const uploadRes = await uploadFileToCloudinary(file, (filePercent) => {
      onBatchProgress({
        completedCount: i,
        totalCount,
        currentFileIndex: i + 1,
        currentFileName: file.name,
        filePercent,
        overallPercent: Math.round(((i + filePercent / 100) / totalCount) * 100),
      });
    }, folder);

    results.push({
      url: uploadRes.url,
      public_id: uploadRes.public_id,
      resource_type: uploadRes.resource_type,
      fileOriginalName: file.name,
    });
  }

  onBatchProgress({
    completedCount: totalCount,
    totalCount,
    currentFileIndex: totalCount,
    overallPercent: 100,
  });

  return results;
};
