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
import {
  UPDATE_PAGE, FETCH_USER
} from '../actions/app.js';
import { RootAction } from '../store.js';
import { User } from 'firebase';

export interface AppState {
  page: string
  user?: User
}

const INITIAL_STATE: AppState = {
  page: ''
};

const app: Reducer<AppState, RootAction> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case UPDATE_PAGE:
      return {
        ...state,
        page: action.page!
      };
    case FETCH_USER:
      return {
        ...state,
        user: action.user!
      };
    default:
      return state;
  }
};

export default app;
