require('dotenv').config()

// Get all env variables and load them into memory
const PORT = process.env.PORT
const MONGO_URI = process.env.NODE_ENV === 'test' 
  ? process.env.TEST_MONGO_URI
  : process.env.MONGO_URI

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_CALLBACK_URL= process.env.GOOGLE_CALLBACK_URL
const SECRET = process.env.SECRET
const FRONTEND_URL = process.env.FRONTEND_URL
const ADMIN_URL = process.env.ADMIN_URL
const CLOUDINARY_CLOUD_NAME= process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY=    process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET= process.env.CLOUDINARY_API_SECRET;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const EMAIL_USER = process.env.EMAIL_USER
const EMAIL_PASS = process.env.EMAIL_PASS

module.exports = { PORT, MONGO_URI, GOOGLE_CALLBACK_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SECRET, FRONTEND_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, SENDGRID_API_KEY, ADMIN_URL, EMAIL_USER, EMAIL_PASS }