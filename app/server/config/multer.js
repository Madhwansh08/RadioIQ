const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Temporary folder for uploads
  },
  filename: (req, file, cb) => {
    // Generate a unique filename using uuidv4 and preserve the original filename
    cb(null, `${uuidv4()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, and JPG are allowed."), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
