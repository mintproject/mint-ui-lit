import { html, property, customElement, css } from 'lit-element';

import { PageViewElement } from '../../../components/page-view-element.js';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../../../app/store';

import { FetchedModel, IODetail, VersionDetail } from "./reducers";
//import { explorerFetchDetails, explorerFetchVersions } from './actions';
import { explorerFetchVersions, explorerFetchIO } from './actions';
import { SharedStyles } from '../../../styles/shared-styles';

//import { goToPage } from '../../../app/actions';
import "weightless/select";
import "weightless/tab";
import "weightless/tab-group";
import "weightless/card";

@customElement('model-facet-big')
export class ModelFacetBig extends connect(store)(PageViewElement) {
    @property({type: String})
        uri : string = "";

    @property({type: Object})
    private _model! : FetchedModel;

    @property({type: Object})
    private _io! : IODetail[];

    @property({type: Object})
    private _versions! : VersionDetail[];

    @property({type: String})
    private _selectedVersion! : string;

    @property({type: String})
    private _selectedConfig! : string;

    //@property({type: String})
    //private _selectedCalibration! : string;

    @property({type: String})
    private _tab : string = 'overview';

    constructor () {
        super();
        this.active = true;
    }

    static get styles() {
        return [SharedStyles, 
            css `
                :host {
                    width: 100%;
                }

                .clickable {
                    cursor: pointer;
                }

                table {
                    margin: 0 auto;
                  border: 1px solid black;
                  width: 80%;
                  min-width: 600px;
                  border-spacing: 0;
                  border-collapse: collapse;
                  height: 100px;
                  overflow: hidden;
                }

                td {
                  padding: 0px;
                  padding-top: 3px;
                  vertical-align: top;
                }

                td.left {
                  width: 25%;
                }

                td.right {
                  width: 75%;
                }

                td div {
                  overflow: hidden;
                }

                img {
                  background: #3A6F9A;
                  vertical-align: middle;
                  max-width: calc(100% - 8px);
                  border: 1px solid black;
                }

                .helper {
                  display: inline-block;
                  height: 100%;
                  vertical-align: middle;
                }

                .text-centered {
                  text-align: center;
                }

                .header {
                    color: rgb(6, 67, 108);
                    font-weight: bold;
                  font-size: 1.4em;
                  line-height: 1.5em;
                  height: 1.5em;
                }

                .title {
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }

                .icon {
                  display: inline-block;
                  background-color: red;
                  width: 1.3em;
                  overflow: hidden;
                  float: right;
                  cursor: pointer;
                }

                .content {
                  padding: 0px 10px;
                  text-align: justify;
                }

                td.header div {
                  display: inline-block;
                }

                td.header div:nth-child(1) { width: 150px; }
                td.header div:nth-child(2) { width: calc(100% - 300px); min-width: 100px; }
                td.header div:nth-child(3) { width: 150px; }

                .details-button {
                    display: inline-block;
                    color: rgb(15, 122, 207);
                    cursor: pointer;
                    font-weight: bold;
                }
            `
        ];
    }

    protected render() {
        /*console.log('Selected Version', this._selectedVersion);
        if (this._selectedVersion) console.log(this._versions[this._selectedVersion]);
        console.log('Selected Config', this._selectedConfig);
        if (this._selectedConfig) console.log(this._versions[this._selectedVersion][this._selectedConfig]);*/

        return html`
            <table>
                <tr>
                    <td class="header" colspan="2">
                        <div class="details-button"></div><!--
                        --><div class="title text-centered">${this._model.label}</div><!--
                        <div class="links"><span class="icon">1</span> <span class="icon">2</span></div>-->
                    </td>
                </tr>
                <tr>
                    <td class="left text-centered">
                    <span class="helper"></span>${this._model.logo ? 
                        html`<img src="${this._model.logo}"/>`
                        : html`<img src="http://www.sclance.com/pngs/image-placeholder-png/image_placeholder_png_698412.png"/>`}
                    </td>
                    <td class="right content">
                        ${this._model.desc}
                        <br/>
                        <br/>
                        ${this._model.authors ?
                            html`<b>Authors:</b> ${this._model.authors}<br/>`
                            : ``}
                        ${this._model.contactP ?
                            html`<b>Contact:</b> ${this._model.contactP}<br/>`
                            : ``}
                        ${this._model.publisher ?
                            html`<b>publisher:</b> ${this._model.publisher}<br/>`
                            : ``}
                        ${this._model.referenceP ?
                            html`<b>Preferred citation:</b> ${this._model.referenceP}<br/>`
                            : ``}
                        ${this._model.doc ?
                            html`<b>Documentation:</b> 
                                <a href="${this._model.doc}" target="_blank">${this._model.doc}</a><br/>`
                            : ``}
                        <br/>

                        <br/>
                        ${(this._versions && Object.keys(this._versions).length > 0) ?
                            html`
                            <wl-select label="Select version" @change="${this.changeVersion}">
                                <option value="" selected>Base</option>
                                ${Object.keys(this._versions).map( uri => html`<option value="${uri}">${uri}</option>`)}
                            </wl-select>
                            ${(this._selectedVersion &&
                               Object.keys(this._versions[this._selectedVersion]).length > 0) ? 
                                html`
                                <wl-select label="Select configuration" @change="${this.changeConfig}">
                                    <option value="" selected>Base</option>
                                    ${Object.keys(this._versions[this._selectedVersion]).map( uri => 
                                        html`<option value="${uri}">${uri}</option>`
                                    )}
                                </wl-select>
                                `
                                : html``
                            }
                            `
                            :html``
                        }
                    </td>
                </tr>

                <tr>
                    <td class="content" colspan="2">
                    <br/>
                    <wl-tab-group>
                        <wl-tab @click="${() => {this.changeTab('overview')}}">Overview</wl-tab>
                        <wl-tab @click="${() => {this.changeTab('io')}}">Input/Output</wl-tab>
                        <wl-tab @click="${() => {this.changeTab('variables')}}">Variables</wl-tab>
                    </wl-tab-group>
                ${this.renderTab(this._tab)}
                <br/>
        `;
    }

    changeTab (tabName: string) {
        this._tab = tabName;
    }

    renderTab (tabName : string) {
        switch (tabName) {
            case 'overview':
                return html`${this._model.sampleVisualization ?
                    html`<img src="${this._model.sampleVisualization}"></img>` : html``}`
            case 'io':
                return html`
                ${this._io ? html`
                <table class="pure-table pure-table-bordered">
                    <thead>
                        <th>I/O</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Format</th>
                    </thead>
                    <tbody>
                    ${this._io.map( io => html`
                        <tr>
                            <td>${io.kind.split('#')[1]}</td>
                            <td>${io.label}</td>
                            <td>${io.desc}</td>
                            <td>${io.type.split('#')[1]}</td>
                            <td>${io.format}</td>
                        </tr>
                    `)}
                    </tbody>
                </table>
                    
                    </td>
                </tr>
            </table>`: html `<h3 style="margin-left:30px">Please select a configuration.</h3>`}
                `;
            default:
                return html``
        }
    }

    changeVersion (ev:any) {
        this._selectedConfig = '';
        this._selectedVersion = ev.path[0].value;
    }

    changeConfig (ev:any) {
        this._selectedConfig = ev.path[0].value;
        if (this._selectedConfig) {
            store.dispatch(explorerFetchIO(this._selectedConfig));
        }
    }

    firstUpdated() {
        //store.dispatch(explorerFetchDetails(this.uri));
        store.dispatch(explorerFetchVersions(this.uri));
    }

    stateChanged(state: RootState) {
        if (state.explorer) {
            if (state.explorer.models) {
                this._model = state.explorer.models[this.uri];
            } 
            if (state.explorer.io) {
                if (this._selectedConfig) {
                    this._io = state.explorer.io[this._selectedConfig];
                }
            }
            if (state.explorer.version && state.explorer.version[this.uri]) {
                this._versions = state.explorer.version[this.uri];
            }
        }
    }
}
