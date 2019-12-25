From node:11.15.0-alpine

WORKDIR /app

COPY package.json .

COPY yarn.lock .

RUN yarn # --production

COPY . .

RUN yarn run build

ENV PORT=8080

EXPOSE 8080

CMD npm run prod