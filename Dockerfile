FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY src ./src
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY .env ./

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
