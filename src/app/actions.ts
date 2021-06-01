/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';

import { Action, ActionCreator } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { RootState, store } from './store';
import { explorerClearModel, explorerSetModel, explorerSetVersion, explorerSetConfig, addModelToCompare, clearCompare,
         explorerSetCalibration, explorerSetMode, registerSetStep } from '../screens/models/model-explore/ui-actions';
import { selectProblemStatement, selectThread, selectTask, selectThreadSection, selectTopRegion,
         selectDataTransformation } from './ui-actions';
import { auth, db } from '../config/firebase';
import { User } from 'firebase';
import { MintPreferences, UserProfile } from './reducers';
import { DefaultApi } from '@mintproject/modelcatalog_client';
import { dexplorerSelectDataset, dexplorerSelectDatasetArea } from 'screens/datasets/ui-actions';
import { selectEmulatorModel } from 'screens/emulators/actions';

import * as mintConfig from '../config/config.json';
import ReactGA from 'react-ga';

export const BASE_HREF = document.getElementsByTagName("base")[0].href.replace(/^http(s)?:\/\/.*?\//, "/");

export const UPDATE_PAGE = 'UPDATE_PAGE';
export const LOGIN = 'LOGIN';
export const LOGOUT = 'LOGOUT';
export const FETCH_USER = 'FETCH_USER';
export const FETCH_USER_PROFILE = 'FETCH_USER_PROFILE';
export const FETCH_MINT_CONFIG = 'FETCH_MINT_CONFIG';
export const FETCH_MODEL_CATALOG_ACCESS_TOKEN = 'FETCH_MODEL_CATALOG_ACCESS_TOKEN';
export const STATUS_MODEL_CATALOG_ACCESS_TOKEN = 'STATUS_MODEL_CATALOG_ACCESS_TOKEN';

export interface AppActionUpdatePage extends Action<'UPDATE_PAGE'> { regionid?: string, page?: string, subpage?:string };
export interface AppActionFetchUser extends Action<'FETCH_USER'> { user?: User | null };
export interface AppActionFetchUserPreferences extends Action<'FETCH_USER_PROFILE'> { profile?: UserProfile };
export interface AppActionFetchMintConfig extends Action<'FETCH_MINT_CONFIG'> { 
  prefs?: MintPreferences | null 
};
export interface AppActionFetchModelCatalogAccessToken extends Action<'FETCH_MODEL_CATALOG_ACCESS_TOKEN'> {
    accessToken: string
};
export interface AppActionStatusModelCatalogAccessToken extends Action<'STATUS_MODEL_CATALOG_ACCESS_TOKEN'> {
    status: string
};

export type AppAction = AppActionUpdatePage | AppActionFetchUser | AppActionFetchUserPreferences | AppActionFetchMintConfig |
                        AppActionFetchModelCatalogAccessToken | AppActionStatusModelCatalogAccessToken;

type ThunkResult = ThunkAction<void, RootState, undefined, AppAction>;

export const OFFLINE_DEMO_MODE = false;

/* This retrieve the user profile from the db. Maybe we should move this to other file. */
type UserProfileThunkResult = ThunkAction<Promise<any>, RootState, undefined, AppActionFetchUserPreferences>;
export const fetchUserProfile: ActionCreator<UserProfileThunkResult> = (user:User) => (dispatch) => {
    let ref = db.collection('users').doc(user.email);
    let q = ref.get()
    q.then((qs) => {
        let profile = qs.data();
        if (profile) {
            dispatch({
                type: FETCH_USER_PROFILE,
                profile: profile as UserProfile
            });
        }
    });
    return q;
}

type SetProfileThunkResult = ThunkAction<Promise<void>, RootState, undefined, AppActionFetchUserPreferences>;
//export const setUserProfile = (user:User, profile:UserProfile) : Promise<void> => {
export const setUserProfile: ActionCreator<SetProfileThunkResult> = (user:User, profile:UserProfile) => (dispatch) => {
    let userProfiles = db.collection('users');
    let id = user.email;
    if (!id || !userProfiles || !profile) {
        return Promise.reject('Must include user id and a valid profile.');
    }
    let req = userProfiles.doc(id).set(profile);
    req.then(() => { 
        dispatch({
            type: FETCH_USER_PROFILE,
            profile: profile
        });
    });
    return req;
}

export const resetPassword = (email:string) => {
    return auth.sendPasswordResetEmail(email);
}

type UserThunkResult = ThunkAction<void, RootState, undefined, AppActionFetchUser>;
export const fetchUser: ActionCreator<UserThunkResult> = () => (dispatch) => {
  //console.log("Subscribing to user authentication updates");
  auth.onAuthStateChanged(user => {
    if (user) {
      ReactGA.set({ userId: user.email });
      dispatch(fetchUserProfile(user)).then(() => {
          ModelCatalogApi.setUsername(user.email);
          // Check the state of the model-catalog access token.
          let state: any = store.getState();
          if (!state.app.prefs.modelCatalog.status) {
            // This happen when we are already auth on firebase, the access token should be on local storage
            let accessToken = localStorage.getItem('accessToken');
            if (accessToken) {
                store.dispatch({type: FETCH_MODEL_CATALOG_ACCESS_TOKEN, accessToken: accessToken});
            } else {
                console.info('No access token on local storage!')
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
        })
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
  let prefs = mintConfig["default"] as MintPreferences;
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
};

export const signIn = (email: string, password: string) => {
  let req = auth.signInWithEmailAndPassword(email, password)
        .then(() => modelCatalogLogin(email, password));
  return req;
};

export const signUp = (email: string, password: string) => {
  let req = auth.createUserWithEmailAndPassword(email, password)
        .then(() => modelCatalogLogin(email, password));
  return req;
};

export const signOut = () => {
  localStorage.removeItem('accessToken');
  auth.signOut().then(() => {
      window.location.reload(false);
  });
};

const modelCatalogLogin = (username: string, password: string) => {
  ModelCatalogApi.login(username, password);
  let API = new DefaultApi();
  store.dispatch({type: STATUS_MODEL_CATALOG_ACCESS_TOKEN, status: 'LOADING'})
  //API.userLoginGet({username: username, password: password})
  API.userLoginPost({user: {username: username, password: password}})
    .then((data:any) => {
        let accessToken : string = JSON.parse(data)['access_token'];
        if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
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
  ReactGA.pageview(path);
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
        // No parameters. Load Modeling Home (List of ProblemStatements)
        import('../screens/modeling/modeling-home').then((_module) => {
          store.dispatch(selectProblemStatement(null));
          store.dispatch(selectTask(null));
          store.dispatch(selectThread(null));
        });
      }
      else if(subpage == 'problem_statement' || subpage == 'scenario') {
        // ProblemStatement passed in. Load problem_statement
        import('../screens/modeling/mint-problem-statement').then((_module) => {
          if(params.length > 0 && params[0]) {
            store.dispatch(selectProblemStatement(params[0]));
            if(params.length > 1 && params[1]) {
              store.dispatch(selectTask(params[1]));
              if(params.length > 2 && params[2]) {
                store.dispatch(selectThread(params[2]));
                if(params.length > 3 && params[3]) {
                  store.dispatch(selectThreadSection(params[3]));
                }
              } else {
                store.dispatch(selectThread(null));
              }
            }
            else {
              store.dispatch(selectTask(null));
            }
          } else {
            store.dispatch(selectProblemStatement(null));
          }
        });   
      }
      break;
    case 'models':
        if (subpage == 'home') {
            // No parameters. Load Model Home
            import('../screens/models/models-home');
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
        } else if (subpage == 'compare') {
            import('../screens/models/models-compare').then((_module) => {
                store.dispatch(clearCompare());
                if (params.length > 0) {
                    store.dispatch(addModelToCompare(params[0]));
                }
            });
        } else if (subpage == 'register') {
            //TODO
            if(params.length > 0) {
                store.dispatch(explorerSetModel(params[0]));
                if (params.length > 1) {
                    let step : number = parseInt(params[1] as string);
                    if (step) store.dispatch(registerSetStep(step));
                }
            } else {
                store.dispatch(explorerClearModel());
            }
        } else if (subpage == 'edit') {
            if (params[params.length -1] === 'edit' || params[params.length -1] === 'new') {
                store.dispatch(explorerSetMode(params.pop()));
            } else {
                store.dispatch(explorerSetMode('view'));
            }
            if(params.length > 0) {
                store.dispatch(explorerSetModel(params[0]));
                if (params.length > 1) {
                    store.dispatch(explorerSetVersion(params[1]));
                }
            } else {
                store.dispatch(explorerClearModel());
            }
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
        let model = subpage;
        if(model != "home")
          store.dispatch(selectEmulatorModel(model));
        else 
          store.dispatch(selectEmulatorModel('CYCLES'));
      });
      break;
    case 'analysis':
        if (subpage == 'home') {
            import('../screens/analysis/analysis-home').then((_module) => {
                store.dispatch(selectProblemStatement(null));
            });
        } else if (subpage == 'report') {
            import('../screens/analysis/analysis-report').then((_module) => {
              if(params.length > 0) {
                store.dispatch(selectProblemStatement(params[0]));
                if(params.length > 1) {
                  store.dispatch(selectTask(params[1]));
                  if(params.length > 2) {
                    store.dispatch(selectThread(params[2]));
                  }
                }
              } else {
                store.dispatch(selectProblemStatement(null));
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
          } else if(subpage == "data-transformations") {
              if (params[params.length -1] === 'edit' || params[params.length -1] === 'new')
                store.dispatch(explorerSetMode(params.pop()));
              else store.dispatch(explorerSetMode('view'));
              if(params.length == 1) {
                store.dispatch(selectDataTransformation(params[0]));
              }
              else {
                store.dispatch(selectDataTransformation(null));
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
          // No parameters. Load Modeling Home (List of ProblemStatements)
          import('../screens/messages/messages-home').then((_module) => {
          });
        }
        else if(subpage == "thread") {
          // ProblemStatement passed in. Load problem_statement
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

