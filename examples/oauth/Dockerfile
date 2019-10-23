From node:11.15.0-alpine

WORKDIR /app

COPY package.json .

RUN npm i

COPY . .

RUN npm run build

ENV PORT=8080

EXPOSE 8080

CMD ["npm", "run", "prod"]