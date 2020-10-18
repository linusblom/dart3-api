import AWS from 'aws-sdk';

const { AWS_ACCESS_KEY, AWS_SECRET_KEY } = process.env;

AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_KEY,
  region: 'eu-west-1',
});

const ses = new AWS.SES({ apiVersion: '2010-12-01' });

export const sendEmail = async (
  to: string,
  message: { subject: string; body: string; text: string },
) => {
  const params = {
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: `<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><style type="text/css" data-premailer="ignore">body{font-family: Helvetica, Arial, sans-serif !important; font-size: 13px;}</style></head><body>${message.body}</body></html>`,
        },
        Text: {
          Charset: 'UTF-8',
          Data: message.text,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: message.subject,
      },
    },
    ReturnPath: 'noreply@dart3.app',
    Source: 'noreply@dart3.app',
  };

  return await ses.sendEmail(params).promise();
};

export const generateWelcomeEmail = (name: string, pin: string) => ({
  subject: 'Welcome to Dart3',
  body: `<h2>Welcome ${name}!</h2>Your PIN code is ${pin}.`,
  text: `Welcome ${name}!\nYour PIN code is ${pin}.`,
});

export const generateResetPinEmail = (name: string, pin: string) => ({
  subject: 'New PIN code',
  body: `<h2>Hi ${name}!</h2>Your new PIN code is ${pin}.`,
  text: `Hi ${name}!\nYour new PIN code is ${pin}.`,
});

export const generateDisablePinEmail = (name: string) => ({
  subject: 'PIN code disabled',
  body: `<h2>Hi ${name}!</h2>Your PIN code has been disabled on your Dart3 player account. If this was requested by you, ignore this email, otherwise please login and reset your PIN code.`,
  text: `Hi ${name}!\nYour PIN code has been disabled on your Dart3 player account. If this was requested by you, ignore this email, otherwise please login and reset your PIN code.`,
});
