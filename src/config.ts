import { MintPreferences } from "app/reducers";

declare global {
  interface Window { 
    REACT_APP_DATA_CATALOG_API: string;
    REACT_APP_CROMO_API: string;
    REACT_APP_MODEL_CATALOG_API: string;
    REACT_APP_ENSEMBLE_MANAGER_API: string;
    REACT_APP_EXECUTION_ENGINE: string;
    REACT_APP_GOOGLE_MAPS_KEY: string;
    REACT_APP_LOCALEX: string;
    REACT_APP_LOCALEX_CODEDIR: string;
    REACT_APP_LOCALEX_DATADIR: string;
    REACT_APP_LOCALEX_LOGDIR: string;
    REACT_APP_LOCALEX_LOGURL: string;
    REACT_APP_LOCALEX_DATAURL: string;
    REACT_APP_LOCALEX_PARALLEL: string;
    REACT_APP_GRAPHQL_ENDPOINT: string;
    REACT_APP_GRAPHQL_ENABLE_SSL;
    REACT_APP_VISUALIZATION_URL: string;
    REACT_APP_INGESTION_API: string;
    REACT_APP_WINGS_SERVER: string;
    REACT_APP_WINGS_DOMAIN: string;
    REACT_APP_WINGS_DATA_DIR: string;
    REACT_APP_WINGS_DATA_URL: string;
    REACT_APP_WINGS_USERNAME: string;
    REACT_APP_WINGS_PASSWORD: string;
    REACT_APP_WELCOME_MESSAGE: string;
    REACT_APP_MODEL_CATALOG_DEFAULT_USER: string;
    REACT_APP_AIRFLOW_API: string;
    REACT_APP_AIRFLOW_DAG_DOWNLOAD_THREAD_ID: string;
    // Auth
    REACT_APP_AUTH_SERVER: string;
    REACT_APP_AUTH_REALM: string;
    REACT_APP_AUTH_CLIENT_ID: string;
    REACT_APP_AUTH_TOKEN_URL: string;
    REACT_APP_AUTH_AUTH_URL: string;
    REACT_APP_AUTH_DISCOVERY_URL: string;
    REACT_APP_AUTH_PROVIDER: string;
    REACT_APP_AUTH_LOGOUT: string;
    REACT_APP_AUTH_HASH: string;
    REACT_APP_AUTH_GRANT: string;
  }
}

const REACT_APP_DATA_CATALOG_API: string =
  window.REACT_APP_DATA_CATALOG_API || "";
const REACT_APP_CROMO_API: string = window.REACT_APP_CROMO_API || "";
const REACT_APP_MODEL_CATALOG_API: string =
  window.REACT_APP_MODEL_CATALOG_API || "";
const REACT_APP_ENSEMBLE_MANAGER_API: string =
  window.REACT_APP_ENSEMBLE_MANAGER_API || "";
const REACT_APP_EXECUTION_ENGINE: string =
  window.REACT_APP_EXECUTION_ENGINE || "localex";
const REACT_APP_GOOGLE_MAPS_KEY: string =
  window.REACT_APP_GOOGLE_MAPS_KEY || "";
const REACT_APP_AUTH_SERVER: string = window.REACT_APP_AUTH_SERVER || "";
const REACT_APP_AUTH_REALM: string = window.REACT_APP_AUTH_REALM || "";
const REACT_APP_AUTH_CLIENT_ID: string = window.REACT_APP_AUTH_CLIENT_ID || "";
const REACT_APP_LOCALEX: string = window.REACT_APP_LOCALEX || "";
const REACT_APP_LOCALEX_CODEDIR = window.REACT_APP_LOCALEX_CODEDIR || "";
const REACT_APP_LOCALEX_DATADIR = window.REACT_APP_LOCALEX_DATADIR || "";
const REACT_APP_LOCALEX_LOGDIR = window.REACT_APP_LOCALEX_LOGDIR || "";
const REACT_APP_LOCALEX_LOGURL = window.REACT_APP_LOCALEX_LOGURL || "";
const REACT_APP_LOCALEX_DATAURL = window.REACT_APP_LOCALEX_DATAURL || "";
const REACT_APP_LOCALEX_PARALLEL = window.REACT_APP_LOCALEX_PARALLEL || 50;
const REACT_APP_GRAPHQL_ENDPOINT: string =
  window.REACT_APP_GRAPHQL_ENDPOINT || "";
const REACT_APP_GRAPHQL_ENABLE_SSL: boolean =
  window.REACT_APP_GRAPHQL_ENABLE_SSL;
const REACT_APP_VISUALIZATION_URL: string =
  window.REACT_APP_VISUALIZATION_URL || "";
const REACT_APP_INGESTION_API: string = window.REACT_APP_INGESTION_API || "";
const REACT_APP_WINGS_SERVER: string = window.REACT_APP_WINGS_SERVER || "";
const REACT_APP_WINGS_DOMAIN = window.REACT_APP_WINGS_DOMAIN || "";
const REACT_APP_WINGS_DATA_DIR = window.REACT_APP_WINGS_DATA_DIR || "";
const REACT_APP_WINGS_DATA_URL = window.REACT_APP_WINGS_DATA_URL || "";
const REACT_APP_WINGS_USERNAME = window.REACT_APP_WINGS_USERNAME || "";
const REACT_APP_WINGS_PASSWORD = window.REACT_APP_WINGS_PASSWORD || "";
const REACT_APP_WELCOME_MESSAGE: string =
  window.REACT_APP_WELCOME_MESSAGE || "";
const REACT_APP_MODEL_CATALOG_DEFAULT_USER =
  window.REACT_APP_MODEL_CATALOG_DEFAULT_USER || "mint@isi.edu";
/**
 * window.REACT_APP_AIRFLOW_API = "https://airflow.mint.isi.edu";
 * window.REACT_APP_AIRFLOW_DAG_DOWNLOAD_THREAD_ID = "download_thread_v3"
 */
const REACT_APP_AIRFLOW_API: string = window.REACT_APP_AIRFLOW_API || "";
const REACT_APP_AIRFLOW_DAG_DOWNLOAD_THREAD_ID =
  window.REACT_APP_AIRFLOW_DAG_DOWNLOAD_THREAD_ID || "";

const MINT_PREFERENCES: MintPreferences = {
  welcome_message: REACT_APP_WELCOME_MESSAGE,
  model_catalog_default_user: REACT_APP_MODEL_CATALOG_DEFAULT_USER,
  data_catalog_api: REACT_APP_DATA_CATALOG_API,
  model_catalog_api: REACT_APP_MODEL_CATALOG_API,
  ensemble_manager_api: REACT_APP_ENSEMBLE_MANAGER_API,
  ingestion_api: REACT_APP_INGESTION_API,
  visualization_url: REACT_APP_VISUALIZATION_URL,
  execution_engine: REACT_APP_EXECUTION_ENGINE,
  localex: {
    datadir: REACT_APP_LOCALEX_DATADIR,
    dataurl: REACT_APP_LOCALEX_DATAURL,
    logdir: REACT_APP_LOCALEX_LOGDIR,
    logurl: REACT_APP_LOCALEX_LOGURL,
    codedir: REACT_APP_LOCALEX_CODEDIR,
  },
  wings: {
    server: REACT_APP_WINGS_SERVER,
    domain: REACT_APP_WINGS_DOMAIN,
    datadir: REACT_APP_WINGS_DATA_DIR,
    dataurl: REACT_APP_WINGS_DATA_URL,
    username: REACT_APP_WINGS_SERVER,
    password: REACT_APP_WINGS_PASSWORD,
  },
  graphql: {
    endpoint: REACT_APP_GRAPHQL_ENDPOINT,
    enable_ssl: REACT_APP_GRAPHQL_ENABLE_SSL,
  },

  cromo_api: REACT_APP_CROMO_API,
  google_maps_key: REACT_APP_GOOGLE_MAPS_KEY,
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  airflow_api: REACT_APP_AIRFLOW_API,
  airflow_dag_download_thread_id: REACT_APP_AIRFLOW_DAG_DOWNLOAD_THREAD_ID,
  auth :{
    grant: window.REACT_APP_AUTH_GRANT || undefined,
    server: REACT_APP_AUTH_SERVER,
    clientId: REACT_APP_AUTH_CLIENT_ID,
    realm: REACT_APP_AUTH_REALM || undefined,
    auth: window.REACT_APP_AUTH_AUTH_URL || undefined,
    discovery: window.REACT_APP_AUTH_DISCOVERY_URL || undefined,
    token: window.REACT_APP_AUTH_TOKEN_URL || undefined,
    logout: window.REACT_APP_AUTH_LOGOUT || undefined,
    provider: window.REACT_APP_AUTH_PROVIDER as MintPreferences['auth']['provider'] || undefined,
    hash: window.REACT_APP_AUTH_HASH || undefined,
  }
};

export { MINT_PREFERENCES };
