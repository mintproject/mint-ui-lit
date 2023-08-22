import { MintPreferences } from "app/reducers";

const REACT_APP_DATA_CATALOG_API: string =
  window.REACT_APP_DATA_CATALOG_API || "";
const REACT_APP_CROMO_API: string = window.REACT_APP_CROMO_API || "";
const REACT_APP_MODEL_CATALOG_API: string =
  window.REACT_APP_MODEL_CATALOG_API || "";
const REACT_APP_ENSEMBLE_MANAGER_API: string =
  window.REACT_APP_ENSEMBLE_MANAGER_API || "";
const REACT_APP_EXECUTION_ENGINE: "wings" | "localex" =
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
  auth_server: REACT_APP_AUTH_SERVER,
  auth_realm: REACT_APP_AUTH_REALM,
  auth_client_id: REACT_APP_AUTH_CLIENT_ID,
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  airflow_api: REACT_APP_AIRFLOW_API,
  airflow_dag_download_thread_id: REACT_APP_AIRFLOW_DAG_DOWNLOAD_THREAD_ID,
};

export { MINT_PREFERENCES };
