import axios from 'axios';

// Cloudinary Configuration Credentials
export const CLOUDINARY_CONFIG = {
  cloudName: localStorage.getItem('sems_cloudinary_cloud') || 'lnrkt6qp',
  apiKey: '996182763949582',
  apiSecret: 'qKiT0FnkGNvtjBveU3Tu_psg2QI',
  uploadPreset: localStorage.getItem('sems_cloudinary_preset') || 'ml_default',
};

// Generates SHA-1 signature for authenticated Cloudinary upload using Web Crypto API
const generateCloudinarySignature = async (timestamp, apiSecret) => {
  const strToSign = `timestamp=${timestamp}${apiSecret}`;
  const msgBuffer = new TextEncoder().encode(strToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Directly uploads an image or video file from computer to Cloudinary using Signed Authentication.
 * Guaranteed to upload into Cloudinary Media Library without preset errors.
 * @param {File} file - The file object from <input type="file">
 * @param {Function} onProgress - Callback receiving (progressPercent: number)
 * @returns {Promise<{ url: string, public_id: string, resource_type: string }>}
 */
export const uploadFileToCloudinary = async (file, onProgress = () => { }) => {
  if (!file) throw new Error('No file selected for upload.');

  const cloudName = localStorage.getItem('sems_cloudinary_cloud') || CLOUDINARY_CONFIG.cloudName;
  const apiKey = CLOUDINARY_CONFIG.apiKey;
  const apiSecret = CLOUDINARY_CONFIG.apiSecret;

  const isVideo = file.type.startsWith('video/');
  const resourceType = isVideo ? 'video' : 'image';
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const timestamp = Math.floor(Date.now() / 1000);

  try {
    // 1. Try Signed Authenticated Upload (Uses API Key + API Secret SHA-1 Signature)
    const signature = await generateCloudinarySignature(timestamp, apiSecret);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);

    const response = await axios.post(uploadUrl, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    console.log('✅ Authenticated Cloudinary Upload Success:', response.data.secure_url);

    return {
      url: response.data.secure_url || response.data.url,
      public_id: response.data.public_id,
      resource_type: response.data.resource_type || resourceType,
      format: response.data.format,
      bytes: response.data.bytes,
    };
  } catch (signedErr) {
    console.warn('Signed Cloudinary upload failed, attempting unsigned presets...', signedErr.response?.data?.error?.message || signedErr.message);

    // 2. Unsigned Preset Fallback
    const presetsToTry = ['ml_default', 'lnrkt6qp', 'unsigned_preset', 'sems_preset'];
    for (const preset of presetsToTry) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', preset);
        formData.append('api_key', apiKey);

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
        };
      } catch (presetErr) {
        // try next
      }
    }

    const errMsg = signedErr.response?.data?.error?.message || 'Cloudinary upload failed.';
    throw new Error(errMsg);
  }
};

/**
 * Uploads multiple files (images/videos) in batch to Cloudinary using Signed Authentication
 * @param {File[]} files - Array of File objects
 * @param {Function} onBatchProgress - Callback receiving ({ completedCount, totalCount, currentPercent })
 * @returns {Promise<Array<{ url: string, resource_type: string, fileOriginalName: string }>>}
 */
export const uploadMultipleFilesToCloudinary = async (files, onBatchProgress = () => { }) => {
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
    });

    results.push({
      url: uploadRes.url,
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
