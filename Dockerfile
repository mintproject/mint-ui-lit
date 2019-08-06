# Install Polymer CLI, https://www.polymer-project.org/3.0/docs/tools/polymer-cli
FROM node:11 AS build-env

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
RUN npm install -g polymer-cli --unsafe-perm
WORKDIR /home/node/app
COPY . .
COPY --chown=node:node . .
RUN npm install 
USER node
RUN npm run-script build

VOLUME /home/node/app

FROM nginx:1.13.0-alpine
WORKDIR /usr/share/nginx/html
COPY --from=build-env /home/node/app/build/es6-bundled ./

EXPOSE 80
