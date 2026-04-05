window.REACT_APP_WELCOME_MESSAGE = 'Welcome to MINT';
window.REACT_APP_MODEL_CATALOG_DEFAULT_USER = 'mint@isi.edu';
// Mint Services

window.REACT_APP_DATA_CATALOG_API = 'http://datacatalog.mint.local';

window.REACT_APP_MODEL_CATALOG_API = 'http://api.models.mint.local/v2.0.0';

window.REACT_APP_GRAPHQL_ENDPOINT = 'graphql.mint.local/v1/graphql';
window.REACT_APP_GRAPHQL_ENABLE_SSL = false;

window.REACT_APP_ENSEMBLE_MANAGER_API = 'http://ensemble-manager.mint.local/v1';

window.REACT_APP_EXECUTION_COMPONENT_FROM_TAPIS = false;
window.REACT_APP_EXECUTION_COMPONENT_FROM_TAPIS_TENANT = '';

window.REACT_APP_EXECUTION_ENGINE = 'localex';

window.REACT_APP_LOCALEX_CODEDIR = '/home/node/app/data/data/code';
window.REACT_APP_LOCALEX_DATADIR = '/home/node/app/data/data/data';
window.REACT_APP_LOCALEX_TEMPDIR = '/home/node/app/data/data/temp';
window.REACT_APP_LOCALEX_LOGDIR = '/home/node/app/data/data/logs';
window.REACT_APP_LOCALEX_DATAURL = 's3://mintdata/data';
window.REACT_APP_LOCALEX_LOGURL = 's3://mintdata/logs';
window.REACT_APP_LOCALEX_PARALLEL = '';

// Google API Key
window.REACT_APP_GOOGLE_MAPS_KEY = 'AIzaSyAkRnERo4F4dy9AhdrWHAN5vdJWs0vZCgM';

//Authentications
window.REACT_APP_AUTH_PROVIDER = 'tapis';
window.REACT_APP_AUTH_SERVER = 'https://portals.tapis.io';
window.REACT_APP_AUTH_CLIENT_ID = 'mint-ui-dev';
window.REACT_APP_AUTH_TOKEN_URL = '/v3/oauth2/token';
window.REACT_APP_AUTH_AUTH_URL = '/v3/oauth2/authorize';
window.REACT_APP_AUTH_DISCOVERY_URL =
  '/v3/oauth2/.well-known/oauth-authorization-server';
window.REACT_APP_AUTH_LOGOUT_URL = '/v3/oauth2/tokens/revoke';

//Visualization and Ingestion - Not used any more - Remove ?
window.REACT_APP_VISUALIZATION_URL = '';
window.REACT_APP_INGESTION_API = '';
window.REACT_APP_AIRFLOW_API = '';
window.REACT_APP_AIRFLOW_DAG_DOWNLOAD_THREAD_ID = '';
