FROM node:12.4-alpine
RUN mkdir /app
WORKDIR /app
COPY package.json /app
COPY yarn.lock /app
RUN yarn
RUN yarn build
RUN yarn install --prod
COPY . /app