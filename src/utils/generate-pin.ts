export const generatePin = () =>
  process.env.ENV === 'development'
    ? '1111'
    : (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
