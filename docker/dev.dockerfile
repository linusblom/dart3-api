FROM node:14.16.1-alpine
RUN apk upgrade musl

RUN mkdir /app
WORKDIR /app
COPY . /app

ENTRYPOINT ["./scripts/start.sh"]
