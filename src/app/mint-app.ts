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
import { connect } from 'pwa-helpers/connect-mixin';
import { installRouter } from 'pwa-helpers/router';
import { updateMetadata } from 'pwa-helpers/metadata';

// This element is connected to the Redux store.
import { store, RootState } from './store';

// These are the actions needed by this element.
import {
  navigate, BASE_HREF, fetchUser, signOut, signIn, goToPage,
} from './actions';

import '../screens/modeling/modeling-home';
import '../screens/datasets/datasets-home';
import '../screens/regions/regions-home';
import '../screens/models/models-home';
import '../screens/analysis/analysis-home';
import '../screens/variables/variables-home';

import { SharedStyles } from '../styles/shared-styles';
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

      .card {
        height: calc(100% - 100px);
        overflow: auto;
      }
      
      .breadcrumbs {
        margin-left: 40px;
      }

      .breadcrumbs li.active {
        background-color: #629b30;
        color: white;
      }
      .breadcrumbs li.active:before {
        border-color: #629b30;
        border-left-color: transparent;
      }
      .breadcrumbs li.active:after {
        border-left-color: #629b30;
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

          ${this.user ? 
            html `
            <ul class="breadcrumbs">
              <li @click="${()=>goToPage('datasets')}"
                  class=${(this._page == 'datasets'? 'active': '')}
                >Explore Data</li>
              <li @click="${()=>goToPage('regions')}"
                  class=${(this._page == 'regions'? 'active': '')}
                >Define Regions</li>
              <li @click="${()=>goToPage('models')}"
                  class=${(this._page == 'models'? 'active': '')}
                >Prepare Models</li>
              <li @click="${()=>goToPage('modeling')}"
                  class=${(this._page == 'modeling') ? 'active': ''}
                class="active">Use Models</li>
              <li @click="${()=>goToPage('analysis')}"
                  class=${(this._page == 'analysis'? 'active': '')}
                >Prepare Reports</li>
            </ul>
            `
            : html ``
          }

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

      ${this.user ? 
        html `
        <div class="sectionframe">

          <div id="right">
            <div class="card">
              <!-- Main Pages -->
              <app-home class="page fullpage" ?active="${this._page == 'home'}"></app-home>
              <datasets-home class="page fullpage" ?active="${this._page == 'datasets'}"></datasets-home>
              <regions-home class="page fullpage" ?active="${this._page == 'regions'}"></regions-home>
              <variables-home class="page fullpage" ?active="${this._page == 'variables'}"></variables-home>
              <models-home class="page fullpage" ?active="${this._page == 'models'}"></models-home>
              <modeling-home class="page fullpage" ?active="${this._page == 'modeling'}"></modeling-home>
              <analysis-home class="page fullpage" ?active="${this._page == 'analysis'}"></analysis-home>
            </div>
          </div>
        </div>
        `
        :
        html `
          <center><wl-title level="3"><br /><br />Please Login to Continue</wl-title></center>
        `
      }
    </div>

    ${this._renderDialogs()}
    `;
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
