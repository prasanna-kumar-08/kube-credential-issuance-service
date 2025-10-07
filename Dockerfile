FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 3000

ENV WORKER_ID=worker-1
CMD ["node", "dist/app.js"]
