// Cloudinary configuration — credentials are loaded from environment variables
const cloudinaryConfig = {
  cloudName:    process.env.REACT_APP_CLOUDINARY_CLOUD_NAME  || 'dbqfvmnrc',
  uploadPreset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'zahid11',
  // NOTE: apiSecret must NEVER be shipped in client-side code.
  // All uploads use an unsigned preset so no secret is required here.
};

export const cloudinary = {
  config: () => ({
    cloud: { cloudName: cloudinaryConfig.cloudName },
  }),
  url: (publicId, options = {}) => {
    const base = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload`;
    const transforms = options.transformation
      ? options.transformation
          .map(t => Object.entries(t).map(([k, v]) => `${k}_${v}`).join(','))
          .join('/')
      : 'q_auto,f_auto';
    return `${base}/${transforms}/${publicId}`;
  },
};

/**
 * Upload an image to Cloudinary using an unsigned upload preset.
 * @param {File}     file             - The file to upload.
 * @param {Function} progressCallback - Optional progress callback (0-100).
 * @returns {Promise<string>} Secure URL of the uploaded image.
 */
export const uploadToCloudinary = (file, progressCallback = () => {}) => {
  return new Promise((resolve, reject) => {
    const url      = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/upload`;
    const xhr      = new XMLHttpRequest();
    const formData = new FormData();

    xhr.open('POST', url, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        progressCallback(Math.round((e.loaded * 100) / e.total));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response.secure_url);
      } else {
        reject(new Error('Upload failed'));
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed'));

    formData.append('file',           file);
    formData.append('upload_preset',  cloudinaryConfig.uploadPreset);
    formData.append('folder',         'chat_images');

    xhr.send(formData);
  });
};

export default cloudinaryConfig;
