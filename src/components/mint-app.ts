/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { LitElement, html, property, PropertyValues, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { installRouter } from 'pwa-helpers/router.js';
import { updateMetadata } from 'pwa-helpers/metadata.js';

// This element is connected to the Redux store.
import { store, RootState } from '../store';

// These are the actions needed by this element.
import {
  navigate, BASE_HREF, fetchUser, signOut, signIn,
} from '../actions/app';

import './mint-home';
import './mint-scenario';
import '../catalog-views/dataset-viewer';
import '../catalog-views/region-viewer';
import '../catalog-views/model-viewer';
import '../catalog-views/variable-viewer';

import { SharedStyles } from './shared-styles';
import { showDialog, hideDialog, formElementsComplete } from '../util/ui_functions';
import { User } from 'firebase';

@customElement('mint-app')
export class MintApp extends connect(store)(LitElement) {
  @property({type: String})
  appTitle = '';

  @property({type: String})
  private _page = '';

  @property({type:Boolean})
  private _drawerOpened = false;

  @property({type: Object})
  private user!: User;

  static get styles() {
    return [
      SharedStyles,
      css`
      .appframe {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
      }

      .sectionframe {
        display: flex;
        height: 100%;
        width: 100%;
        overflow: auto;
        background: #F6F6F6;
      }

      div#left {
        top: 0;
        bottom: 0;
        left: 0;
        background-color: #06436c;
        color: white;
        width: 0px;
        overflow: auto;
        transition: width 0.2s;
      }

      div#left.open {
        display: block;
        width: 400px;
      }

      div#right {
        top: 0;
        bottom: 0;
        width: 100%;
        transition: width 0.2s;
      }
      
      .arrowbox {
        margin-left: 20px;
      }

      .arrowbox li.active {
        background: #629b30;
        color: white;
      }
      .arrowbox li.active::before {
        border-left-color: transparent;
        border-top-color: #629b30;
        border-bottom-color: #629b30;
      }
      .arrowbox li.active::after {
        border-left-color: #629b30;
        border-top-color: transparent;
        border-bottom-color: transparent;
      }
      `
    ];
  }

  protected render() {
    // Anything that's related to rendering should be done in here.
    return html`
      <!-- Overall app layout -->

    <div class="appframe">
      <!-- Navigation Bar -->
      <wl-nav>
        <div slot="title">
          <a class="title" href="${BASE_HREF}"><img height="40" src="/images/logo.png"></a>

          <!-- Need to add click handlers to go to the appropriate page -->
          <ul class="arrowbox">
            <li @click="${()=>this._goToPage('datasets')}"
                class=${(this._page == 'datasets'? 'active': '')}
              >DATA</li>
            <li @click="${()=>this._goToPage('regions')}"
                class=${(this._page == 'regions'? 'active': '')}
              >REGIONS</li>
            <li @click="${()=>this._goToPage('models')}"
                class=${(this._page == 'models'? 'active': '')}
              >MODELS</li>
            <li @click="${()=>this._goToPage('home')}"
                class=${(this._page == 'home' || this._page == 'scenario') ? 'active': ''}
              class="active">MODELING</li>
            <li @click="${()=>this._goToPage('analysis')}"
                class=${(this._page == 'analysis'? 'active': '')}
              >ANALYSIS</li>
          </ul>

        </div>
        <div slot="right">
          ${this.user == null ? 
            html`
            <wl-button flat inverted @click="${this._showLoginWindow}">
              LOGIN &nbsp;
              <wl-icon alt="account">account_circle</wl-icon>
            </wl-button>
            `
            :
            html `
            <wl-button flat inverted @click="${signOut}">
              LOGOUT ${this.user.email}
            </wl-button>
            `
          }
        </div>
      </wl-nav>

      <div class="sectionframe">

        <div id="right">

          <!-- Main Pages -->
          <mint-home class="page fullpage" ?active="${this._page == 'home'}"></mint-home>
          <mint-scenario class="page fullpage" ?active="${this._page == 'scenario'}"></mint-scenario>
          <region-viewer class="page fullpage" ?active="${this._page == 'regions'}"></region-viewer>
          <model-viewer class="page fullpage" ?active="${this._page == 'models'}"></model-viewer>
          <dataset-viewer class="page fullpage" ?active="${this._page == 'datasets'}"></dataset-viewer>
          <variable-viewer class="page fullpage" ?active="${this._page == 'variables'}"></variable-viewer>
        </div>
      </div>
    </div>

    ${this._renderDialogs()}
    `;
  }

  _goToPage(page:string) {
    window.history.pushState({}, page, BASE_HREF + page);
    store.dispatch(navigate(decodeURIComponent(location.pathname)));    
  }

  _renderDialogs() {
    return html`
    <wl-dialog id="loginDialog" fixed backdrop blockscrolling>
      <h3 slot="header">Please enter your username and password for MINT</h3>
      <div slot="content">
        <p></p>      
        <form id="loginForm">
          <div class="input_full">
            <label>Username</label>
            <input name="username" type="text"></input>
          </div>
          <p></p>
          <div class="input_full">
            <label>Password</label>
            <input name="password" type="password"></input>
          </div>

        </form>
      </div>
      <div slot="footer">
          <wl-button @click="${this._onLoginCancel}" inverted flat>Cancel</wl-button>
          <wl-button @click="${this._onLogin}" class="submit" id="dialog-submit-button">Submit</wl-button>
      </div>
    </wl-dialog>
    `;
}

  _showLoginWindow() {
    showDialog("loginDialog", this.shadowRoot!);
  }

  _onLoginCancel() {
    hideDialog("loginDialog", this.shadowRoot!);
  }

  _onLogin() {
    let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#loginForm")!;
    if(formElementsComplete(form, ["username", "password"])) {
        let username = (form.elements["username"] as HTMLInputElement).value;
        let password = (form.elements["password"] as HTMLInputElement).value;
        signIn(username, password);
        this._onLoginCancel();
    }
  }

  _toggleDrawer() {
    this._drawerOpened = !this._drawerOpened;
    var left = this.shadowRoot!.getElementById("left");
    left!.className = "left" + (this._drawerOpened ? " open" : "");
  }

  protected firstUpdated() {
    installRouter((location) => store.dispatch(navigate(decodeURIComponent(location.pathname))));
    store.dispatch(fetchUser());
  }

  protected updated(changedProps: PropertyValues) {
    if (changedProps.has('_page')) {
      const pageTitle = this.appTitle + ' - ' + this._page;
      updateMetadata({
        title: pageTitle,
        description: pageTitle
        // This object also takes an image property, that points to an img src.
      });
    }
  }


  stateChanged(state: RootState) {
    this._page = state.app!.page;
    this.user = state.app!.user!;
  }
}
