# Install Polymer CLI, https://www.polymer-project.org/3.0/docs/tools/polymer-cli
FROM node:14 AS build-env

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package.json .
COPY yarn.lock .
RUN yarn install

COPY --chown=node:node . .
USER node
RUN yarn build

VOLUME /home/node/app

FROM nginx:1.13.0-alpine
WORKDIR /usr/share/nginx/html
COPY --from=build-env /home/node/app/build/ ./
RUN sed -i "s/es6\///g" index.html
COPY default.conf /etc/nginx/conf.d/
EXPOSE 80
