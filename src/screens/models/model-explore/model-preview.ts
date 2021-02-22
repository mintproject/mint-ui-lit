
import { PageViewElement } from '../../../components/page-view-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../../../app/store';

import { html, property, customElement, css } from 'lit-element';

import { goToPage } from '../../../app/actions';
import { ExplorerStyles } from './explorer-styles'

import { getId, isEmpty, isSubregion, getLatestVersion, getLatestConfiguration, getLatestSetup,
         isExecutable, getLabel } from 'model-catalog/util';
import { IdMap } from 'app/reducers';
import { Model, SoftwareVersion, ModelConfiguration, ModelConfigurationSetup, Parameter, SoftwareImage,
         Person, Process, SampleResource, SampleCollection, Region, Image } from '@mintproject/modelcatalog_client';

import '../../../components/loading-dots';

@customElement('model-preview')
export class ModelPreview extends connect(store)(PageViewElement) {
    @property({type: String}) public id : string = "";
    @property({type: Number}) private _nVersions : number = -1;
    @property({type: Number}) private _nConfigs  : number = -1;
    @property({type: Number}) private _nSetups   : number = -1;
    @property({type: Number}) private _nLocalSetups : number = -1;
    @property({type: String}) private _url      : string = '';
    @property({type: Object}) private _regions  : null | Set<Region> = null;
    @property({type: Object}) private _model!   : Model;
    @property({type: Object}) private _logo!    : Image;
    @property({type: Boolean}) private _loadingLogo : boolean = false;

    private PREFIX : string = '/models/explore/';

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

                td.left div:nth-child(1) { min-height: 1.2em; }
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

                loading-dots {
                    --width: 20px;
                }

                .title:hover {
                    color:rgb(15, 122, 207);
                }
            `
        ];
    }

    protected render() {
        if (this._model) {
            //console.log(this._model);
            let modelType : string[] = this._model.type ?
                    this._model.type.map(t => t.replace("https://w3id.org/okn/o/sdm#", '').replace('Model', '')).filter(t => !!t)
                    : [];
            let modelUri : string = this._regionid + (this._url? this._url : this.PREFIX + getId(this._model));
        return html`
            <table>
              <tr>
                <td class="left"> 
                  <div class="text-centered">
                  ${this._nLocalSetups < 0 ? html`<loading-dots></loading-dots>`
                    : (this._nLocalSetups > 0 ? html`<b style="color: darkgreen;">Executable in MINT</b>`
                      : (this._nSetups > 0 ? html`<b>Executable in MINT in another region</b>`
                        : html`<b style="color: chocolate;">Not executable in MINT</b>`
                      )
                    )
                  }
                  </div>
                  <div>
                    <span class="helper"></span>
                    <a href="${modelUri}" style="color: unset; text-decoration: none;">
                    ${this._loadingLogo ? html`<wl-progress-spinner></wl-progress-spinner>`
                      : (this._logo && this._logo.value ? html`<img src="${this._logo.value[0]}"/>`
                        : html`<wl-icon id="img-placeholder">image</wl-icon>`
                      )
                    }
                    </a>
                  </div>
                  <div class="text-centered two-lines">
                    Category: ${this._model.hasModelCategory ? html`${this._model.hasModelCategory.map(getLabel).join(', ')}` : html`-`}
                    ${modelType && modelType.length > 0? html`
                    <br/>
                    Type: ${modelType}
                    ` : html``}
                  </div>
                </td>

                <td class="right">
                  <div class="header"> 
                    <a href="${modelUri}" style="color: unset; text-decoration: none;">
                        <span class="title">${this._model.label}</span>
                    </a>
                    <span class="icon">
                        <slot name="extra-icon"></slot>
                    </span>
                    <span class="ver-conf-text">
                    ${this._nVersions > 0 ? this._nVersions.toString() + ' version' + (this._nVersions > 1? 's' :'') : 'No versions'},
                    ${this._nConfigs > 0 ? this._nConfigs.toString() + ' config' + (this._nConfigs > 1? 's' :'') : 'No configs'}
                    </span>
                  </div>

                  <div class="content">
                    <slot name="description"></slot>
                  </div>

                  ${Array.from(this._regions || []).length > 0 ? html`
                  <div class="footer one-line" style="height: auto;">
                    <span class="keywords"> 
                        <b>Regions:</b> 
                        ${Array.from(this._regions).map(r => r.label).join(', ')}
                    </span>
                  </div>` : ''}
                  <div class="footer one-line" style="padding-top: 0px;">
                    <span class="keywords"> 
                        <b>Keywords:</b> 
                        ${this._model.keywords && this._model.keywords.length > 0 ? 
                            this._model.keywords.join(';').split(/ *; */).join(', ') : 'No keywords'}
                    </span>
                    <a href="${modelUri}" class="details-button"> 
                        More details
                    </a>
                  </div>
                </td>
              </tr>
            </table>
        `;
        } else {
            return html`Something when wrong!`
        }
    }

    stateChanged(state: RootState) {
        let lastParentRegion = this._regionid
        super.setRegionId(state);
        let db = state.modelCatalog;
        /* Load this model and, if is needed versions, configs and setups */
        if (db && db.models[this.id] && (db.models[this.id] != this._model || lastParentRegion != this._regionid)) {
            this._model = db.models[this.id];
            this._loadingLogo = (this._model.logo && this._model.logo.length > 0);

            if (this._model.hasVersion) {
                this._nVersions = this._model.hasVersion.length;
                this._nConfigs  = -1;
                this._nSetups   = -1;
                this._nLocalSetups = -1;
                this._regions = null;
                this._url = ''
            } else {
                this._nVersions = 0;
                this._nConfigs  = 0;
                this._nSetups   = 0;
                this._nLocalSetups = 0;
                this._regions = new Set();
                this._url = this.PREFIX + getId(this._model);
            }
        }

        if (this._loadingLogo && !isEmpty(db.images) && db.images[(this._model.logo[0] as Image).id]) {
            this._loadingLogo = false;
            this._logo = db.images[(this._model.logo[0] as Image).id];
        }

        if (this._nVersions > 0 && this._nConfigs < 0 && !isEmpty(db.versions)) {
            let lastVersion : SoftwareVersion | null = null;
            this._nConfigs = this._model.hasVersion
                    .map((ver:any) => db.versions[ver.id])
                    .filter((ver:SoftwareVersion) => !!ver)
                    .reduce((sum:number, ver:SoftwareVersion) => {
                        lastVersion = getLatestVersion(lastVersion, ver);
                        return sum + (ver.hasConfiguration || []).length;
                    }, 0);
            if (this._nConfigs === 0) {
                this._nSetups = 0;
                this._nLocalSetups = 0;
                this._url = this.PREFIX + getId(this._model) + (lastVersion ? '/' + getId(lastVersion) : '');
            }
        }

        if (this._nConfigs > 0 && this._nSetups < 0 && !this._regions && this._region &&
                ![db.configurations, db.regions].map(isEmpty).some(b=>b)) {
            // We filter for region, so we need to compute the url, local setups and regions.
            this._regions = new Set();
            this._nLocalSetups = 0;

            let lastVersion : SoftwareVersion | null = null;
            let lastConfig : ModelConfiguration | null = null;
            let lastSetup : ModelConfigurationSetup | null = null;

            // Count setups and compute url and regions.
            this._nSetups = this._model.hasVersion
                    .map((ver:any) => db.versions[ver.id])
                    .filter((ver:SoftwareVersion) => { 
                        if (!lastSetup)
                            lastVersion = getLatestVersion(lastVersion, ver);
                        return !!ver;
                    })
                    .reduce((sum:number, ver:SoftwareVersion) =>
                            sum + (ver.hasConfiguration || [])
                                    .map((cfg:any) => db.configurations[cfg.id])
                                    .filter((cfg:ModelConfiguration) => {
                                        if (!lastSetup && lastVersion === ver)
                                            lastConfig = getLatestConfiguration(lastConfig, cfg);
                                        return !!cfg;
                                    })
                                    .reduce((sum2:number, cfg:ModelConfiguration) =>
                                        sum2 + (cfg.hasSetup || [])
                                                .map((setup:any) => db.setups[setup.id])
                                                .filter((setup:ModelConfigurationSetup) => isExecutable(setup))
                                                .reduce((sum3:number, setup:ModelConfigurationSetup) => {
                                                    (setup.hasRegion || [])
                                                            .map((reg:any) => db.regions[reg.id])
                                                            .forEach((reg:Region) => {
                                                                if (isSubregion(this._region.model_catalog_uri,reg)) {
                                                                    this._nLocalSetups += 1;
                                                                    this._regions.add(reg);
                                                                    if (!lastSetup) {
                                                                        lastSetup = setup;
                                                                        lastConfig = cfg;
                                                                        lastVersion = ver;
                                                                    } else {
                                                                        let s_ver = getLatestVersion(lastVersion, ver);
                                                                        if (s_ver != lastVersion) {
                                                                            lastSetup = setup;
                                                                            lastConfig = cfg;
                                                                            lastVersion = ver;
                                                                        }
                                                                    }
                                                                }
                                                            });
                                                    return sum3 + 1;
                                                }, 0)
                                    , 0)
            , 0);
            this._url = this.PREFIX + getId(this._model) + (lastVersion ?
                ('/' +  getId(lastVersion) + (lastConfig ?
                    '/' + getId(lastConfig) + (lastSetup ? 
                        '/' + getId(lastSetup)
                        : '')
                    : '')
                )
                : '')
        }
    }
}
