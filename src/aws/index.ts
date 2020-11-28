import AWS from 'aws-sdk';

const { AWS_ACCESS_KEY, AWS_SECRET_KEY } = process.env;

AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_KEY,
});

AWS.config.apiVersions = {
  s3: '2006-03-01',
  ses: '2010-12-01',
};

export * from './ses';
export * from './s3';
