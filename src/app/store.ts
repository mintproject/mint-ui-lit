/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

declare global {
  interface Window {
    process?: Object;
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}

import {
  createStore,
  compose,
  applyMiddleware,
  combineReducers,
  Reducer,
  StoreEnhancer
} from 'redux';
import thunk, { ThunkMiddleware } from 'redux-thunk';
import { lazyReducerEnhancer } from 'pwa-helpers/lazy-reducer-enhancer';

import app, { AppState } from './reducers';
import { ModelingState } from '../screens/modeling/reducers';
import { ModelsState } from '../screens/models/reducers';
import { DatasetsState } from '../screens/datasets/reducers';

import { AppAction } from './actions';
import { ModelingAction } from '../screens/modeling/actions';
import { ModelsAction } from '../screens/models/actions';
import { DatasetsAction } from '../screens/datasets/actions';
import { RegionsAction } from '../screens/regions/actions';
import ui, { UIState } from './ui-reducers';
import { UIAction } from './ui-actions';
import { RegionsState } from '../screens/regions/reducers';

import { ApiAction } from '../util/model-catalog-actions';
import { ExplorerState } from '../util/model-catalog-reducers';

import { DExplorerUIState } from '../screens/datasets/ui-reducers';

import { ExplorerUIAction } from '../screens/models/model-explore/ui-actions';
import { ExplorerUIState } from '../screens/models/model-explore/ui-reducers';
import { MessagesState } from 'screens/messages/reducers';
import { MessagesAction } from 'screens/messages/actions';

import { ModelCatalogAction } from 'model-catalog/actions';
import { ModelCatalogState } from 'model-catalog/reducers';
import { DExplorerUIAction } from 'screens/datasets/ui-actions';
import { EmulatorsState } from 'screens/emulators/reducers';
import { EmulatorsAction } from 'screens/emulators/actions';

// Overall state extends static states and partials lazy states.
export interface RootState {
  app: AppState;
  modeling: ModelingState;
  models?: ModelsState;
  datasets?: DatasetsState;
  regions?: RegionsState;
  emulators?: EmulatorsState;
  explorer?: ExplorerState;
  messages?: MessagesState;
  explorerUI?: ExplorerUIState;
  dataExplorerUI?: DExplorerUIState;
  modelCatalog: ModelCatalogState;
  ui: UIState
}

export type RootAction = AppAction | ModelingAction | ModelsAction | DatasetsAction | EmulatorsAction |
                         RegionsAction | UIAction | ApiAction | ExplorerUIAction |
                         MessagesAction | ModelCatalogAction | DExplorerUIAction;

// Sets up a Chrome extension for time travel debugging.
// See https://github.com/zalmoxisus/redux-devtools-extension for more information.
const devCompose: <Ext0, Ext1, StateExt0, StateExt1>(
  f1: StoreEnhancer<Ext0, StateExt0>, f2: StoreEnhancer<Ext1, StateExt1>
) => StoreEnhancer<Ext0 & Ext1, StateExt0 & StateExt1> =
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;


// Initializes the Redux store with a lazyReducerEnhancer (so that you can
// lazily add reducers after the store has been created) and redux-thunk (so
// that you can dispatch async actions). See the "Redux and state management"
// section of the wiki for more details:
// https://github.com/Polymer/pwa-starter-kit/wiki/4.-Redux-and-state-management
export const store = createStore(
  state => state as Reducer<RootState, RootAction>,
  devCompose(
    lazyReducerEnhancer(combineReducers),
    applyMiddleware(thunk as ThunkMiddleware<RootState, RootAction>),
  )
);

// Initially loaded reducers.
store.addReducers({
  app
});
store.addReducers({
  ui
});
