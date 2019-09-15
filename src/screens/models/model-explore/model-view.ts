import { html, property, customElement, css } from 'lit-element';

import { PageViewElement } from '../../../components/page-view-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../../../app/store';

import { FetchedModel, IODetail, VersionDetail, ConfigDetail, CalibrationDetail, CompIODetail,
         ExplanationDiagramDetail } from "../../../util/api-interfaces";
import { fetchCompatibleSoftwareForConfig, fetchParametersForConfig, fetchVersionsForModel, 
        fetchIOAndVarsSNForConfig, fetchVarsSNAndUnitsForIO, fetchDiagramsForModelConfig,
        fetchMetadataForModelConfig, fetchMetadataNoioForModelConfig } from '../../../util/model-catalog-actions';
import { explorerSetMode } from './ui-actions';
import { SharedStyles } from '../../../styles/shared-styles';
import { ExplorerStyles } from './explorer-styles'

import { goToPage } from '../../../app/actions';
import "weightless/expansion";
import "weightless/tab";
import "weightless/tab-group";
import "weightless/card";
import "weightless/icon";
import "weightless/progress-spinner";
import "weightless/progress-bar";
import '../../../components/image-gallery'

function capitalizeFirstLetter (s:string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

@customElement('model-view')
export class ModelView extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _model! : FetchedModel;
    _modelId: string = '';
    _versionId: string = '';
    _configId: string = '';

    @property({type: String})
    private _uri : string = "-";

    @property({type: Number})
    private _count : number = 0;

    @property({type: Object})
    private _configMetadata: any = null;

    @property({type: Object})
    private _calibrationMetadata: any = null;

    @property({type: Object})
    private _parameters: any = null;

    @property({type: Object})
    private _inputs : IODetail[] | null = null;

    @property({type: Object})
    private _outputs : IODetail[] | null = null;

    @property({type: Object}) //map IO_URI -> [Variables...]
    private _variables : any = {};

    private _IOStatus : Set<string> = new Set();
    private _allVersions : any = null;
    private _allModels : any = null;
    private _uriToUrl : Map<string,string> | null = null;

    @property({type: Object})
    private _versions!: VersionDetail[];

    @property({type: Object})
    private _version : VersionDetail | null = null;

    @property({type: Object})
    private _config : ConfigDetail | null = null;

    @property({type: Object})
    private _calibration : CalibrationDetail | null = null;

    @property({type: Object})
    private _compInput : CompIODetail[] | null = null;
    
    @property({type: Object})
    private _compOutput : CompIODetail[] | null = null;

    @property({type: Object})
    private _compModels : FetchedModel[] | null = null;

    @property({type: Object})
    private _explDiagrams : ExplanationDiagramDetail[] | null = null;

    @property({type: String})
    private _tab : 'overview'|'io'|'variables'|'software' = 'overview';

    constructor () {
        super();
        this.active = true;
    }

    static get styles() {
        return [SharedStyles, ExplorerStyles,
            css `
                #hack {
                    display: none;
                }

                ul {
                    text-align: left;
                }

                li {
                    margin-bottom: 0.3em;
                }

                table {
                  margin: 0 auto;
                  border: 0px solid black;
                  //width: 80%;
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

                .select-css {
                    float: right;
                    display: inline-block;
                    font-size: 1.1em;
                    font-family: sans-serif;
                    font-weight: 600;
                    color: #444;
                    line-height: 1.2em;
                    padding: .3em .7em .25em .4em;
                    width: calc(100% - 180px);
                    max-width: calc(100%; - 180px);
                    box-sizing: border-box;
                    margin: 0;
                    border: 1px solid #aaa;
                    box-shadow: 0 1px 0 1px rgba(0,0,0,.04);
                    border-radius: .5em;
                    -moz-appearance: none;
                    -webkit-appearance: none;
                    appearance: none;
                    background-color: #fff;
                    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E'),
                      linear-gradient(to bottom, #ffffff 0%,#e5e5e5 100%);
                    background-repeat: no-repeat, repeat;
                    background-position: right .7em top 50%, 0 0;
                    background-size: .65em auto, 100%;
                    margin-bottom: 10px;
                }

                .select-css::-ms-expand {
                    display: none;
                }

                .select-css:hover {
                    border-color: #888;
                }

                .select-css:focus {
                    border-color: #aaa;
                    box-shadow: 0 0 1px 3px rgba(59, 153, 252, .7);
                    box-shadow: 0 0 0 3px -moz-mac-focusring;
                    color: #222;
                    outline: none;
                }

                .select-css option {
                    font-weight:normal;
                }

                .select-label {
                    padding: .3em .7em .25em .4em;
                    display: inline-block;
                    font-size: 1.2em;
                    font-weight: bold;
                    width: 120px;
                    text-align: right;
                    margin-bottom: 10px;
                }

                .tooltip {
                    cursor: help;
                    display: inline-block;
                    position: relative;
                    float: right;
                    margin: 5px 5px 0px 5px;
                }

                .tooltip:hover:after {
                    background: #333;
                    background: rgba(0, 0, 0, .8);
                    border-radius: 5px;
                    bottom: 26px;
                    color: #fff;
                    content: attr(tip);
                    right: 20%;
                    padding: 5px 15px;
                    position: absolute;
                    z-index: 98;
                    width: 300px;
                }

                .tooltip:hover:before {
                    border: solid;
                    border-color: #333 transparent;
                    border-width: 6px 6px 0 6px;
                    bottom: 20px;
                    content: "";
                    right: 42%;
                    position: absolute;
                    z-index: 99;
                }
                
                #edit-model-icon {
                    float: right;
                    --icon-size: 26px;
                    padding-top: 4px;
                    cursor: pointer;
                }

                .wrapper {
                    display:grid;
                    grid-gap:4px;
                    grid-template-columns: 1fr 1fr 1fr 1fr;
                    //border: 1px dotted red;
                }

                .small-wrapper {
                    display:grid;
                    grid-gap:5px;
                    grid-template-columns: 1fr 1fr;
                    margin-bottom: 5px;
                }
                
                .col-img {
                    //border:1px dotted blue;
                    grid-column: 1 / 2;
                    grid-row: 1;
                    padding: 16px;
                }

                .col-img > img {
                    max-height: 200px;
                }

                .col-img > div {
                    margin-top: 6px;
                }

                .col-desc {
                    //border:1px dotted green;
                    grid-column: 2 / 5;
                    grid-row: 1;
                }

                .col-desc > wl-select {
                    width: calc(100% - 40px);
                }

                .col-desc > .tooltip > wl-icon {
                    padding-top: 16px;
                    --icon-size: 24px;
                }

                #desc-ext {
                    padding: 10px 5px 0px 5px;
                }

                #desc-ext > wl-text {
                    display: block;
                    margin-bottom: 5px;
                }
                
                .row-tab-header {
                    grid-column: 1 / 5;
                    grid-row: 2;
                }
                
                .row-tab-content {
                    grid-column: 1 / 5;
                    grid-row: 3;
                }
                
                .info-center {
                    text-align: center;
                    font-size: 13pt;
                    height: 32px;
                    line-height:32px;
                    color: #999;
                }

                .inline-info {
                    padding-top:4px;
                    padding-left:5px;
                }
                .inline-info > span {
                    display: inline-block;
                    width: 33%;
                }
                .inline-info > span:before {
                    content:"• ";
                }
                
                .hidden {
                    display: none;
                }
                
                .metadata-top-buttons {
                    float: right;
                }

                .metadata-top-buttons > .button-preview {
                    margin-left: 4px;
                }

                .button-preview {
                    cursor: pointer;
                    display: inline-block;
                }

                .button-preview > div {
                    display: inline-block;
                    border-top: 1px solid #D9D9D9;
                    border-bottom: 1px solid #D9D9D9;
                    padding: 3px 6px;
                }

                .button-preview:hover > div:not(:first-child) {
                    background-color: #F2F2F2;
                }

                .button-preview:hover > div:first-child {
                    background-color: #E9E9E9;
                }

                .button-preview > div:first-child {
                    border-left: 1px solid #D9D9D9;
                    background-color: #F6F6F6;
                    font-weight: 500;
                    border-bottom-left-radius: 5px;
                    border-top-left-radius: 5px;
                }

                .button-preview > div:last-child {
                    border-right: 1px solid #D9D9D9;
                    border-left: 1px solid #D9D9D9;
                    border-bottom-right-radius: 5px;
                    border-top-right-radius: 5px;
                }
                `
        ];
    }

    _setEditMode () {
        //TODO: this is work in progress!
        //store.dispatch(explorerSetMode('edit')); 
    }

    _updateConfigSelector () {
        let configSelectorWl = this.shadowRoot!.getElementById('config-selector');
        let configSelector = configSelectorWl? configSelectorWl.getElementsByTagName('select')[0] : null;
        if (configSelector) {
            while (configSelector.options.length > 0) {
                configSelector.remove(configSelector.options.length - 1);
            }
            this._versions.forEach((v:any) => {
                let newOption = document.createElement('option');
                newOption.text = v.label;
                newOption.disabled = true;
                configSelector.add(newOption, null);
                (v.configs || []).forEach((c:any) => {
                    let newOption = document.createElement('option');
                    newOption.text = '\xA0\xA0' + c.label;
                    newOption.value = c.uri;
                    configSelector.add(newOption, null);
                })
            })
            configSelector.value = this._config ? this._config.uri : '';
            configSelectorWl.refreshAttributes();
        }
    }

    _updateCalibrationSelector () {
        let calibrationSelectorWl = this.shadowRoot!.getElementById('calibration-selector');
        let calibrationSelector = calibrationSelectorWl? calibrationSelectorWl.getElementsByTagName('select')[0] : null;
        if (calibrationSelector && this._config) {
            while (calibrationSelector.options.length > 0) {
                calibrationSelector.remove(calibrationSelector.options.length - 1);
            }
            let unselect = document.createElement('option');
            unselect.text = '\xA0\xA0No setup selected'
            unselect.value = '';
            calibrationSelector.add(unselect, null);
            (this._config.calibrations || []).forEach((c:any) => {
                let newOption = document.createElement('option');
                newOption.text = '\xA0\xA0' + c.label;
                newOption.value = c.uri;
                calibrationSelector.add(newOption, null);
            })
            calibrationSelector.value = this._calibration ? this._calibration.uri : '';
            calibrationSelectorWl.refreshAttributes();
        }
    }

    _onConfigChange () {
        let configSelectorWl = this.shadowRoot!.getElementById('config-selector');
        let configSelector = configSelectorWl? configSelectorWl.getElementsByTagName('select')[0] : null;
        if (configSelector) {
            if (this._uriToUrl[configSelector.value]) {
                goToPage(this._uriToUrl[configSelector.value]);
            } else {
                console.error('Theres no URL for selected config URI, please report this issue!');
            }
        }
    }

    _onCalibrationChange () {
        let calibrationSelectorWl = this.shadowRoot!.getElementById('calibration-selector');
        let calibrationSelector = calibrationSelectorWl? calibrationSelectorWl.getElementsByTagName('select')[0] : null;
        if (calibrationSelector) {
            if (this._uriToUrl[calibrationSelector.value]) {
                goToPage(this._uriToUrl[calibrationSelector.value]);
            } else if (calibrationSelector.value === '') {
                let id = this._config.uri.split('/').pop();
                let fullURI = this._uriToUrl[this._config.uri]
                let sp = fullURI.split('/')
                let frg = '';
                do {
                    frg = sp.pop();
                } while (frg != id);
                sp.push(frg);
                let uri = sp.join('/');
                goToPage(uri);
            } else {
                console.error('Theres no URL for selected configuration setup URI, please report this issue!');
            }
        }
    }

    _renderSelectors () {
        if (!this._versions) {
            return html`<wl-progress-bar></wl-progress-bar>`;
        }
        let hasVersions = (this._versions.length > 0);
        let hasCalibrations = !!(this._config && this._config.calibrations);
        return html`
            <span tip="A model configuration is a unique way of running a model, exposing concrete inputs and outputs" class="tooltip">
                <wl-icon>help_outline</wl-icon>
            </span>
            <wl-select label="Select a configuration" id="config-selector" @input="${this._onConfigChange}"
                class="${hasVersions? '' : 'hidden'}">
            </wl-select>

            <span tip="A model configuration setup represents a model with parameters that have been adjusted (manually or automatically) to be run in a specific region" class="tooltip">
                <wl-icon>help_outline</wl-icon>
            </span>
            <wl-select label="Select a configuration setup" id="calibration-selector" @input="${this._onCalibrationChange}"
                class="${hasCalibrations? '' : 'hidden'}">
            </wl-select>

            <div class="info-center ${hasVersions? 'hidden' : ''}">- No version available -</div>
            <div class="info-center ${(hasCalibrations || !hasVersions || (hasVersions && !this._config))? 'hidden': ''}">- No configuration setup available <a>add one</a> -</div>
        `
    }

    protected render() {
        if (!this._model) return html``;
        return html`
            <div class="wrapper">
                <div class="col-img text-centered">
                    ${this._model.logo ? 
                    html`<img src="${this._model.logo}"/>`
                    : html`<img src="http://www.sclance.com/pngs/image-placeholder-png/image_placeholder_png_698412.png"/>`}
                    ${this._model.dateC ? html`<div><b>Creation date:</b> ${this._model.dateC}</div>`:''}
                    ${this._model.categories ? html`<div><b>Category:</b> ${this._model.categories}</div>`:''}
                    ${this._model.type ? html`<div><b>Model type:</b> ${this._model.type}</div>`:''}
                </div>
                <div class="col-desc" style="text-align: justify;">
                    <wl-title level="2">
                        ${this._model.label}
                        <a @click="${this._setEditMode}"><wl-icon id="edit-model-icon">edit</wl-icon></a>
                    </wl-title>
                    <wl-divider style="margin-bottom: .5em;"></wl-divider>
                    <wl-text >${this._model.desc}</wl-text>
                    <div id="desc-ext">
                        ${this._model.authors? html`<wl-text><b>• Authors:</b> ${ this._model.authors.join(', ') }</wl-text>` :''}
                        ${this._model.fundS? html`<wl-text><b>• Funding:</b> ${ this._model.fundS }</wl-text>` :''}
                        ${this._model.publisher? html`<wl-text><b>• Publisher:</b> ${ this._model.publisher }</wl-text>` :''}
                        ${this._model.dateP? html`<wl-text><b>• Publication date:</b> ${ this._model.dateP }</wl-text>` :''}
                        ${this._model.referenceP? html`<wl-text><b>• Preferred citation:</b> <i>${ this._model.referenceP }<i></wl-text>` :''}
                    </div>
                    ${this._renderSelectors()}
                </div>

                <div class="row-tab-header">
                    <wl-tab-group>
                        <wl-tab id="tab-overview" ?checked=${this._tab=='overview'} @click="${() => {this._tab = 'overview'}}"
                            >Overview</wl-tab>
                        <wl-tab id="tab-io" ?checked=${this._tab=='io'} @click="${() => {this._tab = 'io'}}"
                            >Input/Output</wl-tab>
                        <wl-tab id="tab-variable" ?checked=${this._tab=='variables'} @click="${() => {this._tab = 'variables'}}"
                            >Variables</wl-tab>
                        <wl-tab id="tab-software" @click="${() => {this._tab = 'software'}}"
                            >Compatible Software</wl-tab>
                        <wl-tab id="tab-overview" ?checked=${this._tab=='tech'} @click="${() => {this._tab = 'tech'}}"
                            >Technical Information</wl-tab>
                    </wl-tab-group>
                </div>

                <div class="row-tab-content">
                    ${(this._tab === 'overview') ? this._renderTabOverview() : ''}
                    ${(this._tab === 'tech') ? this._renderTabTechnical() : ''}
                    ${(this._tab === 'io') ? this._renderTabIO() : ''}
                    ${(this._tab === 'variables') ? this._renderTabVariables() : ''}
                    ${(this._tab === 'software') ? this._renderTabSoftware() : ''}
                </div>
            </div>`
    }

    _renderTabTechnical () {
        return html`
            <table class="pure-table pure-table-striped">
                <tbody>
                    ${this._model.os? html`
                    <tr>
                        <td><b>Operating systems:</b></td>
                        <td>${this._model.os.join(', ')}</td>
                    </tr>`
                    : ''}
                    ${this._model.pl? html`
                    <tr>
                        <td><b>Programing languages:</b></td>
                        <td>${this._model.pl.join(', ')}</td>
                    </tr>`
                    : ''}
                    ${this._model.memReq? html`
                    <tr>
                        <td><b>Memory requirements:</b></td>
                        <td>${this._model.memReq}</td>
                    </tr>` : ''}
                    ${this._model.procReq? html`
                    <tr>
                        <td><b>Processor requirements:</b></td>
                        <td>${this._model.procReq}</td>
                    </tr>` : ''}
                    ${this._model.softwareReq? html`
                    <tr>
                        <td><b>Software requirements:</b></td>
                        <td>${this._model.softwareReq}</td>
                    </tr>` : ''}
                    ${this._model.downloadURL? html`
                    <tr>
                        <td><b>Download:</b></td>
                        <td><a target="_blank" href="${this._model.downloadURL}">${this._model.downloadURL}</a></td>
                    </tr>` : ''}
                    ${this._model.sourceC? html`
                    <tr>
                        <td><b>Source code:</b></td>
                        <td><a target="_blank" href="${this._model.sourceC}">${this._model.sourceC}</a></td>
                    </tr>` : ''}
                    ${this._model.doc? html`
                    <tr>
                        <td><b>Documentation:</b></td>
                        <td><a target="_blank" href="${this._model.doc}">${this._model.doc}</a></td>
                    </tr>` : ''}
                    ${this._model.installInstr? html`
                    <tr>
                        <td><b>Installation instructions:</b></td>
                        <td><a target="_blank" href="${this._model.installInstr}">${this._model.installInstr}</a></td>
                    </tr>` : ''}
                </tbody>
            </table>
        `
    }

    _renderSelector () {
        return html`
        <span tip="Currently selected model version" class="tooltip">
            <wl-icon>help_outline</wl-icon>
        </span>
        <span class="select-label">Version:</span>
        <select id="select-version" class="select-css" label="Select version" @change="${this.changeVersion}">
            <option value="" disabled ?selected="${this._version === null}">Select version</option>
            ${this._versions.map(v => 
                html`<option value="${v.uri}" ?selected=${this._version && v.uri===this._version.uri}>
                    ${v.label}
                </option>`)}
        </select>
        ${(this._version && this._version.configs) ?
            html`
            <span tip="A model configuration is a unique way of running a model, exposing concrete inputs and outputs" class="tooltip">
                <wl-icon>help_outline</wl-icon>
            </span>
            <span class="select-label">Configuration:</span>
            <select id="select-config" class="select-css" label="Select configuration" @change="${this.changeConfig}">
                <option value="" disabled ?selected="${this._config === null}">Select configuration</option>
                ${this._version.configs.map( c =>
                    html`<option value="${c.uri}" ?selected=${this._config && c.uri===this._config.uri}>
                        ${c.label}
                    </option>`
                )}
            </select>
            ${(this._config && this._config.calibrations) ?

                html`
                <span tip="A model calibration represents a model with parameters that have been adjusted (manually or automatically) to be run in a specific region" class="tooltip">
                    <wl-icon>help_outline</wl-icon>
                </span>
                <span class="select-label">Calibration:</span>
                <select id="select-calibration" class="select-css" label="Select calibration" @change="${this.changeCalibration}">
                    <option value="" ?selected="${this._calibration===null}">Select calibration</option>
                    ${this._config.calibrations.map( c =>
                        html`<option value="${c.uri}"
                        ?selected="${this._calibration && c.uri===this._calibration.uri}">
                            ${c.label}
                        </option>`
                    )}
                </select>
                `
                :html``
            }
            `
            :html``
        }`
    }

    _setTab (tabName: 'overview'|'io'|'variables'|'software') {
        this._tab = tabName;
    }

    _changeTab (tabName: string) {
        let tabId : string = '';
        switch (tabName) {
            case 'io':
                tabId = 'tab-io';
                break;
            case 'variable':
                tabId = 'tab-variable';
                break;
            default: return;
        }
        let ioElement : HTMLElement | null = this.shadowRoot!.getElementById(tabId);
        if (ioElement && tabId) {
            ioElement.click();
        }
    }

    _expandVariable (varLabel:string) {
        if (varLabel) {
            this._changeTab('variable');
            setTimeout(() => {
                let exp : HTMLElement | null = this.shadowRoot!.getElementById(varLabel);
                if (exp) {
                    exp.click();
                }
                }, 200)
        }
    }

    _renderTabs () {
        return html`
            <tr>
                <td class="content" colspan="2">
                    <br/>
                    <wl-tab-group>
                        <wl-tab ?checked=${this._tab=='overview'}
                            @click="${() => {this._setTab('overview')}}">Overview</wl-tab>
                        <wl-tab ?checked=${this._tab=='io'} id="tab-io"
                            @click="${() => {this._setTab('io')}}">Input/Output</wl-tab>
                        <wl-tab ?checked=${this._tab=='variables'} id="tab-variable"
                            @click="${() => {this._setTab('variables')}}">Variables</wl-tab>
                        <wl-tab @click="${() => {this._setTab('software')}}">Compatible Software</wl-tab>
                    </wl-tab-group>
                    <div>${this._renderTab(this._tab)}<div>
                </td>
            </tr>
        `
    }

    _renderLink (url) {
        let sp = url.split('/')
        return html`<a target="_blank" href="${url}">${sp[sp.length-1] || sp[sp.length-2]}</a>`
    }

    _renderTabOverview () {
        return html`
            ${this._config ? this._renderMetadataResume() : ''}
            ${this._model.purpose? html`
            <details style="margin-bottom: 6px;">
                <summary><b>Purpose</b></summary>
                <ul>
                ${this._model.purpose.map(a => a? html`<li>${a}.</li>`: '')}
                </ul>
            </details>`
            :html``}

            ${this._model.assumptions? html`
            <details style="margin-bottom: 6px;">
                <summary><b>Assumptions</b></summary>
                <ul>
                ${this._model.assumptions.split('.').map(a=> a?html`<li>${a}.</li>`:'')}
                </ul>
            </details>
            `:html``}

            ${this._renderGallery()}`
    }

    _renderMetadataResume (meta) {
        let data = [
            [this._config, this._configMetadata, 'configuration'], 
            [this._calibration, this._calibrationMetadata, 'configuration setup']
        ]
        return data.map(([obj, meta, title]) => 
            obj ? html` 
            <fieldset style="border-radius: 5px; padding-top: 0px; border: 2px solid #D9D9D9; margin-bottom: 8px;">
                <legend style="font-weight: bold; font-size: 12px; color: gray;">Selected ${title}</legend>


                <div class="metadata-top-buttons">
                    <div class="button-preview" @click=${() => this._changeTab('io')}>
                        <div>Input files</div>
                        <div>${!this._inputs? html`
                            <object style="width: 20px;" type="image/svg+xml" data="images/dots.svg"></object>`
                            : this._inputs.length}
                        </div>
                    </div>
                    <div class="button-preview" @click=${() => this._changeTab('io')}>
                        <div>Output files</div>
                        <div>${!this._outputs? html`
                            <object style="width: 20px;" type="image/svg+xml" data="images/dots.svg"></object>`
                            : this._outputs.length}
                        </div>
                    </div>
                    <div class="button-preview" @click=${() => this._changeTab('io')}>
                        <div>Parameters</div>
                        <div>${!this._parameters ? html`
                            <object style="width: 20px;" type="image/svg+xml" data="images/dots.svg"></object>`
                            : this._parameters.length}
                        </div>
                    </div>
                </div>
                <wl-title level="2" style="font-size: 16px;">${obj.label}</wl-title>

                ${!meta ? 
                html`<div class="text-centered"><wl-progress-spinner></wl-progress-spinner></div>`
                : (meta.length==0 ?
                    html`<div class="info-center">- No metadata available. -</div>`
                    : html `
                    <wl-text>${meta[0].desc}</wl-text>
                    <ul>
                    ${meta[0].regionName ? html`<li><b>Region:</b> ${meta[0].regionName}</li>`: ''}
                    ${meta[0].tIValue && meta[0].tIUnits ? html`<li><b>Time interval:</b> ${meta[0].tIValue + ' ' + meta[0].tIUnits}</li>` : ''}
                    ${meta[0].gridType && meta[0].gridDim && meta[0].gridSpatial ? html`
                        <li><b>Grid details:</b> 
                            <ul>
                                <li><b>Type:</b> ${meta[0].gridType}</li>
                                <li><b>Dimentions:</b> <span style="font-family: system-ui;">${meta[0].gridDim}</span></li>
                                <li><b>Spatial resolution:</b> ${meta[0].gridSpatial}</li>
                            </ul>
                        </li>
                    `: ''}
                    ${meta[0].processes ? html`<li><b>Processes:</b> ${meta[0].processes.join(', ')}</li>`: ''}
                    ${meta[0].paramAssignMethod ? html`<li><b>Parameter assignment method:</b> ${meta[0].paramAssignMethod}</li>`: ''}
                    ${meta[0].adjustableVariables ? html`<li><b>Adjustable parameters:</b> ${meta[0].adjustableVariables.map((v,i) => {
                        if (i === 0) return html`<code>${v}</code>`;
                        else return html`, <code>${v}</code>`;
                    })}</li>`: ''}
                    ${meta[0].targetVariables ? html`<li><b>Target variables:</b> ${meta[0].targetVariables.map((v,i) => {
                        if (i === 0) return html`<code>${v}</code>`;
                        else return html`, <code>${v}</code>`;
                    })}</li>`: ''}
                    ${meta[0].compLoc ?  html`
                        <li><b>Download:</b> ${this._renderLink(meta[0].compLoc)}
                            <span tip="This download is an executable containing the code used to execute this ${title}." class="tooltip">
                                <wl-icon style="--icon-size: 18px; vertical-align: text-bottom; margin-left: 5px;">help_outline</wl-icon>
                            </span>
                        </li>`
                        : ''}
                    </ul>
                    `
                )}
            </fieldset>
            ` : '' )
    }

    _renderMetadataTable () {
        if (!this._configMetadata && !this._calibrationMetadata && this._config) {
            return html`<div class="text-centered"><wl-progress-spinner></wl-progress-spinner></div>`;
        }

        let meta = [];
        if (this._configMetadata && this._configMetadata.length>0) meta.push(this._configMetadata[0]);
        if (this._calibrationMetadata && this._calibrationMetadata.length>0) meta.push(this._calibrationMetadata[0]);

        if (meta.length === 0) {
            return html``;
        }

        let features = [];
        if (meta.filter((m:any) => m['regionName']).length>0)
            features.push({name: 'Region name', render: (m) => m['regionName']})
        if (meta.filter((m:any) => m['desc']).length>0)
            features.push({name: 'Description', render: (m) => m['desc']})
        if (meta.filter((m:any) => m['input_variables']).length>0)
            features.push({name: 'Input files', render: (m) => m['input_variables'].join(', ')})
        if (meta.filter((m:any) => m['output_variables']).length>0)
            features.push({name: 'Output files', render: (m) => m['output_variables'].join(', ')})
        if (meta.filter((m:any) => m['parameters']).length>0)
            features.push({name: 'Parameters', render: (m) => m['parameters'].join(', ')})
        if (meta.filter((m:any) => m['processes']).length>0)
            features.push({name: 'Processes', render: (m) => m['processes'].join(', ')})
        if (meta.filter((m:any) => m['tIValue']).length>0 && meta.filter((m:any) => m['tIUnits']))
            features.push({name: 'Time interval', render: (m) => m['tIValue'] + ' ' + m['tIUnits']})
        if (meta.filter((m:any) => m['gridType']).length>0)
            features.push({name: 'Grid type', render: (m) => m['gridType']})
        if (meta.filter((m:any) => m['gridDim']).length>0)
            features.push({name: 'Grid dimentions', render: (m) => m['gridDim']})
        if (meta.filter((m:any) => m['gridSpatial']).length>0)
            features.push({name: 'Spatial resolution', render: (m) => m['gridSpatial']})
        if (meta.filter((m:any) => m['paramAssignMethod']).length>0)
            features.push({name: 'Parameter assignment method', render: (m) => m['paramAssignMethod']})
        if (meta.filter((m:any) => m['adjustableVariables']).length>0)
            features.push({name: 'Adjustable parameters', render: (m) => (m['adjustableVariables']||[]).join(', ')})
        if (meta.filter((m:any) => m['targetVariables']).length>0)
            features.push({name: 'Target variables', render: (m) => (m['targetVariables']||[]).join(', ')})
        if (meta.filter((m:any) => m['compLoc']).length>0)
            features.push({name: 'Download', render: (m) => m['compLoc'] ? this._renderLink(m['compLoc']) : ''})


        return html`
            <h3>Metadata:</h3>
            <table class="pure-table pure-table-striped">
                <thead>
                    <th></th>
                    <th>
                        <div style="font-size: 12px;">Selected configuration:</div>
                        <div style="font-size: 14px; color: black; font-weight: bold;">${meta[0].label}<b>
                    </th>
                    ${this._calibration && (!this._calibrationMetadata || this._calibrationMetadata.length > 0) ? html`
                    <th>${(this._calibrationMetadata || []).length > 0 ? html`
                        <div style="font-size: 12px;">Selected configuration setup:</div>
                        <div style="font-size: 14px; color: black; font-weight: bold;">${meta[1].label}<b>`
                        : html`
                        <div style="font-size: 12px;">Loading setup...</div>
                        <wl-progress-bar style="width: 100px"></wl-progress-bar>
                        `}
                    </th>`
                    :''}
                </thead>
                <tbody>
                    ${features.map((ft:any) => html`
                    <tr>
                        <td><b>${ft.name}</b></td>
                        ${meta.map((m:any) => html`<td>${ft.render(m)}</td>`)}
                    </tr>
                    `)}
                    <tr>
                        <td>
                        </td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    _renderTabIO () {
        return html`
            ${(this._inputs) ? html`
            <h3> Inputs: </h3>
            <table class="pure-table pure-table-bordered">
                <thead>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Format</th>
                    ${this._calibration? html`<th>Value in this setup</th>` : html``}
                </thead>
                <tbody>
                ${this._inputs.map( io => html`
                    <tr>
                        <td><span class="clickable" @click="${()=>{this._expandVariable(io.label as string)}}">
                            ${io.label}
                        </span></td>
                        <td>${io.desc}</td>
                        <td>${io.format}</td>
                        ${this._calibration? html`
                        <td>${io.fixedValueURL ? html`
                            <a target="_blank" href="${io.fixedValueURL}">${io.fixedValueURL.split('/').pop()}</a>
                        ` : html``}</td>
                        ` : html``}
                    </tr>`)}
                </tbody>
            </table>` : html``}

            ${(this._outputs) ? html`
            <h3> Outputs: </h3>
            <table class="pure-table pure-table-bordered">
                <thead>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Format</th>
                    ${this._calibration? html`<th>Value in this setup</th>` : html``}
                </thead>
                <tbody>
                ${this._outputs.map( io => html`
                    <tr>
                        <td><span class="clickable" @click="${()=>{this._expandVariable(io.label as string)}}">
                            ${io.label}
                        </span></td>
                        <td>${io.desc}</td>
                        <td>${io.format}</td>
                        ${this._calibration? html`
                        <td>${io.fixedValueURL ? html`
                            <a target="_blank" href="${io.fixedValueURL}">${io.fixedValueURL.split('/').pop()}</a>
                        ` : html``}</td>
                        ` : html``}
                    </tr>`)}
                </tbody>
            </table>` : html``}

            ${(this._parameters)? this._renderParametersTable() : html``}
            ${(!this._inputs && !this._outputs && !this._parameters)? html`
            <br/>
            <h3 style="margin-left:30px">
                This information has not been specified yet.
            </h3>`
            :html ``}
            `;
    }

    _renderParametersTable () {
        return html`
            <h3> Parameters: </h3>
            <table class="pure-table pure-table-bordered">
                <thead>
                    <th style="text-align: right;">#</th>
                    <th>Description</th>
                    <th>Name</th>
                    <th style="text-align: right;">Default value</th>
                    ${this._calibration? html`<th style="text-align: right;">Value in this setup</th>` : html``}
                </thead>
                <tbody>
                ${this._parameters.sort((a,b) => (a.position < b.position) ? -1 : (a.position > b.position? 1 : 0)).map( (p:any) => html`
                    <tr>
                        <td style="text-align: right;">${p.position}</td>
                        <td>
                            <b style="font-size: 14px;">${ capitalizeFirstLetter(p.description) }</b><br/>
                            ${p.minVal && p.maxVal ? html`
                            The range is from ${p.minVal} to ${p.maxVal}
                            ` : ''}
                        </td>
                        <td>
                            <code>${p.paramlabel}</code><br/>
                        </td>
                        <td class="font-numbers" style="text-align: right;">${p.defaultvalue}</td>
                        ${this._calibration? html`<td class="font-numbers" style="text-align: right;">${p.fixedValue || '-'}</td>` : html``}
                    </tr>`)}
                </tbody>
            </table>
        `
    }

    _renderTabVariables () {
        return html`<div id="hack">${this._count}</div>
            ${(this._inputs) ? html`<h3>Inputs:</h3>${this._inputs.map(input => html`
            <wl-expansion id="${input.label}" name="groupInput" @click="${()=>{this.expandIO(input.uri)}}">
                <span slot="title">${input.label}</span>
                <span slot="description">${input.desc}</span>
                ${this._variables[input.uri] ? 
                html`${this._variables[input.uri].length>0?
                    html`
                    <table class="pure-table pure-table-bordered">
                        <thead>
                            <th>Label</th>
                            <th>Long Name</th>
                            <th>Description</th>
                            <th>Standard Name</th>
                            <th>Units</th>
                        </thead>
                        <tbody>
                        ${this._variables[input.uri].map((v:any) => 
                            html`
                            <tr>
                                <td>${v.label}</td>
                                <td>${v.longName}</td>
                                <td>${v.desc}</td>
                                <td style="word-wrap: break-word;">${v.sn}</td>
                                <td style="min-width: 80px;">${v.unit}</td>
                            </tr>`)}
                        </tbody>
                    </table>`
                    : html`
                    <div class="text-centered"><h4>
                    This information has not been specified yet.
                    </h4></div>
                    `
                }`
                : html`<div class="text-centered"><wl-progress-spinner></wl-progress-spinner></div>`}
            </wl-expansion>`)}`
            : html``}

            ${(this._outputs) ? html`<h3>Outputs:</h3>${this._outputs.map(output => html`
            <wl-expansion id="${output.label}" name="groupOutput" @click="${()=>{this.expandIO(output.uri)}}">
                <span slot="title">${output.label}</span>
                <span slot="description">${output.desc}</span>
                ${this._variables[output.uri] ? 
                html`${this._variables[output.uri].length>0?
                    html`
                    <table class="pure-table pure-table-bordered">
                        <thead>
                            <th>Label</th>
                            <th>Long Name</th>
                            <th>Description</th>
                            <th>Standard Name</th>
                            <th>Units</th>
                        </thead>
                        <tbody>
                        ${this._variables[output.uri].map((v:any) => 
                            html`
                            <tr>
                                <td>${v.label}</td>
                                <td>${v.longName}</td>
                                <td>${v.desc}</td>
                                <td style="word-wrap: break-word;">${v.sn}</td>
                                <td style="min-width: 80px;">${v.unit}</td>
                            </tr>`)}
                        </tbody>
                    </table>`
                    : html`
                    <div class="text-centered"><h4>
                        This information has not been specified yet.
                    </h4></div>
                    `
                }`
                : html`<div class="text-centered"><wl-progress-spinner></wl-progress-spinner></div>`}
            </wl-expansion>`)}`
            : html``}

            ${(!this._inputs && !this._outputs) ? html`<br/><h3 style="margin-left:30px">
                This information has not been specified yet
            </h3>`
            : html``}`;
    }

    _renderCompatibleVariableTable (compatibleVariables) {
        let cInput = (compatibleVariables || []).reduce((acc, ci) => {
            let verTree = this._getVersionTree(ci.uri);
            if (!verTree.model) {
                if (!acc['?']) acc['?'] = {configs: [], variables: new Set()};
                acc['?'].configs.push(ci.uri);
                ci.vars.forEach(v => acc['?'].variables.add(v));
                return acc;
            }
            if (!acc[verTree.model.label]) acc[verTree.model.label] = {configs: [], variables: new Set()}
            if (verTree.config.uri === ci.uri) acc[verTree.model.label].configs.push(verTree.config.label);
            else if (verTree.calibration.uri === ci.uri) acc[verTree.model.label].configs.push(verTree.calibration.label);
            ci.vars.forEach(v => acc[verTree.model.label].variables.add(v));
            return acc;
        }, {})
        return html`
            <table class="pure-table pure-table-bordered">
                <thead>
                    <th>Model</th>
                    <th>Configuration</th>
                    <th>Variables</th>
                </thead>
                <tbody>
                    ${Object.keys(cInput).map(model => html`
                    <tr>
                        <td>${model}</td>
                        <td>${cInput[model].configs.join(', ')}</td>
                        <td>
                            ${Array.from(cInput[model].variables).map((v, i) => {
                            if (i===0) return html`<code>${v}</code>`
                            else return html`, <code>${v}</code>`})}
                        </td>
                    </tr>
                    `)}
                </tbody>
            </table>
        `;
    }

    _renderTabSoftware () {
        return html`${(this._config)?
            html`${(this._compInput && this._compInput.length>0) || 
                   (this._compOutput && this._compOutput.length>0) ?
                html`
                    ${(this._compInput && this._compInput.length>0)?
                        html`<h3> This model configuration uses variables that can be produced from:</h3>
                        ${this._renderCompatibleVariableTable(this._compInput)}`
                        : html``
                    }
                    ${(this._compOutput && this._compOutput.length>0)?
                        html`<h3> This model configuration produces variables that can be used by:</h3>
                        ${this._renderCompatibleVariableTable(this._compOutput)}`
                        : html``
                    }`
                : html``
            }`
            : html`<br/><h3 style="margin-left:30px">Please select a configuration for this model.</h3>`
        }
        ${this._compModels? html`
        <h3> Related models: </h3>
        <table class="pure-table pure-table-bordered">
            <thead>
                <th>Name</th>
                <th>Category</th>
                <th>Description</th>
            </thead>
            <tbody>
            ${this._compModels.map( (m:any) => html`
                <tr>
                    <td><a @click="${() => {this._goToModel(m)}}">${m.label}</a></td>
                    <td>${m.categories.join(', ')}</td>
                    <td>${m.desc}</td>
                </tr>`)}
            </tbody>
        </table>
        `:html``}
        ${(!this._compModels && (!this._compInput || this._compInput.length == 0) && (!this._compOutput || this._compOutput.length == 0))?
            html`
                <br/><h3 style="margin-left:30px">
                    No compatible software has been described in the model catalog yet.
                </h3>
            `
            :html``
        }
        `
    }

    _renderTab (tabName : 'overview'|'io'|'variables'|'software') {
        switch (tabName) {
            case 'overview':
                return this._renderTabOverview(); 
            case 'io':
                return this._renderTabIO();
            case 'variables':
                return this._renderTabVariables();
            case 'software':
                return this._renderTabSoftware();
            default:
                return html`<br/><h3 style="margin-left:30px">Sorry! We are currently working in this feature.</h3>`
        }
    }

    _goToModel (model:any) {
        if (this._uriToUrl[model.uri]) {
            goToPage(this._uriToUrl[model.uri]);
        } else {
            console.error('Theres no URL for selected model URI, please report this issue!');
        }
    }

    _renderGallery () {
        let items = [];
        if (this._model.sampleVisualization) {
            items.push({label: "Sample Visualization", src: this._model.sampleVisualization})
        }
        if (this._explDiagrams) {
            this._explDiagrams.forEach((ed) => {
                let newItem = {label: ed.label, src: ed.url, desc: ed.desc};
                if (ed.source) {
                    newItem.source = {label: ed.source.split('/').pop(), url: ed.source}
                }
                items.push(newItem);
            })
        }
        if (items.length > 0) {
            return html`<h3>Gallery:</h3>
                <image-gallery style="--width: 300px; --height: 160px;" .items="${items}"></image-gallery>`;
        } else {
            return html``;
        }
    }

    expandIO (uri:string) {
        if (!this._variables[uri]) {
            //Dont call this on click! FIXME
            store.dispatch(fetchVarsSNAndUnitsForIO(uri)); 
            this._IOStatus.add(uri);
        }
    }

    changeVersion () {
        let selectElement : HTMLElement | null = this.shadowRoot!.getElementById('select-version');
        if (!selectElement) return;

        let id = selectElement['value'].split('/').pop();
        goToPage('models/explore/' + this._modelId + '/' + id);
    }

    changeConfig () {
        let selectElement : HTMLElement | null = this.shadowRoot!.getElementById('select-config');
        if (!selectElement) return;

        let id = selectElement['value'].split('/').pop();
        goToPage('models/explore/' + this._modelId + '/' + this._versionId + '/' + id);
    }

    changeCalibration () {
        let selectElement : HTMLElement | null = this.shadowRoot!.getElementById('select-calibration');
        if (!selectElement) return;

        let id = selectElement['value'].split('/').pop();
        goToPage('models/explore/' + this._modelId + '/' + this._versionId + '/' + this._configId + '/' + id);
    }

    private _selectedModel = null;
    private _selectedConfig = null;
    private _selectedCalibration = null;

    updated () {
        if (this._versions) {
            this._updateConfigSelector();
            this._updateCalibrationSelector();
        }
    }

    _getVersionTree (uri:string) {
        if (this._allModels[uri]) {
            return {model: this._allModels[uri], version: this._allVersions[uri]};
        }

        let modelUris = Object.keys(this._allModels);
        for (let i = 0; i < modelUris.length; i++) {
            let model = this._allModels[modelUris[i]];
            if (model) {
                let versions = (this._allVersions[model.uri] || []);
                let vf = versions.filter(v => v.uri === uri);
                if (vf.length > 0) {
                    return {model: model, version: vf[0], config: vf[0].configs};
                }
                for (let j = 0; j < versions.length; j++) {
                    let configs = (versions[j].configs || []);
                    let cf = configs.filter(c => c.uri === uri);
                    if (cf.length > 0) {
                        return {model: model, version: versions[j], config: cf[0], calibration: cf[0].calibrations};
                    }
                    for (let k = 0; k < configs.length; k++) {
                        let ccf = (configs[k].calibrations || []).filter(cc => cc.uri === uri);
                        if (ccf.length > 0) {
                            return {model: model, version: versions[j], config: configs[k], calibration: ccf[0]};
                        }
                    }
                }
            }
        }

        return {}
    }

    stateChanged(state: RootState) {
        if (state.explorerUI) {
            let ui = state.explorerUI;
            // check whats changed
            let modelChanged : boolean = (ui.selectedModel !== this._selectedModel);
            let configChanged : boolean = (modelChanged || ui.selectedConfig !== this._selectedConfig);
            let calibrationChanged : boolean = (configChanged || ui.selectedCalibration !== this._selectedCalibration);

            this._modelId = ui.selectedModel ? ui.selectedModel.split('/').pop() : '';
            this._versionId = ui.selectedVersion ? ui.selectedVersion.split('/').pop() : '';
            this._configId = ui.selectedConfig ? ui.selectedConfig.split('/').pop() : '';
            this._calibrationId = ui.selectedCalibration ? ui.selectedCalibration.split('/').pop() : '';

            // Fetch & reset data
            if (modelChanged) {
                if (ui.selectedModel) {
                    store.dispatch(fetchVersionsForModel(ui.selectedModel));
                    store.dispatch(fetchDiagramsForModelConfig(ui.selectedModel));
                }
                this._selectedModel = ui.selectedModel;

                this._model = null;
                this._versions = null;
                this._compModels = null;
                this._explDiagrams = null;
            }
            if (configChanged) {
                if (ui.selectedConfig) {
                    //store.dispatch(fetchMetadataForModelConfig(ui.selectedConfig));
                    store.dispatch(fetchMetadataNoioForModelConfig(ui.selectedConfig));
                    store.dispatch(fetchCompatibleSoftwareForConfig(ui.selectedConfig));
                    store.dispatch(fetchIOAndVarsSNForConfig(ui.selectedConfig));
                    store.dispatch(fetchParametersForConfig(ui.selectedConfig));
                }
                this._selectedConfig = ui.selectedConfig;
                this._config = null;
                this._configMetadata = null;
                this._compInput = null;
                this._compOutput = null;

                this._variables = {};
                this._IOStatus = new Set();
            }
            if (calibrationChanged) {
                if (ui.selectedCalibration) {
                    //store.dispatch(fetchMetadataForModelConfig(ui.selectedCalibration));
                    store.dispatch(fetchMetadataNoioForModelConfig(ui.selectedCalibration));
                    store.dispatch(fetchIOAndVarsSNForConfig(ui.selectedCalibration));
                    store.dispatch(fetchParametersForConfig(ui.selectedCalibration));
                }
                this._selectedCalibration = ui.selectedCalibration;
                this._calibration = null;
                this._calibrationMetadata = null;
            }
            if (configChanged || calibrationChanged) {
                this._inputs = null;
                this._outputs = null;
                this._parameters = null;
            }

            // Load data 
            if (state.explorer) {
                let db = state.explorer;
                this._allVersions = db.versions;
                this._allModels = db.models;
                this._uriToUrl= db.urls;
                if (!this._model && db.models) {
                    this._model = db.models[this._selectedModel];
                }
                if (!this._versions && db.versions) {
                    this._versions = db.versions[this._selectedModel];
                }
                if (!this._config && this._versions) {
                    this._config = this._versions.reduce((acc, v) => {
                        if (acc) return acc;
                        return (v.configs || []).reduce((ac, c) => {
                            if (ac) return ac;
                            return (c.uri === this._selectedConfig) ? c : null;
                        }, null);
                    }, null);
                }
                if (!this._calibration && this._config) {
                    this._calibration = (this._config.calibrations || []).reduce((acc,c) => {
                        if (acc) return acc;
                        return (c.uri === this._selectedCalibration) ? c : null;
                    }, null);
                }


                // Update compatible models.
                if (!this._compModels && this._model && this._model.categories) {
                    this._compModels = [];
                    Object.values(state.explorer.models || {}).forEach((model:FetchedModel) => {
                        this._model.categories.forEach((cat:string) => {
                            //FIXME: for the moment all models only has one category. change this to a SET
                            if (model.categories && model.categories.indexOf(cat)>=0 && model.uri != this._selectedModel) {
                                this._compModels.push(model);
                            }
                        })
                    })
                }
                if (!this._explDiagrams && db.explDiagrams) {
                    this._explDiagrams = db.explDiagrams[this._selectedModel];
                }
                if (!this._compInput && this._config && db.compatibleInput) {
                    this._compInput = db.compatibleInput[this._config.uri];
                }
                if (!this._compOutput && this._config && db.compatibleOutput) {
                    this._compOutput = db.compatibleOutput[this._config.uri];
                }
                if (db.metadata) {
                    if (!this._configMetadata && this._config) this._configMetadata = db.metadata[this._selectedConfig];
                    if (!this._calibrationMetadata && this._calibration) this._calibrationMetadata = db.metadata[this._selectedCalibration];
                }
                if (this._config || this._calibration) {
                    let selectedUri = this._calibration ? this._calibration.uri : this._config.uri;
                    if (this._inputs != db.inputs[selectedUri]) this._inputs = db.inputs[selectedUri];
                    if (this._outputs != db.outputs[selectedUri]) this._outputs = db.outputs[selectedUri];
                    if (this._parameters != db.parameters[selectedUri]) this._parameters = db.parameters[selectedUri];
                }

                if (db.variables && this._IOStatus.size > 0) {
                    this._IOStatus.forEach((uri:string) => {
                        if (db.variables[uri]) {
                            this._variables[uri] = db.variables[uri];
                            this._IOStatus.delete(uri);
                            this._count += 1;//FIXME
                        }
                    });
                }

            }
        }
    }
}
