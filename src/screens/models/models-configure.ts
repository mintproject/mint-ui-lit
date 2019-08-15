
import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from '../../app/actions';

import { explorerFetch, explorerFetchVersions, explorerFetchParameters } from './model-explore/actions';

import "weightless/progress-spinner";

@customElement('models-configure')
export class ModelsConfigure extends connect(store)(PageViewElement) {
    @property({type: Boolean})
    private _hideModels : boolean = false;

    @property({type: Object})
    private _models : any = null;

    @property({type: Object})
    private _params : any = {};

    @property({type: Object})
    private _selectedModel : any = null;

    @property({type: Object})
    private _version : any = null;

    static get styles() {
        return [
            css `
            .cltrow wl-button {
                padding: 2px;
            }

            .card2 {
                margin: 0px;
                left: 0px;
                right: 0px;
                padding: 10px;
                padding-top: 5px;
                height: calc(100% - 40px);
                background: #FFFFFF;
            }

            .twocolumns {
                position: absolute;
                top: 120px;
                bottom: 25px;
                left: 25px;
                right: 25px;
                display: flex;
                border: 1px solid #F0F0F0;
            }

            .left {
                width: 30%;
                padding-top: 0px;
                border-right: 1px solid #F0F0F0;
                padding-right: 5px;
                overflow: auto;
                height: 100%;
            }

            .left_closed {
                width: 0px;
                overflow: hidden;
            }

            .right, .right_full {
                width: 70%;
                padding-top: 0px;
                overflow: auto;
                height: 100%;
            }

            .right_full {
                width: 100%;
            }

            input.value-edit {
                background-color: transparent;
                border: 0px;
                text-align: right;
            }

            input.value-edit {
                background-color: transparent;
                border: 0px;
                text-align: right;
            }

            input.value-edit:hover {
                border-bottom: 1px dotted black;
                margin-bottom: -1px;
            }

            input.value-edit:focus {
                border-bottom: 1px solid black;
                margin-bottom: -1px;
                outline-offset: -0px;
                outline: -webkit-focus-ring-color auto 0px;
            }

            th > wl-icon {
                text-size: .8em;
                padding: 0px 8px;
            }
            `,
            SharedStyles
        ];
    }

    protected render() {
        let count = 0;
        return html`
        <div class="cltrow">
            <wl-button flat inverted @click="${()=> goToPage('models')}">
                <wl-icon>arrow_back_ios</wl-icon>
            </wl-button>
            <div class="cltmain" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;padding-left:5px;">
                <wl-title level="3" style="margin: 0px;">Configure Models</wl-title>
            </div>
        </div>

        <div class="twocolumns">
            <div class="${this._hideModels ? 'left_closed' : 'left'}">
                <div class="clt">
                    <div class="cltrow_padded">
                        <div class="cltmain">
                            <wl-title level="4" style="margin: 0px">Models:</wl-title>
                        </div>
                    </div>                    
                    ${this._models ? html`<ul>
                    ${Object.values(this._models).map((m:any) => html`<li><a @click="${()=>{this._selectModel(m.uri)}}">${m.label}</a></li>`)}
                    </ul>`
                    : html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`}
                </div>
            </div>
            <div class="${this._hideModels ? 'right_full' : 'right'}">
                    <div class="card2">
                        <wl-icon @click="${() => this._hideModels = !this._hideModels}"
                            class="actionIcon bigActionIcon" style="float:right">
                            ${!this._hideModels ? "fullscreen" : "fullscreen_exit"}
                        </wl-icon>
                        <div class="cltrow_padded">
                            <div class="cltmain">
                                <wl-title level="4" style="margin: 0px">
                                    ${this._selectedModel? 
                                    html`Configurable parameters for ${this._selectedModel.label}:`
                                    : html`Select a model on the left panel.`}
                                </wl-title>
                            </div>
                        </div>
                        ${this._version ? this._version.map((v:any) => html`
                            ${v.configs ? v.configs.map((cfg:any) => html`
                                ${(this._params[cfg.uri] && this._params[cfg.uri].length>0 && (count += 1))? html`
                                <wl-title level="5">${v.label}/${cfg.label}:</wl-title>
                                ${this._renderTable(this._params[cfg.uri])}
                                `: html``}
                                ${cfg.calibrations ? cfg.calibrations.map((c:any) => html`
                                    ${(this._params[c.uri] && this._params[c.uri].length>0 && (count += 1))? html`
                                    <wl-title level="5">${v.label}/${cfg.label}/${c.label}:</wl-title>
                                    ${this._renderTable(this._params[c.uri])}
                                    ` : html``}
                                `) : html``}
                            `): html``}
                        `) : html``}
                        ${(this._selectedModel && count==0) ? html`This model does not have configurable parameters yet.`: html``}
                    </div>
            </div>
        </div>
        `
    }

    _renderTable (params:any) {
        return html`
            <table class="pure-table pure-table-striped" style="width: 100%">
                <thead>
                    <th><b>Label</b></th>
                    <th><b>Type</b></th>
                    <th><b>Datatype</b></th>
                    <th style="text-align: right;"><b>Default Value</b></th>
                    <th style="text-align: right;"><b>Min Value</b><wl-icon>edit</wl-icon></th>
                    <th style="text-align: right;"><b>Max Value</b><wl-icon>edit</wl-icon></th>
                </thead>
                <tbody>
                ${params.map((p:any) => html`<tr>
                    <td>${p.paramlabel}</td>
                    <td>${p.type}</td>
                    <td>${p.pdatatype}</td>
                    <td style="text-align: right;">${p.defaultvalue || '-'}</td>
                    <td><input class="value-edit" type="number" placeholder="-" value="${p.minVal}"></input></td>
                    <td><input class="value-edit" type="number" placeholder="-" value="${p.maxVal}"></input></td>
                </tr>`)}
                </tbody>
            </table>
            <div style="height:50px;">
                <wl-button style="float:right; -button-padding: 5px;" 
                    @click="${()=>{alert('Sorry! Save function its not available yet.')}}">
                    <wl-icon>save</wl-icon>&ensp; Save</wl-button>
            </div>
            `
    }

    _selectModel (uri:string) {
        if (this._models && this._selectedModel != this._models[uri]) {
            if (uri) {
                //store.dispatch(explorerFetchParameters(uri));
                store.dispatch(explorerFetchVersions(uri));
                this._selectedModel = this._models[uri];
            } else {
                this._selectedModel = null;
            }
            this._version = null;
        }
    }

    firstUpdated() {
        store.dispatch(explorerFetch());
    }

    stateChanged(state: RootState) {
        if (state.explorer) {
            if (state.explorer.models && state.explorer.models != this._models &&
                Object.values(state.explorer.models).length >0) {
                this._models = state.explorer.models;
            }
            if (this._selectedModel && state.explorer.versions && state.explorer.versions[this._selectedModel.uri] != this._version) {
                this._version = state.explorer.versions[this._selectedModel.uri];
                this._version.forEach((v:any) => { 
                    if (v.configs) v.configs.forEach((cfg:any) => {
                        store.dispatch(explorerFetchParameters(cfg.uri));
                        if (cfg.calibrations) cfg.calibrations.forEach((c:any) => {
                            store.dispatch(explorerFetchParameters(c.uri));
                        });
                    });
                });
            }
            if (state.explorer.parameters) {
                this._params = state.explorer.parameters;
            }
        }
    }
}
