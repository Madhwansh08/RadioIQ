const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Helper function to upload file to S3
const uploadToS3 = async (file, folder = '') => {
  if (!file || !file.path || !file.originalname) {
    throw new Error('Invalid file object');
  }

  const fileStream = fs.createReadStream(file.path);
  const fileExt = path.extname(file.originalname).toLowerCase();
  const isDicom = fileExt === '.dicom' || fileExt === '.dcm';

  // Generate a unique key using uuidv4
  const key = folder
    ? `${folder}/${uuidv4()}-${file.originalname}`
    : `${uuidv4()}-${file.originalname}`;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: fileStream,
      ContentType: isDicom ? 'application/dicom' : file.mimetype, // Set correct Content-Type
    },
  });

  try {
    const result = await upload.done();
    return {
      url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`,
      key: key,
    };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

module.exports = {
  s3Client,
  uploadToS3,
};
