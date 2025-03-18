# mint-ui-lit [![ui](https://github.com/mintproject/mint-ui-lit/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/mintproject/mint-ui-lit/actions/workflows/docker-publish.yml)

MINT assists analysts to easily use sophisticated simulation models and data in order to explore the role of weather and climate in water on food availability in select regions of the world. 

## Installation

The portal is connected to an Hasura GraphQL database, an execution engine and the model-catalog. You can follow the following repository to install them: [MINT installation package](https://mintproject.readthedocs.io/en/latest/admin-guide/installation/)

To connect the ui with the other services, please copy the configuration sample file

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

### Authentication

MINT-UI supports the OAuth 2.0 protocol for authorization. The authorization code grant, password grant, and implicit flow are supported for different scenarios.

To configure the autorization system you will use, you must edit the `config.js` file. 

- `REACT_APP_AUTH_GRANT`: Use `password` for the password grant, `implicit` for the implicit flow and `code` for the authorization code.
- `REACT_APP_AUTH_SERVER`: The base URI for the authentication server.
- `REACT_APP_AUTH_CLIENT_ID`: The client ID associated with MINT on the authentication server.
- `REACT_APP_AUTH_TOKEN_URL`: The path to the token API on the authentication server.
- `REACT_APP_AUTH_AUTH_URL`: The path to the authentication API on the authentication server.
- `REACT_APP_AUTH_DISCOVERY_URL`: The path to the discovery API on the authentication server.
- `REACT_APP_AUTH_LOGOUT`: The path to the logout or revoke API on the authentication server.

Optional variables:

- `REACT_APP_AUTH_PROVIDER`: For custom implementations, use `tapis` for Tapis authentication servers or `keycloak` for Keycloak authentication servers.
- `REACT_APP_AUTH_HASH`: The hash for basic authentication. Will be written in the headers as `Authorization: Basic <HASH>`. This hash value can be generated in the browser using `btoa(<username>:<password>)`.

Be sure of using the same authorization system on all your services, the access token will be send in execution and data requests.


