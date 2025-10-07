FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install -D \
    @types/node \
    @types/express \
    @types/jest \
    @types/supertest

RUN npm install --production \
    && npm install -g typescript pm2 @nestjs/cli

COPY . .
RUN npm run build

EXPOSE 3000

ENV WORKER_ID=worker-1
CMD ["node", "dist/app.js"]
