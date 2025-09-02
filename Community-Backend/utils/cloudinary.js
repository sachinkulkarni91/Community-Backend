// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const config = require('./config')

// Load credentials from environment variables
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key:  config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'temp/assets',
    allowed_formats: ['jpg', 'png', 'webp'],
    transformation: [{ width: 200, height: 200, crop: 'limit' }],
  },
});

const getOptimizedUrl = (publicId) => {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    secure: true,
  });
};


module.exports = {
  getOptimizedUrl,
  cloudinary,
  storage,
};
