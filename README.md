# mint-ui-lit [![Build Status](https://travis-ci.com/mintproject/mint-ui-lit.svg?branch=master)](https://travis-ci.com/mintproject/mint-ui-lit)

MINT assists analysts to easily use sophisticated simulation models and data in order to explore the role of weather and climate in water on food availability in select regions of the world. 

## Installation

The portal is connected to an Hasura GraphQL database, an execution engine and the model-catalog. You can follow the following repository to install them: [MINT installation package](https://mintproject.readthedocs.io/en/latest/admin-guide/installation/)

To connect the ui with the other servicesm, please copy the configuration sample file `./src/config/config.json.sample`

```bash
$ cp config.js ./src/assets
```


### Using Docker 

Build the image

```
$ docker build -t mint_ui .
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





