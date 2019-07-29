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
import { RootState, store } from './store';
import { queryDatasetDetail } from '../screens/datasets/actions';
import { queryModelDetail } from '../screens/models/actions';
import { explorerClearModel, explorerSetModel, explorerSetVersion, explorerSetConfig,
         explorerSetCalibration } from '../screens/models/model-explore/ui-actions';
import { selectScenario, selectPathway, selectSubgoal, selectPathwaySection } from './ui-actions';
import { auth } from '../config/firebase';
import { User } from 'firebase';

export const BASE_HREF = document.getElementsByTagName("base")[0].href.replace(/^http(s)?:\/\/.*?\//, "/");

export const UPDATE_PAGE = 'UPDATE_PAGE';
export const LOGIN = 'LOGIN';
export const LOGOUT = 'LOGOUT';
export const FETCH_USER = 'FETCH_USER';

export interface AppActionUpdatePage extends Action<'UPDATE_PAGE'> { page?: string, subpage?:string };
export interface AppActionFetchUser extends Action<'FETCH_USER'> { user?: User | null };

export type AppAction = AppActionUpdatePage | AppActionFetchUser;

type ThunkResult = ThunkAction<void, RootState, undefined, AppAction>;

export const OFFLINE_DEMO_MODE = false;

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

export const goToPage = (page:string) => {
  window.history.pushState({}, page, BASE_HREF + page);
  store.dispatch(navigate(decodeURIComponent(location.pathname)));    
}

export const navigate: ActionCreator<ThunkResult> = (path: string) => (dispatch) => {
  // Extract the page name from path.
  let page = path === BASE_HREF ? 'home' : path.slice(BASE_HREF.length);
  let subpage = 'home';

  let params = page.split("/");
  if(params.length > 0) {
    page = params[0];
    params.splice(0, 1);
  }

  if(params.length > 0) {
    subpage = params[0];
    params.splice(0, 1);
  }

  // console.log(page);
  // console.log(subpage);
  // console.log(params);

  dispatch(loadPage(page, subpage, params));
};

const loadPage: ActionCreator<ThunkResult> = 
    (page: string, subpage: string, params: Array<String>) => (dispatch) => {
  switch(page) {
    case 'home':
      import('../screens/home/app-home').then((_module) => {
      });
      break;    
    case 'modeling':
      if(subpage == 'home') {
        // No parameters. Load Modeling Home (List of Scenarios)
        import('../screens/modeling/modeling-home').then((_module) => {
          store.dispatch(selectScenario(null));
          store.dispatch(selectPathway(null));
        });
      }
      else if(subpage == "scenario") {
        // Scenario passed in. Load scenario
        import('../screens/modeling/mint-scenario').then((_module) => {
          if(params.length > 0) {
            store.dispatch(selectScenario(params[0]));
            if(params.length > 1) {
              store.dispatch(selectSubgoal(params[1]));
              if(params.length > 2) {
                store.dispatch(selectPathway(params[2]));
                if(params.length > 3) {
                  store.dispatch(selectPathwaySection(params[3]));
                }
              }
            }
          }
        });   
      }
      break;
    case 'models':
        if (subpage == 'home') {
            // No parameters. Load Model Home
            import('../screens/models/models-home').then((_module) => {
                if(params.length > 0) {
                    store.dispatch(queryModelDetail(params[0]));
                }
            });
        } else if (subpage == "explore") {
            import('../screens/models/model-explore/model-explore').then((_module) => {
                if(params.length > 0) {
                    store.dispatch(explorerSetModel(params[0]));
                    if (params.length > 1) {
                        store.dispatch(explorerSetVersion(params[1]));
                        if (params.length > 2) {
                            store.dispatch(explorerSetConfig(params[2]));
                            if (params.length > 3) {
                                store.dispatch(explorerSetCalibration(params[3]));
                            }
                        }
                    }
                } else {
                    store.dispatch(explorerClearModel());
                }
            });
        }
        break;
    case 'regions':
        import('../screens/regions/regions-home').then((_module) => {
          if(params.length > 0) {
            //store.dispatch(queryRegionDetail(params[0]));
          }
        });
        break;
    case 'analysis':
        import('../screens/analysis/analysis-home').then((_module) => {
          if(params.length > 0) {
            //store.dispatch(queryRegionDetail(params[0]));
          }
        });
        break;
    case 'datasets':
        import('../screens/datasets/datasets-home').then((_module) => {
          if(params.length > 0) {
            if(subpage == "browse") {
              store.dispatch(queryDatasetDetail(params[0]));
            }
          }
        });
        break;
    case 'variables':
        import('../screens/variables/variables-home').then((_module) => {
          if(params.length > 0) {
            //store.dispatch(queryVariableDetail(params[0]));
          }
        });
        break;
    default:
      page = 'view404';
      import('./mint-view404');
  }

  dispatch(updatePage(page, subpage));
};

const updatePage: ActionCreator<AppActionUpdatePage> = (page: string, subpage: string) => {
  return {
    type: UPDATE_PAGE,
    page,
    subpage
  };
};

