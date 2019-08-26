
import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from '../../app/actions';

import { explorerFetch, explorerFetchVersions, explorerFetchParameters } from './model-explore/actions';

import "weightless/progress-spinner";
import { UriModels } from './model-explore/reducers';

@customElement('models-configure')
export class ModelsConfigure extends connect(store)(PageViewElement) {
    @property({type: Boolean})
    private _hideModels : boolean = false;

    @property({type: Object})
    private _models : UriModels = null;

    @property({type: Object})
    private _versions : any = {};
    private _waitingVersions : Set<string>= new Set();

    @property({type: String})
    private _selectedUri : string = "";

    @property({type: String})
    private _selectedLabel : string = "";

    @property({type: Object})
    private _parameters : any[] | null = [];

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
        <div class="twocolumns">
            <div class="${this._hideModels ? 'left_closed' : 'left'}">
                <div class="clt">
                    <div class="cltrow_padded">
                        <div class="cltmain">
                            <wl-title level="4" style="margin: 0px">Models:</wl-title>
                        </div>
                    </div>                    
                    ${this._models ? 
                    html`
                        <ul>
                        ${Object.values(this._models).filter((m) => (!this._versions[m.uri] || this._versions[m.uri].length>0)).map((m:any) => 
                            html`
                            <li>
                                ${m.label}
                                ${this._versions[m.uri] ? 
                                (this._versions[m.uri].length === 0? html``: 
                                html`
                                <ul>
                                    ${this._versions[m.uri].map((v) => html`
                                    <li>
                                        ${v.label}
                                        ${v.configs? html`
                                        <ul>
                                            ${v.configs.map((cfg) => html`
                                            <li>
                                                <a @click="${()=>{this._select(cfg.uri, cfg.label)}}">${cfg.label}</a>
                                                ${cfg.calibrations? html`
                                                <ul>
                                                    ${cfg.calibrations.map((c) => html`
                                                    <li><a @click="${()=>{this._select(c.uri, c.label)}}">${c.label}</a></li>
                                                    `)}
                                                </ul>`: html``}
                                            </li>`)}
                                        </ul>` : ``}
                                    </li>`)}
                                </ul>`)
                                : html`
                                <div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>
                                `}
                            </li>`
                        )}
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
                                ${this._selectedLabel? 
                                html`Configurable parameters for ${this._selectedLabel}:`
                                : html`Select a configuration or calibration on the left panel.`}
                            </wl-title>
                        </div>
                    </div>

                    ${(this._selectedUri && this._parameters) ? 
                        (this._parameters.length > 0 ?
                            this._renderTable(this._parameters)
                            : html`<p>${this._selectedLabel} has no parameters.</p>·`)
                        : (this._selectedUri? 
                            html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`
                            : html``)
                    }
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
                    <th style="text-align: right;"><b>Default Value</b><wl-icon>edit</wl-icon></th>
                    <th style="text-align: right;"><b>Min Value</b><wl-icon>edit</wl-icon></th>
                    <th style="text-align: right;"><b>Max Value</b><wl-icon>edit</wl-icon></th>
                </thead>
                <tbody>
                ${params.map((p:any) => html`<tr>
                    <td>${p.paramlabel}</td>
                    <td>${p.type}</td>
                    <td>${p.pdatatype}</td>
                    <td><input class="value-edit" type="text" placeholder="-" value="${p.defaultvalue}"></input></td>
                    <td><input class="value-edit" type="number" placeholder="-" value="${p.minVal}"></input></td>
                    <td><input class="value-edit" type="number" placeholder="-" value="${p.maxVal}"></input></td>
                </tr>`)}
                </tbody>
            </table>
            <div style="height:50px;">
                <wl-button style="float:right; padding: 8px" 
                    @click="${()=>{alert('Sorry! Save function its not available yet.')}}">
                    <wl-icon>save</wl-icon>&ensp; Save</wl-button>
            </div>
            `
    }

    _select (uri:string, label:string) {
        console.log(uri, label)
        if (uri && this._selectedUri != uri) {
            this._selectedUri = uri;
            this._selectedLabel = label;
            this._parameters = null;
            store.dispatch(explorerFetchParameters(uri));
        }
    }

    firstUpdated() {
        store.dispatch(explorerFetch());
    }

    stateChanged(state: RootState) {
        if (state.explorer) {
            if (state.explorer.models && Object.values(state.explorer.models).length >0 && this._models == null) {
                this._models = state.explorer.models;
                Object.keys(this._models).forEach((uri) =>{
                    store.dispatch(explorerFetchVersions(uri));
                    this._waitingVersions.add(uri);
                });
            }

            //Save versions only first time
            if (this._waitingVersions.size > 0 && state.explorer.versions) {
                this._waitingVersions.forEach((uri:string) => {
                    if (state.explorer.versions[uri]) {
                        this._versions = { ...this._versions }
                        this._versions[uri] = state.explorer.versions[uri];
                        
                        this._waitingVersions.delete(uri);
                    }
                });
            }

            if (this._selectedUri && state.explorer.parameters[this._selectedUri]) {
                this._parameters = state.explorer.parameters[this._selectedUri];
            }
        }
    }
}
