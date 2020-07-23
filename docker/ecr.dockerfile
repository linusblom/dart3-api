FROM node:12.4-alpine

ARG PORT
ARG ENV
ARG DATABASE_URL
ARG AWS_ACCESS_KEY
ARG AWS_SECRET_KEY
ARG AWS_REGION
ARG AUTH0_CLIENT_ID
ARG AUTH0_CLIENT_SECRET
ARG AUTH0_URL
ARG AUTH0_AUDIENCE

ENV PORT=$PORT
ENV ENV=$ENV
ENV DATABASE_URL=$DATABASE_URL
ENV AWS_ACCESS_KEY=$AWS_ACCESS_KEY
ENV AWS_SECRET_KEY=$AWS_SECRET_KEY
ENV AWS_REGION=$AWS_REGION
ENV AUTH0_CLIENT_ID=$AUTH0_CLIENT_ID
ENV AUTH0_CLIENT_SECRET=$AUTH0_CLIENT_SECRET
ENV AUTH0_URL=$AUTH0_URL
ENV AUTH0_AUDIENCE=$AUTH0_AUDIENCE

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