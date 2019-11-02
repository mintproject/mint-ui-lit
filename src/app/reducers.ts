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
import { UPDATE_PAGE, FETCH_USER, FETCH_USER_PREFERENCES, FETCH_MODEL_CATALOG_ACCESS_TOKEN,
         STATUS_MODEL_CATALOG_ACCESS_TOKEN } from './actions';
import { SAMPLE_MINT_PREFERENCES } from 'offline_data/sample_user';

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
  modelCatalog: ModelCatalogPreferences
}

export interface MintPreferences {
  wings: WingsPreferences,
  ingestion_api: string,
  visualization_url: string,
  data_catalog_api: string,
  model_catalog_api: string
}

export interface WingsPreferences {
  server: string,
  export_url: string,
  domain: string,
  username: string,
  password: string,
  storage: string,
  dotpath: string,
  onturl: string,
  api: string,
}

type ModelCatalogStatus = 'LOADING' | 'DONE' | 'ERROR';
export interface ModelCatalogPreferences {
  username: string,
  accessToken: string,
  status: ModelCatalogStatus
}

const INITIAL_STATE: AppState = {
  page: '',
  subpage: '',
  prefs: {mint: SAMPLE_MINT_PREFERENCES as MintPreferences, modelCatalog: {} as ModelCatalogPreferences}
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
    case FETCH_USER_PREFERENCES:
      let newPrefs = {...state.prefs, ...action.prefs};
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
