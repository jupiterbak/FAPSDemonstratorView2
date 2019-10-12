FROM node:9

WORKDIR /app

COPY package.json .
RUN npm install
RUN npm install --save amqplib

COPY . .

USER node
EXPOSE 3000

CMD ["npm", "start"]