FROM node:18.12
# Create app directory
WORKDIR /usr/src/app
ADD package*.json ./
RUN npm install
# Bundle app source
ADD  . .
CMD [ "node", "app.js" ]