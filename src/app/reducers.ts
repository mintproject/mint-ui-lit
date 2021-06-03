/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { Reducer } from 'redux';
import { RootAction } from './store';
import { User } from 'firebase';
import { UPDATE_PAGE, FETCH_USER, FETCH_USER_PROFILE, FETCH_MINT_CONFIG,
         FETCH_MODEL_CATALOG_ACCESS_TOKEN, STATUS_MODEL_CATALOG_ACCESS_TOKEN} from './actions';

export interface IdMap<T> {
  [id: string]: T
}

export interface IdNameObject {
  id?: string
  name?: string
}

export interface AppState {
  page: string,
  subpage: string,
  user?: User,
  prefs?: UserPreferences
}

export interface UserPreferences {
  mint: MintPreferences,
  modelCatalog: ModelCatalogPreferences,
  profile?: UserProfile
}

export interface MintPreferences {
  data_catalog_api: string,
  //model_catalog_api?: string  // Model Catalog API isn't used from here any more
  ensemble_manager_api: string,
  ingestion_api: string,
  visualization_url: string,  
  execution_engine?: "wings" | "localex",  
  // Local Execution
  localex?: LocalExecutionPreferences,
  // Wings Execution  
  wings?: WingsPreferences,  
  graphql?: GraphQLPreferences,
  wings_api?: string,
  //maps
  google_maps_key: string,
  apiKey: string,
  authDomain: string,
  databaseURL: string,
  projectId: string,
  storageBucket: string,
  messagingSenderId: string,
  appId: string
}

export interface GraphQLPreferences {
  endpoint: string,
  secret: string
}

export interface WingsPreferences {
  server: string,
  domain: string,
  username: string,
  password: string,
  datadir: string,
  dataurl: string
  // The following is retrieved from wings itself
  export_url?: string,
  storage?: string,
  dotpath?: string,
  onturl?: string,
}

export interface LocalExecutionPreferences {
  datadir: string,
  dataurl: string,
  logdir: string,
  logurl: string,
  codedir: string
}

type ModelCatalogStatus = 'LOADING' | 'DONE' | 'ERROR';
export interface ModelCatalogPreferences {
  username: string,
  accessToken: string,
  status: ModelCatalogStatus
}

export type UserProfile = {
    mainRegion: string,
    graph: string,
}

const INITIAL_STATE: AppState = {
  page: '',
  subpage: '',
  prefs: {mint: null, modelCatalog: {} as ModelCatalogPreferences}
};

const app: Reducer<AppState, RootAction> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case UPDATE_PAGE:
      return {
        ...state,
        page: action.page!,
        subpage: action.subpage!
      };
    case FETCH_USER:
      return {
        ...state,
        user: action.user!
      };
    case FETCH_USER_PROFILE:
      let newPrefsWithProfile = { ...state.prefs, profile: action.profile };
      return {
        ...state,
        prefs: newPrefsWithProfile
      };
    case FETCH_MINT_CONFIG:
      let newPrefs = {...state.prefs, mint: action.prefs};
      return {
        ...state,
        prefs: newPrefs
      };
    case FETCH_MODEL_CATALOG_ACCESS_TOKEN:
      let newMCPrefs = { ...state.prefs.modelCatalog, accessToken: action.accessToken, status: 'DONE' } as ModelCatalogPreferences;
      return {
        ...state,
        prefs: {...state.prefs, modelCatalog: newMCPrefs}
      }
    case STATUS_MODEL_CATALOG_ACCESS_TOKEN:
      let newMCStatus = { ...state.prefs.modelCatalog, status: action.status } as ModelCatalogPreferences;
      return {
        ...state,
        prefs: {...state.prefs, modelCatalog: newMCStatus}
      }
    default:
      return state;
  }
};

export default app;
