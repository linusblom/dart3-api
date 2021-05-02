FROM node:12.4-alpine
RUN mkdir /sql
WORKDIR /sql
COPY sql .
RUN npm install -g pg-migrator
