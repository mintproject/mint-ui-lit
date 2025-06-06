window.REACT_APP_WELCOME_MESSAGE = "Welcome to MINT Demo";
window.REACT_APP_MODEL_CATALOG_DEFAULT_USER= "mint@isi.edu";
// Model Catalog
window.REACT_APP_MODEL_CATALOG_API = "http://api.models.mint.local/v1.8.0";
// Mint Database
window.REACT_APP_GRAPHQL_ENDPOINT = "graphql.mint.local/v1/graphql";
window.REACT_APP_GRAPHQL_ENABLE_SSL = false;

// Data Catalog
window.REACT_APP_DATA_CATALOG_API = "https://ckan.tacc.utexas.edu";
window.REACT_APP_DATA_CATALOG_TYPE = "CKAN";

// Ensemble Manager API
window.REACT_APP_ENSEMBLE_MANAGER_API = "http://localhost:3000/v1";
//window.REACT_APP_ENSEMBLE_MANAGER_API = "http://ensemble-manager.mint.local/v1";
window.REACT_APP_EXECUTION_ENGINE = "tapis";
window.REACT_APP_EXECUTION_COMPONENT_FROM_TAPIS = true;
window.REACT_APP_EXECUTION_COMPONENT_FROM_TAPIS_TENANT = "tacc";

// Google API Key
window.REACT_APP_GOOGLE_MAPS_KEY = "AIzaSyBl8J85KibSuhHEw_j0JTlITVTBb8oXiMo";

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

//Visualization and Ingestion - Not used any more - Remove ?
window.REACT_APP_VISUALIZATION_URL = "http://dev.viz.mint.isi.edu";
window.REACT_APP_INGESTION_API = "";
window.REACT_APP_AIRFLOW_API = "https://airflow.mint.isi.edu/api/v1";
window.REACT_APP_AIRFLOW_DAG_DOWNLOAD_THREAD_ID = "download_thread"
