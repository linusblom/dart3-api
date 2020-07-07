FROM node:12.4-alpine

ARG PORT
ARG ENV
ARG DATABASE_URL
ARG AWS_ACCESS_KEY
ARG AWS_SECRET_KEY
ARG AWS_REGION
ARG AUTH0_CLIENT_ID
ARG AUTH0_CLIENT_SECRET
ARG AUTH0_API_AUDIENCE
ARG AUTH0_API_URL
ARG AUTH0_OAUTH_URL

RUN mkdir /app
WORKDIR /app
COPY package.json /app
COPY yarn.lock /app
RUN yarn
COPY . /app
RUN yarn build
RUN yarn install --prod
COPY ./src/database/sql /app/dist/database/sql

CMD ["node", "dist/app.js"]