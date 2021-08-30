# mint-ui-lit [![Build Status](https://travis-ci.com/mintproject/mint-ui-lit.svg?branch=master)](https://travis-ci.com/mintproject/mint-ui-lit)

MINT assists analysts to easily use sophisticated simulation models and data in order to explore the role of weather and climate in water on food availability in select regions of the world. 

## Installation

The portal is connected to an Hasura GraphQL database, an execution engine and the model-catalog. You can follow the following repository to install them: [MINT installation package](https://github.com/mintproject/installation_public)

To connect the ui with the other servicesm, please copy the configuration sample file `./src/config/config.json.sample`

```bash
$ cp ./src/config/config.json.sample ./src/config/config.json
```


### Using Docker 

Build the image

```
$ docker build  mint_ui .
```

Push the image

```bash
$ docker push mint_ui <your_username>/mint_ui
```

### Without Docker

To create the production build use:
```
yarn build
```

You can start the development server with:
```
yarn start
```

## Deploy using GitHub actions

## SERVICES

The portal is connected to an Hasura GraphQL database, an execution engine and the model-catalog.

To change the version of the model-catalog you must change it on `package.json`

To edit the configuration of other services please edit `/src/config/config.json`

## BUILDING

To create the production build use:
```
yarn build
```

```bash
gpg --symmetric --cipher-algo AES256 src/config/config-tacc.json; mv src/config/config-tacc.json.gpg . 
```

Or build the wildfire version with:
```bash
yarn create-build-wildfire
```


