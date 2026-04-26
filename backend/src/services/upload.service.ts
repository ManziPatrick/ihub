import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Generates a signature for client-side uploads to Cloudinary
 * @param folder The folder to upload to (optional)
 * @returns Object containing the signature, timestamp, and cloud name
 */
export const generateUploadSignature = (folder: string = 'ihub-academy', resourceType?: string) => {
    const timestamp = Math.round((new Date()).getTime() / 1000);

    const params: any = {
        timestamp,
        folder,
    };

    // If resourceType is specified and not 'auto', include it in signed params
    // Cloudinary requires this for the signature to match if it's sent in the body
    if (resourceType && resourceType !== 'auto') {
        params.resource_type = resourceType;
    }

    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);

    return {
        signature,
        timestamp,
        folder,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY
    };
};

export default {
    generateUploadSignature,
};
