FROM node:12.4-alpine
RUN mkdir /app
WORKDIR /app
COPY package.json /app
COPY yarn.lock /app
RUN yarn install --prod
RUN yarn build
COPY . /app