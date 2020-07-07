FROM node:12.4-alpine
RUN mkdir /app
WORKDIR /app
COPY package.json /app
COPY yarn.lock /app
RUN yarn
COPY . /app
RUN yarn build
RUN yarn install --prod
COPY ./src/database/sql /app/dist/database/sql
