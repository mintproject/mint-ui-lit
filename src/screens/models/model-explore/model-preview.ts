
import { PageViewElement } from '../../../components/page-view-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../../../app/store';

import { html, property, customElement, css } from 'lit-element';

import { goToPage } from '../../../app/actions';

import { FetchedModel } from "../../../util/api-interfaces";
import { ExplorerStyles } from './explorer-styles'
import { explorerCompareModel } from './ui-actions'

@customElement('model-preview')
export class ModelPreview extends connect(store)(PageViewElement) {
    @property({type: String}) public id : string = "";
    @property({type: Number}) private _nVersions : number = -1;
    @property({type: Number}) private _nConfigs  : number = -1;
    @property({type: Number}) private _nSetups   : number = -1;
    @property({type: Object}) private _regions : null | any = null;

    @property({type: String})
        altDesc : string = '';

    @property({type: String})
        altTitle : string = '';

    @property({type: Object})
    private _model! : FetchedModel;

    @property({type: String})
    private _url : string = '';

    @property({type: Number})
    private _vers : number = -1;

    @property({type: Number})
    private _configs : number = -1;

    @property({type: Boolean})
    private _ready : boolean = false;

    constructor () {
        super();
        this.active = true;
    }

    static get styles() {
        return [ExplorerStyles,
            css `
                :host {
                    display: block;
                }

                table {
                    margin-bottom: 1em;
                    table-layout: fixed;
                    border: 1px solid black;
                    width: 100%;
                    border-spacing: 0;
                    border-collapse: collapse;
                    height: 160px;
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

                td.left div:nth-child(1) { height: 1.2em; }
                td.left div:nth-child(2) { height: calc(150px - 3.6em); text-align: center;}
                td.left div:nth-child(3) { height: 2.4em; }

                td.right div:nth-child(1) { height: 1.3em; }
                td.right div:nth-child(2) { height: 96px; }
                td.right div:nth-child(3) { height: calc(44px - 1.3em); }

                .one-line {
                    height: 1.2em;
                    line-height: 1.2em;
                }

                .two-lines {
                    height: 2.4em;
                    line-height: 1.2em;
                }

                .header {
                    font-size: 1.2em;
                    line-height: 1.3em;
                    height: 1.3em;
                }

                .text-centered {
                    text-align: center;
                }
              

                img {
                    vertical-align: middle;
                    border: 1px solid black;
                    max-width: calc(100% - 8px);
                    max-height: calc(150px - 3.6em - 2px);
                }

                #img-placeholder {
                    vertical-align: middle;
                    --icon-size: 80px;
                }

                .helper {
                    display: inline-block;
                    height: 100%;
                    vertical-align: middle;
                }

                .title {
                    display: inline-block;
                    padding: 0px 10px 3px 10px;
                    //width: calc(100% - 2.6em - 20px);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .title > a > wl-icon {
                    font-size: 1em;
                }

                .icon {
                    cursor: pointer;
                    display: inline-block;
                    overflow: hidden;
                    float: right;
                    font-size: 1em;
                    width: 1.4em;
                    margin-right: 7px;
                    margin-top: -5px;
                }

                .content {
                    padding: 5px 10px 0px 10px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    line-height: 16px;
                    max-height: 96px;

                    /* The number of lines to be displayed */
                    -webkit-line-clamp: 6;
                    -webkit-box-orient: vertical;
                }

                .content > code {
                    line-height: 19px;
                }
                
                .footer {
                    padding: 5px 10px 0px 10px;
                }

                .keywords {
                    display: inline-block;
                    width: calc(100% - 100px);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .ver-conf-text {
                    float: right;
                    font-size: 13px;
                    padding-right: 3px;
                    line-height: 1.2em;
                }

                .details-button {
                    display: inline-block;
                    float: right;
                    color: rgb(15, 122, 207);
                    cursor: pointer;
                    font-weight: bold;
                }
            `
        ];
    }

    protected render() {
        if (this._model) {
            //console.log(this._model);
            let modelType : string[] = this._model.type ?
                    this._model.type.map(t => t.replace('Model', '')).filter(t => !!t)
                    : [];
        return html`
            <table>
              <tr>
                <td class="left"> 
                  <div class="text-centered one-line">
                    ${this._nSetups > 0? html`
                        <b style="color: darkgreen;">Executable in MINT</b>
                    `: html`
                        <b>Not executable in MINT</b>
                    `} 
                  </div>
                  <div>
                    <span class="helper"></span>${this._model.logo ? 
                        html`<img src="${this._model.logo}"/>`
                        : html`<wl-icon id="img-placeholder">image</wl-icon>`
                    }
                  </div>
                  <div class="text-centered two-lines">
                    Category: ${this._model.hasModelCategory ? html`${this._model.hasModelCategory[0]}` : html`-`}
                    <br/>
                    Type: ${modelType ? modelType : '-'}
                  </div>
                </td>

                <td class="right">
                  <div class="header"> 
                    <span class="title">${this._model.label}</span>
                    <span class="icon"><wl-icon @click="${()=>{this._compare(this._model.uri)}}">compare_arrows</wl-icon></span>
                    <span class="ver-conf-text">
                    ${this._nVersions > 0 ? this._nVersions.toString() + ' version' + (this._nVersions > 1? 's' :'') : 'No versions'},
                    ${this._nConfigs > 0 ? this._nConfigs.toString() + ' config' + (this._nConfigs > 1? 's' :'') : 'No configs'}
                    </span>
                  </div>
                  <div class="content" style="${this.altDesc? '' : 'text-align: justify;'}">
                    ${this.altDesc ? 
                        html`<b>${this.altTitle}</b> ${this.altDesc.split(';').map((v, i) => {
                            if (i===0) return html`<code>${v}</code>`;
                            else return html`, <code>${v}</code>`;
                        })}`: 
                        this._model.desc}
                  </div>
                  ${this._regions ? html `
                  <div class="footer one-line" style="height: auto;">
                    <span class="keywords"> 
                        <b>Regions:</b> 
                        ${this._regions.map(r => r.label).join(', ')}
                    </span>
                  </div>` : ''}
                  <div class="footer one-line" style="padding-top: 0px;">
                    <span class="keywords"> 
                        <b>Keywords:</b> 
                        ${this._model.keywords && this._model.keywords.length > 0 ? 
                            this._model.keywords.join(';').split(/ *; */).join(', ') : 'No keywords'}
                    </span>
                    <a href="${this._regionid + '/'+ this._url}" class="details-button" @click="${this._goToThisModel}"> More details </a>
                  </div>
                </td>
              </tr>
            </table>
        `;
        } else {
            return html`Something when wrong!`
        }
    }

    _goToThisModel (e) {
        e.preventDefault();
        goToPage(this._url);
        return false;
    }

    _compare (uri:string) {
        store.dispatch(explorerCompareModel(uri));
    }

    stateChanged(state: RootState) {
        super.setRegionId(state);
        let db = state.modelCatalog;
        if (db && db.models[this.id] && db.models[this.id] != this._model) {
            this._model = db.models[this.id];
            if (this._model.hasVersion) {
                this._nVersions = this._model.hasVersion.length;
                this._nConfigs  = -1;
                this._nSetups   = -1;
                this._regions = null;
            } else {
                this._nVersions = 0;
                this._nConfigs  = 0;
                this._nSetups   = 0;
                this._regions = [];
            }
        }

        if (this._nVersions > 0 && this._nConfigs < 0 && db && Object.keys(db.versions).length > 0) {
            this._nConfigs = this._model.hasVersion
                    .map((ver:any) => db.versions[ver.id])
                    .filter((ver) => !!ver)
                    .reduce((sum:number, ver) => sum + (ver.hasConfiguration || []).length, 0);
            if (this._nConfigs === 0) this._nSetups = 0;
        }

        if (this._nConfigs > 0 && this._nSetups < 0 && db && Object.keys(db.configurations).length > 0) {
            this._nSetups = this._model.hasVersion
                    .map((ver:any) => db.versions[ver.id])
                    .filter((ver) => !!ver)
                    .reduce((sum:number, ver) =>
                            sum + (ver.hasConfiguration || [])
                                    .map((cfg:any) => db.configurations[cfg.id])
                                    .filter((cfg) => !!cfg)
                                    .reduce((sum2:number, cfg) => sum2 + (cfg.hasSetup || []).length, 0)
            , 0);
        }

        if (db && Object.keys(db.regions).length > 0 && Object.keys(db.setups).length > 0 && this._nSetups > 0 && !this._regions) {
            this._regions = [];

            this._model.hasVersion.forEach((ver:any) => {
                (db.versions[ver.id].hasConfiguration || []).forEach((cfg:any) => {
                    (db.configurations[cfg.id].hasSetup || []).forEach((setup:any) => {
                        console.log(setup, db.setups.length);
                        (db.setups[setup.id].hasRegion || []).forEach((reg:any) => {
                            this._regions.push( db.regions[reg.id] )
                        })
                    })
                })
            })
            console.log('r', this._regions );
        }


        /*if (this._model && db && db.versions && db.configurations && db.setups) {
            this._nVersions = this._model.hasVersion.map(v => v.id);
            console.log('1', db.versions);
            console.log('2', db.configurations);
            console.log('3', db.setups);
            //this._nConfig  = db.versions[this._model.id].
            //this._nSetup
        }*/

        /*if (db && db.models && db.models[this.id] && db.models[this.id].id != this._modelId) {
            console.log('ID Changed', this._modelId, '->', db.models[this.id].id);
            this._modelId = db.models[this.id].id;
        }*/

        /*if (state.explorer) {
            let db = state.explorer;
            if (db.models && db.models[this.uri]) {
                this._model = db.models[this.uri];
            }

            if (db.urls && db.urls[this.uri]) {
                this._url = 'models/explore/' + db.urls[this.uri];
            } else {
                this._url = 'models/explore/' + this.uri.split('/').pop();
            }

            if (db.versions && db.versions[this.uri]) {
                this._configs = db.versions[this.uri].reduce((acc, ver) => acc + (ver.configs ? ver.configs.length : 0), 0)
                db.versions[this.uri].forEach((v) => {
                    (v.configs || []).forEach((c) => {
                        if (c.calibrations && c.calibrations.length > 0 && this._model.regions) {
                            this._ready = true;
                        }
                    });
                });
            } else {
                this._configs = 0;
            }
        }
        this._vers = this._model && this._model.versions ? this._model.versions.length : 0;*/
    }

}
