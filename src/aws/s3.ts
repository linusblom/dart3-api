import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';

const s3 = new AWS.S3({ region: 'eu-north-1' });

const allowedFileTypes = {
  '47494638': { mime: 'image/gif', extension: 'gif' },
  '89504e47': { mime: 'image/png', extension: 'png' },
  ffd8ffe0: { mime: 'image/jpeg', extension: 'jpg' },
  ffd8ffe1: { mime: 'image/jpeg', extension: 'jpg' },
  ffd8ffe2: { mime: 'image/jpeg', extension: 'jpg' },
  ffd8ffe3: { mime: 'image/jpeg', extension: 'jpg' },
  ffd8ffe8: { mime: 'image/jpeg', extension: 'jpg' },
  ffd8ffdb: { mime: 'image/jpeg', extension: 'jpg' },
};

export const uploadFile = async (userId: string, file: any) => {
  const header = file.buffer
    .slice(0, 4)
    .reduce((acc, buffer) => `${acc}${buffer.toString(16)}`, '');

  const fileType = allowedFileTypes[header];

  if (!fileType || fileType.mime !== file.mimetype) {
    throw new Error('Unsupported media type');
  }

  const params = {
    Bucket: 'images.dart3.app',
    Key: `${userId.replace('auth0|', '')}/${nanoid(6)}.${fileType.extension}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const response = await s3.upload(params).promise();

  return `https://images.dart3.app/${response.Key}`;
};
