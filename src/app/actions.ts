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
import { queryDatasetResources } from '../screens/datasets/actions';
import { queryModelDetail } from '../screens/models/actions';
import { explorerClearModel, explorerSetModel, explorerSetVersion, explorerSetConfig,
         explorerSetCalibration, explorerSetMode } from '../screens/models/model-explore/ui-actions';
import { selectScenario, selectPathway, selectSubgoal, selectPathwaySection, selectTopRegion, selectThread } from './ui-actions';
import { auth, db } from '../config/firebase';
import { User } from 'firebase';
import { UserPreferences, MintPreferences } from './reducers';
import { DefaultApi } from '@mintproject/modelcatalog_client';
import { dexplorerSelectDataset, dexplorerSelectDatasetArea } from 'screens/datasets/ui-actions';

export const BASE_HREF = document.getElementsByTagName("base")[0].href.replace(/^http(s)?:\/\/.*?\//, "/");

export const UPDATE_PAGE = 'UPDATE_PAGE';
export const LOGIN = 'LOGIN';
export const LOGOUT = 'LOGOUT';
export const FETCH_USER = 'FETCH_USER';
export const FETCH_MINT_CONFIG = 'FETCH_MINT_CONFIG';
export const FETCH_MODEL_CATALOG_ACCESS_TOKEN = 'FETCH_MODEL_CATALOG_ACCESS_TOKEN';
export const STATUS_MODEL_CATALOG_ACCESS_TOKEN = 'STATUS_MODEL_CATALOG_ACCESS_TOKEN';

export interface AppActionUpdatePage extends Action<'UPDATE_PAGE'> { regionid?: string, page?: string, subpage?:string };
export interface AppActionFetchUser extends Action<'FETCH_USER'> { user?: User | null };
export interface AppActionFetchMintConfig extends Action<'FETCH_MINT_CONFIG'> { 
  prefs?: MintPreferences | null 
};
export interface AppActionFetchModelCatalogAccessToken extends Action<'FETCH_MODEL_CATALOG_ACCESS_TOKEN'> {
    accessToken: string
};
export interface AppActionStatusModelCatalogAccessToken extends Action<'STATUS_MODEL_CATALOG_ACCESS_TOKEN'> {
    status: string
};

export type AppAction = AppActionUpdatePage | AppActionFetchUser | AppActionFetchMintConfig |
                        AppActionFetchModelCatalogAccessToken | AppActionStatusModelCatalogAccessToken;

type ThunkResult = ThunkAction<void, RootState, undefined, AppAction>;

export const OFFLINE_DEMO_MODE = false;

type UserThunkResult = ThunkAction<void, RootState, undefined, AppActionFetchUser>;
export const fetchUser: ActionCreator<UserThunkResult> = () => (dispatch) => {
  //console.log("Subscribing to user authentication updates");
  auth.onAuthStateChanged(user => {
    if (user) {
      // Check the state of the model-catalog access token.
      let state: any = store.getState();
      if (!state.app.prefs.modelCatalog.status) {
        // This happen when we are already auth on firebase, the access token should be on local storage
        let accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            store.dispatch({type: FETCH_MODEL_CATALOG_ACCESS_TOKEN, accessToken: accessToken});
        } else {
            console.error('No access token on local storage!')
            // Should log out
        }
      } else if (state.app.prefs.modelCatalog.status === 'ERROR') {
          console.error('Login failed!');
          // Should log out
      }

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

type UserPrefsThunkResult = ThunkAction<void, RootState, undefined, AppActionFetchMintConfig>;
export const fetchMintConfig: ActionCreator<UserPrefsThunkResult> = () => (dispatch) => {
  db.doc("configs/main").get().then((doc) => {
    let prefs = doc.data() as MintPreferences;
    if(prefs.execution_engine == "wings") {
      fetch(prefs.wings.server + "/config").then((res) => {
        res.json().then((wdata) => {
          prefs.wings.export_url = wdata["internal_server"]
          prefs.wings.storage = wdata["storage"];
          prefs.wings.dotpath = wdata["dotpath"];
          prefs.wings.onturl = wdata["ontology"];
          dispatch({
            type: FETCH_MINT_CONFIG,
            prefs: prefs
          });
        })
      })
    }
    else {
      dispatch({
        type: FETCH_MINT_CONFIG,
        prefs: prefs
      });
    }
  })
  return;
};

export const signIn = (email: string, password: string) => {
  auth.signInWithEmailAndPassword(email, password);
  modelCatalogLogin(email, password);
};

export const signOut = () => {
  auth.signOut();
  localStorage.removeItem('accessToken');
};

const modelCatalogLogin = (username: string, password: string) => {
  let API = new DefaultApi();
  store.dispatch({type: STATUS_MODEL_CATALOG_ACCESS_TOKEN, status: 'LOADING'})
  API.userLoginGet({username: username, password: password})
    .then((data:any) => {
        let accessToken : string = JSON.parse(data)['access_token'];
        if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
            console.log('NEW TOKEN:', accessToken);
            store.dispatch({type: FETCH_MODEL_CATALOG_ACCESS_TOKEN, accessToken: accessToken});
        } else {
            store.dispatch({type: STATUS_MODEL_CATALOG_ACCESS_TOKEN, status: 'ERROR'})
            console.error('Error fetching the model catalog token!');
        }
    })
    .catch((err) => {
        console.log('Error login to the model catalog', err)
        store.dispatch({type: STATUS_MODEL_CATALOG_ACCESS_TOKEN, status: 'ERROR'})
    });
}

export const goToPage = (page:string) => {
  let state: any = store.getState();
  let regionid = state.ui ? state.ui.selected_top_regionid : "";
  let url = BASE_HREF + (regionid ? regionid + "/" : "") + (page ? page : "");
  window.history.pushState({}, page, url);
  store.dispatch(navigate(decodeURIComponent(location.pathname)));    
}

export const goToRegionPage = (regionid: string, page:string) => {
  let state: any = store.getState();
  let url = BASE_HREF + (regionid ? regionid + "/" : "") + (page ? page : "");
  window.history.pushState({}, page, url);
  store.dispatch(navigate(decodeURIComponent(location.pathname)));    
}

export const navigate: ActionCreator<ThunkResult> = (path: string) => (dispatch) => {
  //console.log(path);
  // Extract the page name from path.
  let cpath = path === BASE_HREF ? '/home' : path.slice(BASE_HREF.length);
  let regionIndex = cpath.indexOf("/");

  let regionid = cpath.substr(0, regionIndex);

  let page = cpath.substr(regionIndex + 1);
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

  store.dispatch(loadPage(page, subpage, params));
  store.dispatch(selectTopRegion(regionid));
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
      else if(subpage == 'scenario') {
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
          } else {
            store.dispatch(selectScenario(null));
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
        } else if (subpage == 'explore') {
            import('../screens/models/model-explore/model-explore').then((_module) => {
                store.dispatch(explorerSetMode('view'));
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
        } else if (subpage == 'configure') {
            import('../screens/models/models-configure').then((_module) => {
                if (params[params.length -1] === 'edit' || params[params.length -1] === 'new') {
                    store.dispatch(explorerSetMode(params.pop()));
                } else {
                    store.dispatch(explorerSetMode('view'));
                }
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
    case 'emulators':
      import('../screens/emulators/emulators-home').then((_module) => {
        if(params.length > 0) {
          //store.dispatch(queryRegionDetail(params[0]));
        }
      });
      break;
    case 'analysis':
        if (subpage == 'home') {
            import('../screens/analysis/analysis-home').then((_module) => {
                store.dispatch(selectScenario(null));
            });
        } else if (subpage == 'report') {
            import('../screens/analysis/analysis-report').then((_module) => {
              if(params.length > 0) {
                store.dispatch(selectScenario(params[0]));
                if(params.length > 1) {
                  store.dispatch(selectSubgoal(params[1]));
                  if(params.length > 2) {
                    store.dispatch(selectPathway(params[2]));
                  }
                }
              } else {
                store.dispatch(selectScenario(null));
              }
            });
        }

        break;
    case 'datasets':
        import('../screens/datasets/datasets-home').then((_module) => {
          if(subpage == "browse") {
              if(params.length == 1) {
                store.dispatch(dexplorerSelectDataset(params[0]));
              }
              else if(params.length == 2) {
                store.dispatch(dexplorerSelectDatasetArea(params[0], params[1]));
              }
              else {
                store.dispatch(dexplorerSelectDataset(null));
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
    case 'messages':
        if(subpage == 'home') {
          // No parameters. Load Modeling Home (List of Scenarios)
          import('../screens/messages/messages-home').then((_module) => {
          });
        }
        else if(subpage == "thread") {
          // Scenario passed in. Load scenario
          import('../screens/messages/messages-thread').then((_module) => {
            if(params.length > 0) {
              store.dispatch(selectThread(params[0]));
            }
          });   
        }
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

