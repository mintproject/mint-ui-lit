/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
import { UPDATE_PAGE, FETCH_USER } from '../actions/app.js';
const INITIAL_STATE = {
    page: ''
};
const app = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case UPDATE_PAGE:
            return Object.assign({}, state, { page: action.page });
        case FETCH_USER:
            return Object.assign({}, state, { user: action.user });
        default:
            return state;
    }
};
export default app;
