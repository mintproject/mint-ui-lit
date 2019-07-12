/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, property, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { installRouter } from 'pwa-helpers/router.js';
import { updateMetadata } from 'pwa-helpers/metadata.js';
// This element is connected to the Redux store.
import { store } from '../store';
// These are the actions needed by this element.
import { navigate, BASE_HREF, fetchUser, signOut, signIn, } from '../actions/app';
import './mint-home';
import './mint-scenario';
import '../catalog-views/dataset-viewer';
import '../catalog-views/model-viewer';
import '../catalog-views/variable-viewer';
import { SharedStyles } from './shared-styles';
import { showDialog, hideDialog, formElementsComplete } from '../util/ui_functions';
let MintApp = class MintApp extends connect(store)(LitElement) {
    constructor() {
        super(...arguments);
        this.appTitle = '';
        this._page = '';
        this._drawerOpened = false;
    }
    static get styles() {
        return [
            SharedStyles,
            css `
      .mainframe {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
      }
      .frame {
        padding: 0px;
        display: flex;
        overflow: auto;
        align-items: stretch;
        width: 100%;
      }
      div#left {
      }
      div#right {
        flex-grow: 1;
      }
      /*

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
      }*/

      .chevron {
        position: relative;
        top: 8px;
        z-index: 1;
        text-align: center;
        vertical-align: middle;
        line-height: 20px;
        padding: 12px;
        margin-bottom: 6px;
        height: 20px;
        width: 65px;
        font-size: 14px;
        font-weight: bold;
        color: white;
      }
      
      .chevron:before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 51%;
        background: #629b30;
        z-index: -1;
        -webkit-transform: skew(0deg, 14deg);
        -moz-transform: skew(0deg, 14deg);
        -ms-transform: skew(0deg, 14deg);
        -o-transform: skew(0deg, 14deg);
        transform: skew(0deg, 14deg);
      }
      .chevron:after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        height: 100%;
        width: 50%;
        z-index: -1;
        background: #629b30;
        -webkit-transform: skew(0deg, -14deg);
        -moz-transform: skew(0deg, -14deg);
        -ms-transform: skew(0deg, -14deg);
        -o-transform: skew(0deg, -14deg);
        transform: skew(0deg, -14deg);
      }  
      
      .chevron.selected:after,
      .chevron.selected:before {
        background: #f1951b;
      }
         
      `
        ];
    }
    render() {
        // Anything that's related to rendering should be done in here.
        return html `
      <!-- Navigation Bar -->
      <div class="mainframe">
      <wl-nav>
        <div slot="title"><a class="title" href="${BASE_HREF}"><img height="40" src="/images/logo.png"></a></div>
        <div slot="right">
          ${this.user == null ?
            html `
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
            `}
        </div>
      </wl-nav>

      <!-- Overall app layout -->
      <div class="frame">
        <!-- Left drawer -->
        <div id="left open">
          <div class="chevron">Data</div>
          <div class="chevron">Region</div>
          <div class="chevron">Models</div>
          <div class="chevron">Objectives</div>
          <div class="chevron selected">Modeling</div>
          <div class="chevron">Analysis</div>  
        </div>

        <div id="right">
          <!-- Main Pages -->
          <mint-home class="page fullpage" ?active="${this._page == 'home'}"></mint-home>
          <mint-scenario class="page fullpage" ?active="${this._page == 'scenario'}"></mint-scenario>
          <model-viewer class="page fullpage" ?active="${this._page == 'models'}"></model-viewer>
          <dataset-viewer class="page fullpage" ?active="${this._page == 'datasets'}"></dataset-viewer>
          <variable-viewer class="page fullpage" ?active="${this._page == 'variables'}"></variable-viewer>
        </div>
      </div>
      </div>

      ${this._renderDialogs()}
    `;
    }
    _renderDialogs() {
        return html `
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
        showDialog("loginDialog", this.shadowRoot);
    }
    _onLoginCancel() {
        hideDialog("loginDialog", this.shadowRoot);
    }
    _onLogin() {
        let form = this.shadowRoot.querySelector("#loginForm");
        if (formElementsComplete(form, ["username", "password"])) {
            let username = form.elements["username"].value;
            let password = form.elements["password"].value;
            signIn(username, password);
            this._onLoginCancel();
        }
    }
    _toggleDrawer() {
        this._drawerOpened = !this._drawerOpened;
        var left = this.shadowRoot.getElementById("left");
        left.className = "left" + (this._drawerOpened ? " open" : "");
    }
    firstUpdated() {
        installRouter((location) => store.dispatch(navigate(decodeURIComponent(location.pathname))));
        store.dispatch(fetchUser());
    }
    updated(changedProps) {
        if (changedProps.has('_page')) {
            const pageTitle = this.appTitle + ' - ' + this._page;
            updateMetadata({
                title: pageTitle,
                description: pageTitle
                // This object also takes an image property, that points to an img src.
            });
        }
    }
    stateChanged(state) {
        this._page = state.app.page;
        this.user = state.app.user;
    }
};
__decorate([
    property({ type: String })
], MintApp.prototype, "appTitle", void 0);
__decorate([
    property({ type: String })
], MintApp.prototype, "_page", void 0);
__decorate([
    property({ type: Boolean })
], MintApp.prototype, "_drawerOpened", void 0);
__decorate([
    property({ type: Object })
], MintApp.prototype, "user", void 0);
MintApp = __decorate([
    customElement('mint-app')
], MintApp);
export { MintApp };
