import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';

const s3 = new AWS.S3({ region: 'eu-north-1' });

export const uploadFile = async (userId: string, file: any) => {
  const params = {
    Bucket: 'images.dart3.app',
    Key: `${userId.replace('auth0|', '')}/${nanoid(6)}.${file.mimetype.replace('image/', '')}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const response = await s3.upload(params).promise();

  return `https://images.dart3.app/${response.Key}`;
};
