FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN apk add --no-cache bash \
    && npm install --production \
    && npm install -g typescript pm2 @nestjs/cli

COPY . .
RUN npm run build

EXPOSE 3000

ENV WORKER_ID=worker-1
CMD ["node", "dist/app.js"]
