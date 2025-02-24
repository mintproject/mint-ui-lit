/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { Reducer } from "redux";
import { RootAction } from "./store";
import { UPDATE_PAGE, FETCH_USER, FETCH_MINT_CONFIG } from "./actions";

export interface IdMap<T> {
  [id: string]: T;
}

export interface IdNameObject {
  id?: string;
  name?: string;
}

export interface User {
  email: string;
  uid: string;
  region: string;
  graph: string;
}

export interface AppState {
  page: string;
  subpage: string;
  user?: User;
  prefs?: UserPreferences;
}

export interface UserPreferences {
  mint: MintPreferences;
}

export interface MintPreferences {
  welcome_message: string;
  model_catalog_default_user: string;
  data_catalog_api: string;
  model_catalog_api?: string;
  ensemble_manager_api: string;
  ingestion_api: string;
  visualization_url: string;
  execution_engine?: string;
  // Local Execution
  localex?: LocalExecutionPreferences;
  // Wings Execution
  wings?: WingsPreferences;
  graphql?: GraphQLPreferences;
  wings_api?: string;
  //maps
  google_maps_key: string;
  //auth
  auth : {
    server: string;
    clientId: string;
    realm?: string;
    discovery?: string;
    auth?: string;
    token?: string;
    logout?: string;
    provider?: 'keycloak' | 'tapis';
    hash?:string;
  }
  use_individual_catalogue?: boolean;

  //old
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  cromo_api?: string;
  airflow_api?: string;
  airflow_dag_download_thread_id?: string;
}

export interface GraphQLPreferences {
  endpoint: string;
  enable_ssl: boolean;
}

export interface WingsPreferences {
  server: string;
  domain: string;
  username: string;
  password: string;
  datadir: string;
  dataurl: string;
  // The following is retrieved from wings itself
  export_url?: string;
  storage?: string;
  dotpath?: string;
  onturl?: string;
}

export interface LocalExecutionPreferences {
  datadir: string;
  dataurl: string;
  logdir: string;
  logurl: string;
  codedir: string;
}

const INITIAL_STATE: AppState = {
  page: "",
  subpage: "",
  prefs: { mint: null },
};

const app: Reducer<AppState, RootAction> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case UPDATE_PAGE:
      return {
        ...state,
        page: action.page!,
        subpage: action.subpage!,
      };
    case FETCH_USER:
      return {
        ...state,
        user: action.user!,
      };
    case FETCH_MINT_CONFIG:
      let newPrefs = { ...state.prefs, mint: action.prefs };
      return {
        ...state,
        prefs: newPrefs,
      };
    default:
      return state;
  }
};

export default app;
