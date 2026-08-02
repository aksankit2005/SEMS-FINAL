/**
 * High-performance client-side image compression & optimization.
 * Resizes large camera photos to max 1920px width/height while preserving
 * sharp visual quality and reducing file size by 80-95% for ultra-fast uploads.
 */
export const compressImageBeforeUpload = (file, maxDimension = 1920, quality = 0.88) => {
  return new Promise((resolve) => {
    // If it's a video or non-image, return original file directly
    if (!file || !file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    // If file is already small (< 500KB), return original file without compression
    if (file.size <= 500 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio preserving dimensions
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Use high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // If compressed blob is somehow larger or failed, return original
              resolve(file);
            } else {
              // Create compressed File object preserving original name
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = e.target?.result;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};
