// Middleware to detect if request is coming from admin portal
const detectAdminPortal = (req, res, next) => {
  const origin = req.get('Origin') || req.get('Referer');
  
  const adminPortals = [
    'https://community-admin-kpmg-portal.vercel.app',
    'https://community-admin-5dm3.vercel.app',
    'http://localhost:3002' // Local admin development - changed from 3001 to 3002
  ];
  
  // If request is from admin portal, mark as admin request
  if (origin && adminPortals.some(portal => origin.startsWith(portal))) {
    req.isAdminPortalRequest = true;
  }
  
  next();
};

module.exports = detectAdminPortal;
