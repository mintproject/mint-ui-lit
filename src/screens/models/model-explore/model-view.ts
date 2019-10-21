import { html, property, customElement, css } from 'lit-element';

import { PageViewElement } from '../../../components/page-view-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../../../app/store';

import { FetchedModel, IODetail, VersionDetail, ConfigDetail, CalibrationDetail, CompIODetail,
         ExplanationDiagramDetail } from "../../../util/api-interfaces";
import { fetchCompatibleSoftwareForConfig, fetchParametersForConfig, fetchVersionsForModel, 
        fetchIOAndVarsSNForConfig, fetchVarsSNAndUnitsForIO, fetchDiagramsForModelConfig,  fetchSampleVisForModelConfig,
        fetchMetadataForModelConfig, fetchMetadataNoioForModelConfig, fetchScreenshotsForModelConfig,
        fetchAuthorsForModelConfig } from '../../../util/model-catalog-actions';
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
import '../../../components/loading-dots'

function capitalizeFirstLetter (s:string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

const PAGE_PREFIX : string = 'models/explore/';

@customElement('model-view')
export class ModelView extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _model! : FetchedModel;

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
    private _configAuthors : any  = null;

    @property({type: Object})
    private _calibrationAuthors : any = null;

    @property({type: Object})
    private _compInput : CompIODetail[] | null = null;
    
    @property({type: Object})
    private _compOutput : CompIODetail[] | null = null;

    @property({type: Object})
    private _compModels : FetchedModel[] | null = null;

    @property({type: Object})
    private _explDiagrams : ExplanationDiagramDetail[] | null = null;

    @property({type: Object})
    private _sampleVis : any = null;

    @property({type: Object})
    private _screenshots : any = null;

    @property({type: String})
    private _tab : 'overview'|'io'|'variables'|'software'|'tech' = 'overview';

    // URIs of selected resources
    private _selectedModel = null;
    private _selectedVersion = null;
    private _selectedConfig = null;
    private _selectedCalibration = null;

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

                img {
                  vertical-align: middle;
                  max-width: calc(100% - 8px);
                  border: 1px solid black;
                }

                .text-centered {
                  text-align: center;
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
                }

                .small-wrapper {
                    display:grid;
                    grid-gap:5px;
                    grid-template-columns: 1fr 1fr;
                    margin-bottom: 5px;
                }

                .col-img {
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
                    grid-column: 2 / 5;
                    grid-row: 1;
                }

                .col-desc > wl-select {
                    width: calc(100% - 55px);
                    margin-left:25px;
                }

                .col-desc > .tooltip > wl-icon {
                    padding-top: 16px;
                    --icon-size: 24px;
                }

                .tooltip-text {
                    display: inline;
                    border-bottom: 1px dotted;
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
                    display: none !important;
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

                .rdf-icon {
                    display: inline-block;
                    vertical-align: middle;
                    height: 22px;
                    width: 24px;
                    background: url(images/rdf.png) no-repeat 0px 0px;
                    background-size: 20px 22px;
                    cursor: pointer;
                }

                .text-helper {
                    --height: 10px;
                    margin-left: 6px;
                }

                #img-placeholder {
                    vertical-align: middle;
                    --icon-size: 200px;
                }

                .table-title {
                    padding-bottom: 0 !important;
                    font-size: 13px !important;
                    font-weight: bold !important;
                }
                `
        ];
    }

    _addConfig () {
        if (this._model && this._version && this._config) {
            let url = 'models/configure/' + this._model.uri.split('/').pop() + '/' + this._version.id + '/'
                    + this._config.uri.split('/').pop() + '/new';
            goToPage(url)
        }
    }

    _setEditMode () {
        //TODO: this is work in progress!
        store.dispatch(explorerSetMode('edit')); 
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
            // FIX ARROW
            let arrowEl = configSelectorWl.shadowRoot.getElementById('arrow');
            if (arrowEl) {
                arrowEl.style.pointerEvents = "none";
            }
            (<any>configSelectorWl).refreshAttributes();
        } else if (configSelectorWl) {
            /* FIXME: Sometimes, when versions data load faster than the wl-selector renders, we could end here.
             * The selectors will appear empty, but any update fixes it.
             * Something like a configSelectorWl.addEventListener('DOMContentLoaded', update..) should fix it but i
             * cannot make it works :-( */
            setTimeout(() => {
                this._updateConfigSelector();
            }, 400);
        } else {
            //console.log('This can even happen?')
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
            // FIX ARROW
            let arrowEl = calibrationSelectorWl.shadowRoot.getElementById('arrow');
            if (arrowEl) {
                arrowEl.style.pointerEvents = "none";
            }
            (<any>calibrationSelectorWl).refreshAttributes();
        }
    }

    _onConfigChange () {
        let configSelectorWl = this.shadowRoot!.getElementById('config-selector');
        let configSelector = configSelectorWl? configSelectorWl.getElementsByTagName('select')[0] : null;
        if (configSelector) {
            if (this._uriToUrl[configSelector.value]) {
                goToPage(PAGE_PREFIX + this._uriToUrl[configSelector.value]);
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
                goToPage(PAGE_PREFIX + this._uriToUrl[calibrationSelector.value]);
            } else if (calibrationSelector.value === '') {
                let id = this._config.uri.split('/').pop();
                let fullURI = PAGE_PREFIX + this._uriToUrl[this._config.uri]
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
            return html`<div class="info-center">- No version available -</div>`;
            //return html`<wl-progress-bar></wl-progress-bar>`;
        }
        let hasVersions = (this._versions.length > 0);
        let hasCalibrations = !!(this._config && this._config.calibrations);
        return html`
            <span tip="A model configuration is a unique way of running a model, exposing concrete inputs and outputs" 
                class="tooltip ${hasVersions? '' : 'hidden'}">
                <wl-icon>help_outline</wl-icon>
            </span>
            <a target="_blank" href="${this._config ? this._config.uri : ''}" style="margin: 17px 5px 0px 0px; float:left;"
                class="rdf-icon ${this._config? '' : 'hidden'}"></a> 
            <wl-select label="Select a configuration" id="config-selector" @input="${this._onConfigChange}"
                class="${hasVersions? '' : 'hidden'}">
            </wl-select>

            <span tip="A model configuration setup represents a model with parameters that have been adjusted (manually or automatically) to be run in a specific region"
                class="tooltip ${hasCalibrations? '' : 'hidden'}">
                <wl-icon>help_outline</wl-icon>
            </span>
            <a target="_blank" href="${this._calibration ? this._calibration.uri : ''}" style="margin: 17px 5px 0px 0px; float:left;"
                class="rdf-icon ${this._calibration? '' : 'hidden'}"></a> 
            <wl-select label="Select a configuration setup" id="calibration-selector" @input="${this._onCalibrationChange}"
                class="${hasCalibrations? '' : 'hidden'}">
            </wl-select>

            <div class="info-center ${hasVersions? 'hidden' : ''}">- No version available -</div>
            <div class="info-center ${(hasCalibrations || !hasVersions || (hasVersions && !this._config))? 'hidden': ''}"
                >- No configuration setup available <a class="clickable" @click="${this._addConfig}">add one</a> -</div>
        `
    }

    protected render() {
        if (!this._model) return html``;
        return html`
            <div class="wrapper">
                <div class="col-img text-centered">
                    ${this._model.logo ? 
                    html`<img src="${this._model.logo}"/>`
                    : html`<wl-icon id="img-placeholder">image</wl-icon>`}
                    ${this._model.dateC ? html`<div><b>Creation date:</b> ${this._model.dateC}</div>`:''}
                    ${this._model.categories ? html`<div><b>Category:</b> ${this._model.categories}</div>`:''}
                    ${this._model.type ? html`<div><b>Model type:</b> ${this._model.type}</div>`:''}
                </div>
                <div class="col-desc" style="text-align: justify;">
                    <wl-title level="2">
                        <a target="_blank" href="${this._model ? this._model.uri : ''}" class="rdf-icon"></a>
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
                            >Files and parameters</wl-tab>
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
        let showModel = this._model.os || this._model.pl || this._model.memReq || this._model.procReq || this._model.softwareReq ||
                        this._model.downloadURL || this._model.sourceC || this._model.doc || this._model.installInstr;
        return html`
            ${showModel ? html`
            <br/>
            <table class="pure-table pure-table-striped">
                <thead>
                    <tr><th colspan="2">MODEL: 
                        <span style="margin-left: 6px; font-size: 16px; font-weight: bold; color: black;">${this._model.label}</span>
                    </th></tr>
                </thead>
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
            `: ''}
            <br/>

            ${this._config && this._configMetadata ? html`
            <table class="pure-table pure-table-striped">
                <thead>
                    <tr><th colspan="2">CONFIGURATION: 
                        <span style="margin-left: 6px; font-size: 16px; font-weight: bold; color: black;">${this._config.label}</span>
                    </th></tr>
                </thead>
                <tbody>
                    ${this._configMetadata[0].dImg ? html`
                    <tr>
                        <td><b>Software Image:</b></td>
                        <td><code>${this._configMetadata[0].dImg}</code></td>
                    </tr>` : '' }
                    ${this._configMetadata[0].repo ? html`
                    <tr>
                        <td><b>Repository:</b></td>
                        <td><a target="_blank" href="${this._configMetadata[0].repo}">${this._configMetadata[0].repo}</td>
                    </tr>` : '' }
                    ${this._configMetadata[0].compLoc ? html`
                    <tr>
                        <td><b>Component Location:</b></td>
                        <td><a target="_blank" href="${this._configMetadata[0].compLoc}">${this._configMetadata[0].compLoc}</td>
                    </tr>` : '' }
                    ${this._configMetadata[0].pLanguage ? html`
                    <tr>
                        <td><b>Language:</b></td>
                        <td>${this._configMetadata[0].pLanguage}</td>
                    </tr>` : '' }
                </tbody>
            </table>` : ''} 

            <br/>
            ${this._calibration && this._calibrationMetadata ? html`
            <table class="pure-table pure-table-striped">
                <thead>
                    <tr><th colspan="2">SETUP:
                        <span style="margin-left: 6px; font-size: 16px; font-weight: bold; color:
                        black;">${this._calibration.label}</span>
                    </th></tr>
                </thead>
                <tbody>
                    ${this._calibrationMetadata[0].dImg ? html`
                    <tr>
                        <td><b>Software Image:</b></td>
                        <td><code>${this._calibrationMetadata[0].dImg}</code></td>
                    </tr>` : '' }
                    ${this._calibrationMetadata[0].repo ? html`
                    <tr>
                        <td><b>Repository:</b></td>
                        <td><a target="_blank" href="${this._calibrationMetadata[0].repo}">${this._calibrationMetadata[0].repo}</td>
                    </tr>` : '' }
                    ${this._calibrationMetadata[0].compLoc ? html`
                    <tr>
                        <td><b>Component Location:</b></td>
                        <td><a target="_blank" href="${this._calibrationMetadata[0].compLoc}">${this._calibrationMetadata[0].compLoc}</td>
                    </tr>` : '' }
                    ${this._calibrationMetadata[0].pLanguage ? html`
                    <tr>
                        <td><b>Language:</b></td>
                        <td>${this._calibrationMetadata[0].pLanguage}</td>
                    </tr>` : '' }
                </tbody>
            </table>
            <br/>
            ` : ''}
        `
    }

    /* Change to tabName and scroll to fragmentId */
    _changeTab (tabName: string, fragment?: string) {
        let tabId : string = '';
        let fragId : string = '';
        switch (tabName) {
            case 'io':
                tabId = 'tab-io';
                break;
            case 'variable':
                tabId = 'tab-variable';
                break;
            default: return;
        }
        switch (fragment) {
            case 'parameters':
                fragId = 'parameters-table';
                break;
            default: break;
        }

        let ioElement : HTMLElement | null = this.shadowRoot!.getElementById(tabId);
        if (ioElement && tabId) {
            ioElement.click();
            if (fragId) {
                setTimeout(() => {
                    let frag : HTMLElement | null = this.shadowRoot!.getElementById(fragId);
                    if (frag) frag.scrollIntoView({block: "end", behavior: "smooth"});
                }, 200);
            }
        }
    }

    _expandVariable (varLabel:string) {
        if (varLabel) {
            this._changeTab('variable');
            setTimeout(() => {
                let exp : HTMLElement | null = this.shadowRoot!.getElementById(varLabel);
                if (exp) {
                    exp.click();
                    exp.scrollIntoView({block: "start", behavior: "smooth"});
                }
                }, 200)
        }
    }

    _renderLink (url) {
        let sp = url.split('/')
        return html`<a target="_blank" href="${url}">${sp[sp.length-1] || sp[sp.length-2]}</a>`
    }

    _renderTabOverview () {
        return html`
            ${this._model.purpose? html`
            <wl-title level="2" style="font-size: 16px;">Model purpose:</wl-title>
            <ul style="margin-top: 5px">
                ${this._model.purpose.map(a => a? html`<li>${capitalizeFirstLetter(a)}.</li>`: '')}
            </ul>`
            :''}
            ${this._model.indices ? html`
            <wl-title level="2" style="font-size: 16px;">Relevant for calulcating index:</wl-title>
            <ul style="margin-top: 5px">
                <li>${this._model.indices.split('/').pop()}</li>
            </ul>`
            :''}
            ${this._config ? this._renderMetadataResume() : ''}
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

    _renderMetadataResume () {
        let data = [
            [this._config, this._configMetadata, 'configuration', (this._configAuthors || []).map(x => x.name).join(', ')], 
            [this._calibration, this._calibrationMetadata, 'configuration setup', (this._calibrationAuthors || []).map(x => x.name).join(', ')]
        ]
        return data.map(([obj, meta, title, authors]) => 
            obj ? html` 
            <fieldset style="border-radius: 5px; padding-top: 0px; border: 2px solid #D9D9D9; margin-bottom: 8px;">
                <legend style="font-weight: bold; font-size: 12px; color: gray;">Selected ${title}</legend>


                <div class="metadata-top-buttons">
                    <div class="button-preview" @click=${() => this._changeTab('io')}>
                        <div>Input files</div>
                        <div>${!this._inputs? html`
                            <loading-dots style="--width: 20px"></loading-dots>`
                            : this._inputs.length}
                        </div>
                    </div>
                    <div class="button-preview" @click=${() => this._changeTab('io')}>
                        <div>Output files</div>
                        <div>${!this._outputs? html`
                            <loading-dots style="--width: 20px"></loading-dots>`
                            : this._outputs.length}
                        </div>
                    </div>
                    <div class="button-preview" @click=${() => this._changeTab('io')}>
                        <div>Parameters</div>
                        <div>${!this._parameters ? html`
                            <loading-dots style="--width: 20px"></loading-dots>`
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
                    ${(!this._configAuthors || (this._configAuthors.length > 0 && authors)) ? html`
                    <br/>
                    <wl-text><b>Authors:</b> ${this._configAuthors ?  authors : html`
                        <loading-dots style="--height: 8px"></loading-dots>
                    `}</wl-text>
                    `: '' }
                    <ul>
                    ${meta[0].fundS ? html`<wl-text><b>Funding Source:</b> ${meta[0].fundS} </wl-text>` : ''}
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
                        if (i === 0) return html`<code class="clickable" @click="${() => this._changeTab('io', 'parameters')}">${v}</code>`;
                        else return html`, <code class="clickable" @click="${() => this._changeTab('io', 'parameters')}">${v}</code>`;
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
        if (!this._config) {
            return html`
            <br/>
            <h3 style="margin-left:30px">
                You must select a configuration or setup to see its files and parameters.
            </h3>`
        }
        return html`
            ${(this._parameters)? this._renderParametersTable() : html``}
            ${(!this._inputs || this._inputs.length > 0 || !this._outputs || this._outputs.length > 0) ? html`
            <h3> Files: </h3>
            <table class="pure-table pure-table-striped" style="overflow: visible;">
                <colgroup>
                    <col span="1" style="width: 10px;">
                    <col span="1" style="width: 20%;">
                    <col span="1">
                    ${this._calibration? html`<col span="1">` : ''}
                    <col span="1" style="max-width: 140px;">
                </colgroup>
                ${!this._inputs || this._inputs.length > 0 ? html`
                <thead>
                    <tr>
                        <th colspan="${this._calibration? 5 : 4}" class="table-title">Input files</th>
                    </tr>
                    <tr>
                        <th></th>
                        <th>Name</th>
                        <th>Description</th>
                        ${this._calibration? html`
                        <th style="text-align: right;">
                            Value on setup
                            <span class="tooltip" tip="If a value is not set up in this field, the configuration default value will be used.">
                                <wl-icon>help</wl-icon>
                            </span>
                        </th>` : html``}
                        <th style="text-align: right;">Format</th>
                    </tr>
                </thead>
                <tbody>
                ${!this._inputs ? html`
                    <tr>
                        <td colspan="${this._calibration? 5 : 4}"><div class="text-centered"><wl-progress-spinner></wl-progress-spinner></div></td>
                    <tr>`
                    : this._inputs.map(io => html`
                    <tr>
                        <td></td>
                        <td><span class="font-numbers clickable" @click="${()=>{this._expandVariable(io.label as string)}}">
                            ${io.label}
                        </span></td>
                        <td>${io.desc}</td>
                        ${this._calibration? html`
                        <td style="text-align: right;">${io.fixedValueURL ? html`
                            <a target="_blank" href="${io.fixedValueURL}">${io.fixedValueURL.split('/').pop()}</a>
                        ` : html`<span style="color:#999999;">-</span>`}</td>
                        ` : html``}
                        <td style="text-align: right;" class="font-numbers">${io.format}</td>
                    </tr>`)}
                </tbody>`
                : ''}

                ${!this._outputs || this._outputs.length > 0 ? html`
                <thead>
                    <tr>
                        <th colspan="${this._calibration? 5 : 4}" class="table-title">Output files</th>
                    </tr>
                    <tr>
                        <th></th>
                        <th>Name</th>
                        <th colspan="${this._calibration? 2 : 1}">Description</th>
                        <th style="text-align: right;">Format</th>
                    </tr>
                </thead>
                <tbody>
                ${!this._inputs ? html`
                    <tr>
                        <td colspan="${this._calibration? 5 : 4}"><div class="text-centered"><wl-progress-spinner></wl-progress-spinner></div></td>
                    <tr>`
                    : this._outputs.map(io => html`
                    <tr>
                        <td></td>
                        <td><span class="font-numbers clickable" @click="${()=>{this._expandVariable(io.label as string)}}">
                            ${io.label}
                        </span></td>
                        <td colspan="${this._calibration? 2 : 1}">${io.desc}</td>
                        <td style="text-align: right;" class="font-numbers">${io.format}</td>
                    </tr>`)}
                </tbody>`
                :''}
            </table>` : ''}

            ${(!this._inputs && !this._outputs && !this._parameters)? html`
            <br/>
            <h3 style="margin-left:30px">
                This information has not been specified yet.
            </h3>`
            :html ``}
            `;
    }

    _renderParametersTable () {
        if (!this._parameters) { 
            return html`<div class="text-centered">
                LOADING PARAMETERS
                <loading-dots class="text-helper"></loading-dots>
            </div>`
        }
        if (this._parameters.length > 0) {
            return html`
                <h3> Parameters: </h3>
                <table class="pure-table pure-table-striped" style="overflow: visible;" id="parameters-table">
                    <col span="1" style="width: 180;">
                    <col span="1">
                    <col span="1">
                    <col span="1" style="width: 130px;">
                    <thead>
                        <th>Parameter</th>
                        <th>Description</th>
                        <th style="text-align: right;">Relevant for intervention</th>
                        <th style="text-align: right;">
                            ${this._calibration? html`
                            Value on setup 
                            <span class="tooltip" tip="If a value is not set up in this field configuration defaul value will be used.">
                                <wl-icon>help</wl-icon>
                            </span>`
                            : 'Default value'}
                        </th>
                    </thead>
                    <tbody>
                    ${this._parameters.sort((a,b) => (a.position < b.position) ? -1 : (a.position > b.position? 1 : 0)).map( (p:any) => html`
                        <tr>
                            <td>
                                <code>${p.paramlabel}</code><br/>
                                ${p.minVal && p.maxVal ? html`
                                The range is from ${p.minVal} to ${p.maxVal}
                                ` : ''}
                            </td>
                            <td>
                                ${p.description ? html`<b style="font-size: 14px;">${capitalizeFirstLetter(p.description)}</b><br/>`: ''}
                            </td>
                            <td>
                                ${ p.intervention ? html`<span class="tooltip tooltip-text" tip="${p.interventionDesc}">
                                    ${p.intervention}
                                </span>` : ''}
                            </td>
                            <td class="font-numbers" style="text-align: right;">
                            ${this._calibration ? (p.fixedValue ? p.fixedValue : p.defaultvalue + ' (default)')
                            : p.defaultvalue}
                            </td>
                        </tr>`)}
                    </tbody>
                </table>`
        } else {
            //Shows nothing when no parameters
            return '';
        }
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
                if (!acc['Software Script']) acc['Software Script'] = {configs: [], variables: new Set()};
                acc['Software Script'].configs.push(ci.uri);
                ci.vars.forEach(v => acc['Software Script'].variables.add(v));
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
                    <th>Standard Variables</th>
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
        return html`
        ${(this._compModels && this._compModels.length > 0)? html`
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
        `:html`
        <br/><h3 style="margin-left:30px">
            No compatible software has been described in the model catalog yet.
        </h3>
        `}
        `

        /*return html`${(this._config)?
            html`${(this._compInput && this._compInput.length>0) || 
                   (this._compOutput && this._compOutput.length>0) ?
                html`
                    ${(this._compInput && this._compInput.length>0)?
                        html`<h3> This model configuration uses standard variables that can be produced from:</h3>
                        ${this._renderCompatibleVariableTable(this._compInput)}`
                        : html``
                    }
                    ${(this._compOutput && this._compOutput.length>0)?
                        html`<h3> This model configuration produces standard variables that can be used by:</h3>
                        ${this._renderCompatibleVariableTable(this._compOutput)}`
                        : html``
                    }`
                : html``
            }`
            : html`<br/><h3 style="margin-left:30px">Please select a configuration for this model.</h3>`
        }
        ${(this._compModels && this._compModels.length > 0)? html`
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
        ${((!this._compModels || this._compModels.length === 0) && (!this._compInput || this._compInput.length == 0) && (!this._compOutput || this._compOutput.length == 0))?
            html`
                <br/><h3 style="margin-left:30px">
                    No compatible software has been described in the model catalog yet.
                </h3>
            `
            :html``
        }
        `*/
    }

    _goToModel (model:any) {
        if (this._uriToUrl[model.uri]) {
            goToPage(PAGE_PREFIX + this._uriToUrl[model.uri]);
        } else {
            console.error('Theres no URL for selected model URI, please report this issue!');
        }
    }

    _renderGallery () {
        if (!this._explDiagrams && !this._sampleVis && !this._screenshots) {
            return html`<div class="text-centered">
                LOADING GALLERY
                <loading-dots class="text-helper"></loading-dots>
            </div>`
        }
        let items = [];
        if (this._explDiagrams) {
            this._explDiagrams.forEach((ed) => {
                let newItem = {label: ed.label, src: ed.url, desc: ed.desc};
                if (ed.source) {
                    newItem['source'] = {label: ed.source.split('/').pop(), url: ed.source}
                }
                items.push(newItem);
            })
        }
        if (this._sampleVis) {
            this._sampleVis.forEach((sv, i) => {
                let newItem = {label: 'Sample visualization ' + (i>0? i+1 : ''), src: sv.url, desc: sv.desc};
                items.push(newItem);
            });
        }
        if (this._screenshots) {
            this._screenshots.forEach((s) => {
                let newItem = {label: s.label, src: s.url};
                if (s.desc) newItem['desc'] = s.desc;
                if (s.source) newItem['source'] = {label: s.source, url: s.source};
                items.push(newItem);
            });
        }

        let stillLoading = (!this._explDiagrams || !this._sampleVis || !this._screenshots);

        if (items.length > 0) {
            return html`
                ${stillLoading ? html`
                <div style="float: right; margin: 1em 0;">
                    <loading-dots style="--height: 10px"></loading-dots>
                </div>` : ''}
                <h3>Gallery:</h3>
                <image-gallery style="--width: 300px; --height: 160px;" .items="${items}"></image-gallery>`;
        } else {
            // Shows nothing when no gallery
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
            let versionChanged : boolean = (modelChanged || ui.selectedVersion !== this._selectedVersion)
            let configChanged : boolean = (versionChanged || ui.selectedConfig !== this._selectedConfig);
            let calibrationChanged : boolean = (configChanged || ui.selectedCalibration !== this._selectedCalibration);

            // Fetch & reset data
            if (modelChanged) {
                if (ui.selectedModel) {
                    store.dispatch(fetchVersionsForModel(ui.selectedModel));
                    store.dispatch(fetchDiagramsForModelConfig(ui.selectedModel));
                    store.dispatch(fetchSampleVisForModelConfig(ui.selectedModel));
                    store.dispatch(fetchScreenshotsForModelConfig(ui.selectedModel));
                }
                this._selectedModel = ui.selectedModel;

                this._model = null;
                this._versions = null;
                this._compModels = null;
                this._explDiagrams = null;
                this._sampleVis = null;
                this._screenshots = null;
            }
            if (versionChanged) {
                this._selectedVersion = ui.selectedVersion;
                this._version = null;
            }
            if (configChanged) {
                if (ui.selectedConfig) {
                    //store.dispatch(fetchMetadataForModelConfig(ui.selectedConfig));
                    store.dispatch(fetchMetadataNoioForModelConfig(ui.selectedConfig));
                    store.dispatch(fetchCompatibleSoftwareForConfig(ui.selectedConfig));
                    store.dispatch(fetchIOAndVarsSNForConfig(ui.selectedConfig));
                    store.dispatch(fetchParametersForConfig(ui.selectedConfig));
                    store.dispatch(fetchAuthorsForModelConfig(ui.selectedConfig));
                }
                this._selectedConfig = ui.selectedConfig;
                this._config = null;
                this._configMetadata = null;
                this._compInput = null;
                this._compOutput = null;
                this._configAuthors = null;

                this._variables = {};
                this._IOStatus = new Set();
            }
            if (calibrationChanged) {
                if (ui.selectedCalibration) {
                    //store.dispatch(fetchMetadataForModelConfig(ui.selectedCalibration));
                    store.dispatch(fetchMetadataNoioForModelConfig(ui.selectedCalibration));
                    store.dispatch(fetchIOAndVarsSNForConfig(ui.selectedCalibration));
                    store.dispatch(fetchParametersForConfig(ui.selectedCalibration));
                    store.dispatch(fetchAuthorsForModelConfig(ui.selectedCalibration));
                }
                this._selectedCalibration = ui.selectedCalibration;
                this._calibration = null;
                this._calibrationMetadata = null;
                this._calibrationAuthors = null;
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

                if (db.models && !this._model) {
                    this._model = db.models[this._selectedModel];
                }
                if (db.versions && !this._versions) {
                    this._versions = db.versions[this._selectedModel];
                }
                if (this._versions && !this._version) {
                    let versionId : string = this._selectedVersion.split('/').pop();
                    this._version = this._versions.reduce((V, ver) => {
                        if (V) return V;
                        else return (ver.id === versionId) ? ver : null;
                    }, null)
                }
                if (this._version && !this._config) {
                    this._config = (this._version.configs || []).reduce((C, cfg) => {
                        if (C) return C;
                        else return (cfg.uri === this._selectedConfig) ? cfg : null;
                    }, null);
                }
                if (this._config && !this._calibration) {
                    this._calibration = (this._config.calibrations || []).reduce((C, cal) => {
                        if (C) return C;
                        return (cal.uri === this._selectedCalibration) ? cal : null;
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
                if (!this._sampleVis && db.sampleVis) {
                    this._sampleVis = db.sampleVis[this._selectedModel];
                }
                if (!this._screenshots && db.screenshots) {
                    this._screenshots = db.screenshots[this._selectedModel];
                }
                if (!this._compInput && this._config && db.compatibleInput) {
                    this._compInput = db.compatibleInput[this._config.uri];
                }
                if (!this._compOutput && this._config && db.compatibleOutput) {
                    this._compOutput = db.compatibleOutput[this._config.uri];
                }
                if (!this._configAuthors && this._config && db.authors) {
                    this._configAuthors = db.authors[this._config.uri];
                }
                if (!this._calibrationAuthors && this._calibration && db.authors) {
                    this._calibrationAuthors = db.authors[this._calibration.uri];
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
