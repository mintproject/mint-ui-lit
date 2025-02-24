window.REACT_APP_WELCOME_MESSAGE = "Welcome to MINT Demo Indiana";
window.REACT_APP_MODEL_CATALOG_DEFAULT_USER= "mint@isi.edu";
// Mint Services
window.REACT_APP_CROMO_URL = "http://localhost:30001";
window.REACT_APP_DATA_CATALOG_API = "http://localhost:30002";
window.REACT_APP_MODEL_CATALOG_API = "http://localhost:30004/v1.8.0";
window.REACT_APP_ENSEMBLE_MANAGER_API = "http://localhost:30008/v1";
window.REACT_APP_GRAPHQL_ENDPOINT = "localhost:30003/v1/graphql";
window.REACT_APP_GRAPHQL_ENABLE_SSL = false;


// Google API Key
//window.REACT_APP_GOOGLE_MAPS_KEY = "AIzaSyBl8J85KibSuhHEw_j0JTlITVTBb8oXiMo";
window.REACT_APP_GOOGLE_MAPS_KEY = "AIzaSyA8-5opiA7LH7IzOMCz9n0lmO4AG88MUAU";

// TAPIS
window.REACT_APP_AUTH_PROVIDER = "tapis";
window.REACT_APP_AUTH_SERVER = "https://portals.tapis.io";
window.REACT_APP_AUTH_CLIENT_ID = "mint-ui-dev";
window.REACT_APP_AUTH_TOKEN_URL = '/v3/oauth2/tokens';
window.REACT_APP_AUTH_AUTH_URL = '/v3/oauth2/authorize';
window.REACT_APP_AUTH_DISCOVERY_URL = '/v3/oauth2/.well-known/oauth-authorization-server';
window.REACT_APP_AUTH_LOGOUT = '/v3/oauth2/tokens/revoke';
//window.REACT_APP_AUTH_HASH = '';

// Keycloak
//window.REACT_APP_AUTH_PROVIDER = "keycloak";
//window.REACT_APP_AUTH_SERVER = "https://auth.mint.isi.edu";
//window.REACT_APP_AUTH_CLIENT_ID = "mint-ui";
//window.REACT_APP_AUTH_TOKEN_URL = '/realms/production/protocol/openid-connect/token';
//window.REACT_APP_AUTH_AUTH_URL = '/realms/production/protocol/openid-connect/auth';
//window.REACT_APP_AUTH_DISCOVERY_URL = '/realms/production/.well-known/openid-configuration';
//window.REACT_APP_AUTH_LOGOUT = '/realms/master/protocol/openid-connect/logout';

//Execution - Local
window.REACT_APP_EXECUTION_ENGINE = "localex";
window.REACT_APP_LOCALEX_CODEDIR = "/data/storage/mint/localex/code";
window.REACT_APP_LOCALEX_DATADIR = "/data/storage/mint/data-catalog/production/local-execution";
window.REACT_APP_LOCALEX_DATAURL = "https://data.mint.isi.edu/files/local-execution";
window.REACT_APP_LOCALEX_LOGDIR = "/data/storage/mint/data-catalog/production/local-execution/logs";
window.REACT_APP_LOCALEX_LOGURL = "https://data.mint.isi.edu/files/local-execution/logs";
window.REACT_APP_LOCALEX_PARALLEL = 50;

//Execution - Wings
window.REACT_APP_WINGS_EXPORT_URL = "https://data.mint.isi.edu/files/wings-export";
window.REACT_APP_WINGS_STORAGE = "/data/storage/mint/data-catalog/production/wings-export";
window.REACT_APP_WINGS_DOTPATH = "/data/storage/mint/data-catalog/production/wings-export/dot";
window.REACT_APP_WINGS_ONTURL = "https://data.mint.isi.edu/files/wings-export/dot";

//Database
window.REACT_APP_GRAPHQL_ENDPOINT = "graphql.mint.isi.edu/v1/graphql";
window.REACT_APP_GRAPHQL_ENABLE_SSL = "True";

//Visualization and Ingestion - Not used any more - Remove ?
window.REACT_APP_VISUALIZATION_URL = "https://viz.mint.isi.edu";
window.REACT_APP_INGESTION_API = "https://node1.ingestion.mint.isi.edu/v1.3.0";

window.REACT_APP_AIRFLOW_API = "https://airflow.mint.isi.edu/api/v1";
window.REACT_APP_AIRFLOW_DAG_DOWNLOAD_THREAD_ID = "download_thread"
