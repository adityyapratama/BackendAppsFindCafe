import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (buffer: any, options: any = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'cafe-surabaya', resource_type: 'image', ...options },
      (error: any, result: any) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

const deleteFromCloudinary = (publicId: string) => {
  return cloudinary.uploader.destroy(publicId);
};

export { cloudinary, uploadToCloudinary, deleteFromCloudinary };
