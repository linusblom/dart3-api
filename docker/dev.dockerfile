FROM node:12.4-alpine
RUN mkdir /app
WORKDIR /app
COPY package.json package.json
COPY yarn.lock yarn.lock
RUN npm install -g yarn
RUN yarn && mv node_modules /node_modules
COPY . .
CMD yarn dev