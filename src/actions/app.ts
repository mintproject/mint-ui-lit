/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { Action, ActionCreator } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { RootState, store } from '../store.js';
import { queryDatasetDetail } from './datasets.js';
import { queryModelDetail } from './models.js';
import { selectScenario } from './ui.js';
import { auth } from '../config/firebase.js';
import { User } from 'firebase';

export const BASE_HREF = document.getElementsByTagName("base")[0].href.replace(/^http(s)?:\/\/.*?\//, "/");

export const UPDATE_PAGE = 'UPDATE_PAGE';
export const LOGIN = 'LOGIN';
export const LOGOUT = 'LOGOUT';
export const FETCH_USER = 'FETCH_USER';

export interface AppActionUpdatePage extends Action<'UPDATE_PAGE'> { page?: string };
export interface AppActionFetchUser extends Action<'FETCH_USER'> { user?: User | null };

export type AppAction = AppActionUpdatePage | AppActionFetchUser;

type ThunkResult = ThunkAction<void, RootState, undefined, AppAction>;

type UserThunkResult = ThunkAction<void, RootState, undefined, AppActionFetchUser>;
export const fetchUser: ActionCreator<UserThunkResult> = () => (dispatch) => {
  //console.log("Subscribing to user authentication updates");
  auth.onAuthStateChanged(user => {
    if (user) {
      dispatch({
        type: FETCH_USER,
        user: user
      });
    } else {
      dispatch({
        type: FETCH_USER,
        user: null
      });
    }
  });
};

export const signIn = (email: string, password: string) => {
  auth
    .signInWithEmailAndPassword(email, password);
};

export const signOut = () => {
  auth.signOut();
};


export const navigate: ActionCreator<ThunkResult> = (path: string) => (dispatch) => {
  // Extract the page name from path.
  let page = path === BASE_HREF ? 'home' : path.slice(BASE_HREF.length);

  let params = page.split("/");
  if(params.length > 1) {
    page = params[0];
    params.splice(0, 1);
  }

  // Any other info you might want to extract from the path (like page type),
  // you can do here
  dispatch(loadPage(page, params));
};

const loadPage: ActionCreator<ThunkResult> = (page: string, params: Array<String>) => (dispatch) => {
  switch(page) {
    case 'home':
      import('../components/mint-home.js').then((_module) => {
        // Put code in here that you want to run every time when
        // navigating to view1 after view is loaded.
      });
      break;
    case 'scenario':
      import('../components/mint-scenario.js').then((_module) => {
        if(params.length > 0) {
          store.dispatch(selectScenario(params[0]));
        }
      });
      break;
    case 'models':
        import('../catalog-views/model-viewer.js').then((_module) => {
          if(params.length > 0) {
            store.dispatch(queryModelDetail(params[0]));
          }
        });
        break;
    case 'regions':
        import('../catalog-views/region-viewer.js').then((_module) => {
          if(params.length > 0) {
            //store.dispatch(queryRegionDetail(params[0]));
          }
        });
        break;
    case 'datasets':
        import('../catalog-views/dataset-viewer.js').then((_module) => {
          if(params.length > 0) {
            store.dispatch(queryDatasetDetail(params[0]));
          }
        });
        break;
    case 'variables':
        import('../catalog-views/variable-viewer.js').then((_module) => {
          if(params.length > 0) {
            //store.dispatch(queryVariableDetail(params[0]));
          }
        });
        break;
    default:
      page = 'view404';
      import('../components/mint-view404.js');
  }

  dispatch(updatePage(page));
};

const updatePage: ActionCreator<AppActionUpdatePage> = (page: string) => {
  return {
    type: UPDATE_PAGE,
    page
  };
};

