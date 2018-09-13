FROM node:8

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3200

CMD [ "npm", "start"]