/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { html, customElement, css } from 'lit-element';

// These are the shared styles needed by this element.
import { SharedStyles } from '../../styles/shared-styles';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../../app/store';

// Actions needed by this element
import modeling from './reducers';

import "./scenarios-list";
import "./mint-scenario";

import { PageViewElement } from '../../components/page-view-element';


store.addReducers({
  modeling
});

@customElement('modeling-home')
export class ModelingHome extends connect(store)(PageViewElement) {

  static get styles() {
    return [
      SharedStyles,
      css`
      `
    ];
  }

  protected render() {
    //console.log("rendering");
    return html`

    <div>  
      <scenarios-list class="page fullpage" ?active="${this._subpage == 'home'}"></scenarios-list>
      <mint-scenario class="page fullpage" ?active="${this._subpage == 'scenario'}"></mint-scenario>   
    </div>
    `
  }
  
  stateChanged(state: RootState) {
    super.setSubPage(state);
    super.setRegionId(state);
  }
}
