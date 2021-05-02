import AWS from 'aws-sdk';

const ses = new AWS.SES({ region: 'eu-west-1' });
const { ENV, CLIENT_URL } = process.env;

export const sendEmail = async (
  to: string,
  message: { subject: string; body: string; text: string },
) => {
  if (ENV === 'development') {
    console.debug(message.text);
    return Promise.resolve();
  }

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

  return ses.sendEmail(params).promise();
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

export const generateVerificationEmail = (name: string, uid: string, token: string) => ({
  subject: 'Verify your email',
  body: `<h2>Hi ${name}!</h2>Please click this link to verify your email: ${CLIENT_URL}/verify?u=${uid}&t=${token}. Link is valid for 24 hours.`,
  text: `Hi ${name}!\nPlease click this link to verify your email: ${CLIENT_URL}/verify?u=${uid}&t=${token}. Link is valid for 24 hours.`,
});
