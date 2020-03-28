import AWS from 'aws-sdk';

const { AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_REGION } = process.env;

AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_KEY,
  region: AWS_REGION,
});

const ses = new AWS.SES({ apiVersion: '2010-12-01' });

export const sendEmail = async (
  to: string,
  message: { subject: string; html: string; text: string },
) => {
  const params = {
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: message.html,
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
    ReturnPath: 'dart3@linusblom.io',
    Source: 'dart3@linusblom.io',
  };

  return await ses.sendEmail(params).promise();
};

export const generateWelcomeEmail = (name: string, pin: string) => ({
  subject: 'Welcome to Dart3',
  html: `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <style type="text/css" data-premailer="ignore">
      body {
        font-family: Verdana, Geneva, Tahoma, sans-serif;
      }
    </style>
  </head>
  <body>
    <h1>Welcome ${name}!</h1>
    Your PIN code is ${pin}.
  </body>
</html>
`,
  text: `Welcome ${name}!\nYour PIN code is ${pin}.`,
});

export const generateResetPinEmail = (name: string, pin: string) => ({
  subject: 'New PIN code',
  html: `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <style type="text/css" data-premailer="ignore">
      body {
        font-family: Verdana, Geneva, Tahoma, sans-serif;
      }
    </style>
  </head>
  <body>
    <h1>Hi ${name}!</h1>
    Your new PIN code is ${pin}.
  </body>
</html>
`,
  text: `Hi ${name}!\nYour new PIN code is ${pin}.`,
});
