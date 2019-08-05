# Install Polymer CLI, https://www.polymer-project.org/3.0/docs/tools/polymer-cli
FROM node:11

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
RUN npm install -g polymer-cli --unsafe-perm
WORKDIR /home/node/app
COPY . .
COPY --chown=node:node . .
RUN npm install 
USER node
RUN npm run-script build
