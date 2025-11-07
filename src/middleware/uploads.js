// middleware/uploads.js
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(), // <— THIS is the important part
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10,
  },
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'), false);
    }
    cb(null, true);
  },
});

// name "images" must match <input name="images">
module.exports = {
  uploadProductImages: upload.array('images', 10),
};
