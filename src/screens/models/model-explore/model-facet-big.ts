import { html, property, customElement, css } from 'lit-element';

import { PageViewElement } from '../../../components/page-view-element.js';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../../../app/store';

import { FetchedModel, IODetail, VersionDetail, ConfigDetail, CalibrationDetail, CompIODetail,
         ExplanationDiagramDetail } from "./api-interfaces";
import { explorerFetchCompatibleSoftware, explorerFetchParameters, explorerFetchVersions, explorerFetchIO,
         explorerFetchIOVarsAndUnits, explorerFetchExplDiags, explorerFetchMetadata } from './actions';
import { SharedStyles } from '../../../styles/shared-styles';
import { ExplorerStyles } from './explorer-styles'

import { showDialog } from "../../../util/ui_functions";
import { goToPage } from '../../../app/actions';
import "weightless/expansion";
import "weightless/tab";
import "weightless/tab-group";
import "weightless/card";
import "weightless/icon";
import "weightless/progress-spinner";

@customElement('model-facet-big')
export class ModelFacetBig extends connect(store)(PageViewElement) {
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
    private _modelMetadata: any = null;

    @property({type: Object})
    private _versionMetadata: any = null;

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

    @property({type: Object})
    private _versions!: VersionDetail[];

    @property({type: Object})
    private _selectedVersion : VersionDetail | null = null;

    @property({type: Object})
    private _selectedConfig : ConfigDetail | null = null;

    @property({type: Object})
    private _selectedCalibration : CalibrationDetail | null = null;

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
                :host {
                    width: 100%;
                }

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
                  vertical-align: middle;
                  max-width: calc(100% - 8px);
                  border: 1px solid black;
                }

                #dialog {
                    --dialog-height-l: auto;
                    text-align: center;
                }

                #dialog img {
                    max-height: 100%;
                }

                .gallery {
                    height:200px;
                    text-align: center;
                    display: inline-block;
                    padding: 2px 2px 2em 2px;
                }

                .gallery img {
                    max-width: 100%;
                    max-height: 100%;
                    display: block;
                    cursor: pointer;
                }

                .gallery span {
                    margin-top: 3px;
                    font-weight: bold;
                    display: block;
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
                    width: 220px;
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
                }`
        ];
    }

    protected render() {
        return html`
            <table>
                <tr>
                    <td class="header" colspan="2">
                        <div class="details-button"></div><!--
                        --><wl-title level="2" class="text-centered">${this._model.label}</div><!--
                        <div class="links"><span class="icon">1</span> <span class="icon">2</span></div>-->
                    </td>
                </tr>
                <tr>
                    <td class="left text-centered" style="padding-top: 1.5em;">
                        ${this._model.logo ? 
                        html`<img src="${this._model.logo}"/>`
                        : html`<img src="http://www.sclance.com/pngs/image-placeholder-png/image_placeholder_png_698412.png"/>`}
                    </td>
                    <td class="right content">
                        <wl-text>${this._model.desc}</wl-text>
                        <br/>
                        <br/>
                        ${this._model.authors ?
                            html`<b>Authors:</b> ${this._model.authors}<br/>`
                            : ``}
                        ${this._model.contactP ?
                            html`<b>Contact:</b> ${this._model.contactP}<br/>`
                            : ``}
                        ${this._model.fundS ?
                            html`<b>Funding:</b> ${this._model.fundS}<br/>`
                            : ``}
                        ${this._model.publisher ?
                            html`<b>Publisher:</b> ${this._model.publisher}<br/>`
                            : ``}
                        ${this._model.referenceP ?
                            html`<b>Preferred citation:</b> ${this._model.referenceP}<br/>`
                            : ``}
                        ${this._model.dateC ?
                            html`<b>Creation date:</b> ${this._model.dateC}<br/>`
                            : ``}
                        ${this._model.doc ?
                            html`<b>Documentation:</b> 
                                <a href="${this._model.doc}" target="_blank">${this._model.doc}</a><br/>`
                            : ``}
                        ${this._model.downloadURL ?
                            html`<b>Download:</b> 
                                <a href="${this._model.downloadURL}" target="_blank">${this._model.downloadURL}</a><br/>`
                            : ``}
                        ${(this._model.installInstr || (this._model.os && this._model.os.length>0) ||
                               this._model.sourceC || (this._model.pl && this._model.pl.length>0))?
                            html`<details style="margin-top: 10px;">
                                <summary><b>Technical details</b></summary>
                                <ul>
                                    ${(this._model.os && this._model.os.length>0)?
                                        html`<li><b>Operating system:</b> ${this._model.os.join(', ')}</li>`: html``}
                                    ${this._model.sourceC?  
                                        html`<li><b>Source code:</b> 
                                            <a target="_blank" href="${this._model.sourceC}">${this._model.sourceC}</a>
                                        </li>`: html``}
                                    ${(this._model.pl && this._model.pl.length>0)?
                                        html`<li><b>Programming language:</b> ${this._model.pl.join(', ')}</li>`: html``}
                                    ${this._model.installInstr? 
                                        html`<li><b>Installation instructions:</b>
                                            <a target="_blank" href="${this._model.installInstr}">
                                                ${this._model.installInstr}</a>
                                        </li>`: html``}
                                </ul>
                            </details>`
                            : ``}
                        <br/>

                        <br/>
                        ${this._versions ?
                            this._renderSelector()
                            : html``
                        }
                    </td>
                </tr>
                ${this._renderTabs()}
            </table>
            <br/>
        `;
    }

    _renderSelector () {
        return html`
        <span tip="Currently selected model version" class="tooltip">
            <wl-icon>help_outline</wl-icon>
        </span>
        <span class="select-label">Version:</span>
        <select id="select-version" class="select-css" label="Select version" @change="${this.changeVersion}">
            <option value="" disabled ?selected="${this._selectedVersion === null}">Select version</option>
            ${this._versions.map(v => 
                html`<option value="${v.uri}" ?selected=${this._selectedVersion && v.uri===this._selectedVersion.uri}>
                    ${v.label}
                </option>`)}
        </select>
        ${(this._selectedVersion && this._selectedVersion.configs) ?
            html`
            <span tip="A model configuration is a unique way of running a model, exposing concrete inputs and outputs" class="tooltip">
                <wl-icon>help_outline</wl-icon>
            </span>
            <span class="select-label">Configuration:</span>
            <select id="select-config" class="select-css" label="Select configuration" @change="${this.changeConfig}">
                <option value="" disabled ?selected="${this._selectedConfig === null}">Select configuration</option>
                ${this._selectedVersion.configs.map( c =>
                    html`<option value="${c.uri}" ?selected=${this._selectedConfig && c.uri===this._selectedConfig.uri}>
                        ${c.label}
                    </option>`
                )}
            </select>
            ${(this._selectedConfig && this._selectedConfig.calibrations) ?
                html`
                <span tip="A model calibration represents a model with parameters that have been adjusted (manually or automatically) to be run in a specific region" class="tooltip">
                    <wl-icon>help_outline</wl-icon>
                </span>
                <span class="select-label">Calibration:</span>
                <select id="select-calibration" class="select-css" label="Select calibration" @change="${this.changeCalibration}">
                    <option value="" ?selected="${this._selectedCalibration===null}">Select calibration</option>
                    ${this._selectedConfig.calibrations.map( c =>
                        html`<option value="${c.uri}"
                        ?selected="${this._selectedCalibration && c.uri===this._selectedCalibration.uri}">
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
    
    _renderTabOverview () {
        return html`
            <ul>
                ${this._model.purpose? html`<li><b>Purpose:</b> ${this._model.purpose}</li>`:html``}
                ${this._model.assumptions? html`<li><b>Assumptions:</b> ${this._model.assumptions}</li>`:html``}
            </ul>

            ${this._modelMetadata? html`${this._renderMetadata('Model Metadata', this._modelMetadata)}`:html``}
            ${this._versionMetadata? html`${this._renderMetadata('Version Metadata', this._versionMetadata)}`:html``}
            ${this._configMetadata? html`${this._renderMetadata('Configuration Metadata', this._configMetadata)}`:html``}
            ${this._calibrationMetadata? html`${this._renderMetadata('Calibration Metadata', this._calibrationMetadata)}`:html``}
            ${this._renderGallery()}`
    }

    _renderTabIO () {
        return html`
            ${(this._inputs) ? html`
            <h3> Inputs: </h3>
            <table class="pure-table pure-table-bordered">
                <thead>
                    <th>Name</th>
                    <th>Description</th>
                    ${this._selectedCalibration? html`<th>Fixed value</th>` : html``}
                    <th>Format</th>
                </thead>
                <tbody>
                ${this._inputs.map( io => html`
                    <tr>
                        <td><span class="clickable" @click="${()=>{this._expandVariable(io.label as string)}}">
                            ${io.label}
                        </span></td>
                        <td>${io.desc}</td>
                        ${(this._selectedCalibration && io.fixedValueURL)? html`<td>
                            <a target="_blank" href="${io.fixedValueURL}">${io.fixedValueURL.split('/').pop()}</a>
                        </td>` : html``}
                        <td>${io.format}</td>
                    </tr>`)}
                </tbody>
            </table>` : html``}

            ${(this._outputs) ? html`
            <h3> Outputs: </h3>
            <table class="pure-table pure-table-bordered">
                <thead>
                    <th>Name</th>
                    <th>Description</th>
                    ${this._selectedCalibration? html`<th>Fixed value</th>` : html``}
                    <th>Format</th>
                </thead>
                <tbody>
                ${this._outputs.map( io => html`
                    <tr>
                        <td><span class="clickable" @click="${()=>{this._expandVariable(io.label as string)}}">
                            ${io.label}
                        </span></td>
                        <td>${io.desc}</td>
                        ${(this._selectedCalibration && io.fixedValueURL)? html`<td>
                            <a target="_blank" href="${io.fixedValueURL}">${io.fixedValueURL.split('/').pop()}</a>
                        </td>` : html``}
                        <td>${io.format}</td>
                    </tr>`)}
                </tbody>
            </table>` : html``}

            ${(this._parameters)? 
            html`
                <h3> Parameters: </h3>
                <table class="pure-table pure-table-bordered">
                    <thead>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Datatype</th>
                        <th>Default value</th>
                        ${this._selectedCalibration? html`<th>Fixed value</th>` : html``}
                    </thead>
                    <tbody>
                    ${this._parameters.map( (p:any) => html`
                        <tr>
                            <td>${p.paramlabel}</td>
                            <td>${p.type}</td>
                            <td>${p.pdatatype}</td>
                            <td>${p.defaultvalue}</td>
                            ${this._selectedCalibration? html`<td>${p.fixedValue}</td>` : html``}
                        </tr>`)}
                    </tbody>
                </table>
            `
            :html``}
            ${(!this._inputs && !this._outputs && !this._parameters)? html`
            <br/>
            <h3 style="margin-left:30px">
                This information has not been specified yet.
            </h3>`
            :html ``}
            `;
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

    _renderTabSoftware () {
        return html`${(this._selectedVersion && this._selectedConfig)?
            html`${(this._compInput && this._compInput.length>0) || 
                   (this._compOutput && this._compOutput.length>0) ?
                html`
                    ${(this._compInput && this._compInput.length>0)?
                        html`<h3> This model configuration uses variables that can be produced from:</h3>
                        <ul>${this._compInput.map(i=>{
                            return html`<li><b>${i.label}:</b> With variables: ${i.vars.map((v, i) => {
                                if (i==0) return html`<code>${v}</code>`;
                                else return html`, <code>${v}</code>`;
                            })}</li>`
                        })}</ul>`: html``
                    }
                    ${(this._compOutput && this._compOutput.length>0)?
                        html`<h3> This model configuraion produces variables that can be used by:</h3>
                        <ul>${this._compOutput.map(i=>{
                            return html`<li><b>${i.label}:</b> With variables: ${i.vars.map((v, i) => {
                                if (i==0) return html`<code>${v}</code>`;
                                else return html`, <code>${v}</code>`;
                            })}</li>`
                        })}</ul>`: html``
                    }`
                : html``
            }`
            : html`<br/><h3 style="margin-left:30px">Please select a version and configuration for this model.</h3>`
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
                    This information has not been specified yet.
                </h3>
            `
            :html``
        }
        `
    }

    _renderMetadata (title: string, metadata:any) {
        let meta = metadata[0];
        return html`
        <details style="margin-top: 10px;">
            <summary><b>${title}</b></summary>
            <ul>
                ${meta.label? html`<li><b>Name:</b> ${meta.label}</li>`:html``}
                ${meta.regionName? html`<li><b>Region name:</b>
                    ${meta.regionName}</li>`:html``}
                ${meta.desc? html`<li><b>Description:</b>
                    ${meta.desc}</li>`:html``}
                ${meta.input_variables? 
                    html`<li>
                    <b class="clickable" @click="${()=>{this._changeTab('io')}}">Input Variables:</b>
                    ${meta.input_variables.length}</li>`:html``}
                ${meta.output_variables? 
                    html`<li>
                    <b class="clickable" @click="${()=>{this._changeTab('io')}}">Output Variables:</b>
                    ${meta.output_variables.length}</li>`:html``}
                ${meta.parameters? 
                    html`<li>
                    <b class="clickable" @click="${()=>{this._changeTab('io')}}">Parameters:</b>
                    ${meta.parameters.length}</li>`:html``}
                ${meta.processes? html`<li><b>Processes:</b>
                    ${meta.processes.join(', ')}</li>`:html``}
                ${meta.gridType? html`<li><b>Grid Type:</b>
                    ${meta.gridType}</li>`:html``}
                ${meta.gridDim? html`<li><b>Grid Dimentions:</b>
                    ${meta.gridDim}</li>`:html``}
                ${meta.gridSpatial? html`<li><b>Spatial resolution:</b>
                    ${meta.gridSpatial}</li>`:html``}
                ${meta.paramAssignMethod? html`<li><b>Parameter assignment method:</b>
                    ${meta.paramAssignMethod}</li>`:html``}
                ${meta.adjustableVariables? html`<li><b>Adjustable variables:</b>
                    ${meta.adjustableVariables.join(', ')}</li>`:html``}
                ${meta.targetVariables? html`<li><b>Target variables:</b>
                    ${meta.targetVariables.join(', ')}</li>`:html``}
                ${meta.compLoc? html`<li><b>Download:</b>
                    <a target="_blank" href="${meta.compLoc}">
                        ${meta.compLoc.split('/')[
                        meta.compLoc.split('/').length-1]}</a></li>`:html``}
            </ul>
        </details>`;
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
        let id : string = model.uri.split('/').pop();
        goToPage('models/explore/' + id);
    }

    _renderGallery () {
        return html `
        ${this._renderImgDialog()}
        ${(this._model.sampleVisualization || (this._explDiagrams && this._explDiagrams.length>0))?
           html`<h3>Gallery:</h3>`:html``}
        ${this._model.sampleVisualization ? html`
            <div class="gallery" @click="${()=>{this.openImg({
                uri: this._model.sampleVisualization as string,
                label: 'Sample Visualization'
            })}}">
                <img src="${this._model.sampleVisualization}"></img>
                <span> Sample visualization </span>
            </div>`
        : html``}
        ${(this._explDiagrams && this._explDiagrams.length > 0)? 
        html`${this._explDiagrams.map((ed:any) => html`
            <div class="gallery" @click="${()=>{this.openImg({
                uri: ed.url,
                label: ed.label,
                desc: ed.desc,
                source: ed.source
            })}}">
                <img src="${ed.url}"></img>
                <span>${ed.label}</span>
            </div>
        `)}`
        : html``}`
    }

    _renderImgDialog () {
        return html`
        <wl-dialog id="dialog" fixed backdrop blockscrolling size="large">
           <h3 id="dialog-title" slot="header" style="margin-bottom: 4px;">Sample Visualization</h3>
           <div slot="content">
             <img id="dialog-img" src=""></img>
           </div>
           <h4 id="dialog-desc" style="margin-bottom:1em;"></h4>
           <h5 id="dialog-source" style="margin-top:0;"></h5>
        </wl-dialog>
        `
    }

    openImg (obj:{uri:string, label?:string, desc?:string, source?:string}) {
        let title   = this.shadowRoot!.getElementById("dialog-title");
        let img     = this.shadowRoot!.getElementById("dialog-img");
        let descrip = this.shadowRoot!.getElementById("dialog-desc");
        let source  = this.shadowRoot!.getElementById("dialog-source");
        img!['src']=obj.uri;
        title!['innerHTML']=obj.label ? obj.label : '';
        descrip!['innerHTML']=obj.desc ? obj.desc : '';
        source!['innerHTML']=obj.source ? 'Source: ' + obj.source : '';
        showDialog("dialog", this.shadowRoot!);
    }

    expandIO (uri:string) {
        if (!this._variables[uri]) {
            //Dont call this on click! FIXME
            store.dispatch(explorerFetchIOVarsAndUnits(uri)); 
            this._IOStatus.add(uri);
        }
    }

    changeVersion () {
        let selectElement : HTMLElement | null = this.shadowRoot!.getElementById('select-version');
        if (!selectElement) return;

        let id = selectElement['value'].split('/').pop();
        id = id!.replace(/\./g,'+');
        goToPage('models/explore/' + this._modelId + '/' + id);
    }

    changeConfig () {
        let selectElement : HTMLElement | null = this.shadowRoot!.getElementById('select-config');
        if (!selectElement) return;

        let id = selectElement['value'].split('/').pop();
        id = id!.replace(/\./g,'+');
        goToPage('models/explore/' + this._modelId + '/' + this._versionId + '/' + id);
    }

    changeCalibration () {
        let selectElement : HTMLElement | null = this.shadowRoot!.getElementById('select-calibration');
        if (!selectElement) return;

        let id = selectElement['value'].split('/').pop();
        id = id!.replace(/\./g,'+');
        goToPage('models/explore/' + this._modelId + '/' + this._versionId + '/' + this._configId + '/' + id);
    }

    stateChanged(state: RootState) {
        // Set this model
        if (state.explorerUI && state.explorerUI.selectedModel != this._uri) {
            this._uri = state.explorerUI.selectedModel;
            store.dispatch(explorerFetchVersions(this._uri));
            store.dispatch(explorerFetchMetadata(this._uri));
            store.dispatch(explorerFetchExplDiags(this._uri));
        }

        // Load model
        if (state.explorer && state.explorer.models && state.explorer.models[this._uri] &&
            this._model != state.explorer.models[this._uri]) {
            // Set new model
            console.log('SET NEW MODEL')
            this._model = state.explorer.models[this._uri];
            this._modelId = this._uri.split('/').pop() as string;
            if (this._model.categories) {
                // Set related models (by category)
                let compModels : FetchedModel[] = [];
                this._model.categories.forEach( (cat:string) =>  {
                    Object.values(state.explorer!.models).forEach( (model:FetchedModel) => {
                        if (model.categories && model.categories.indexOf(cat)>=0 && model.uri != this._uri) {
                            compModels.push(model);
                        }
                    });
                });
                this._compModels = (compModels.length>0) ? compModels : null;
            }
            // Reset data
            //this._versions = undefined;
            this._selectedVersion = null;
            this._selectedConfig = null;
            this._selectedCalibration = null;
            this._modelMetadata = null;
            this._versionMetadata = null;
            this._configMetadata = null;
            this._calibrationMetadata = null;
            this._parameters = null;
            this._inputs = null;
            this._outputs = null;
            this._variables = {};
            this._IOStatus = new Set();
            this._compInput  = null;
            this._compOutput = null;
        }

        if (this._model) {
            // Load model versions
            if (state.explorer && state.explorer.versions && state.explorer.versions[this._model.uri] &&
                this._versions != state.explorer.versions[this._model.uri]) {
                this._versions = state.explorer.versions[this._model.uri];

                //Autoset version
                if (this._versions.length > 0 && (!state.explorerUI || !state.explorerUI.selectedVersion)) {
                    let firstVersion = this._versions[0];
                    let id = firstVersion.uri.split('/').pop();
                    id = id!.replace(/\./g,'+');
                    goToPage('models/explore/' + this._modelId + '/' + id);
                }
            }

            // Set explanation diagrams
            if (state.explorer && state.explorer.explDiagrams && state.explorer.explDiagrams[this._model.uri] &&
                this._explDiagrams != state.explorer.explDiagrams[this._model.uri]) {
                this._explDiagrams = state.explorer.explDiagrams[this._model.uri];
            }

            if (state.explorerUI) {
                // Set selected Version
                if (state.explorerUI.selectedVersion && this._versions) {
                    let sVersion = this._versions.filter( (v:any) => v.uri === state.explorerUI!.selectedVersion);
                    if (sVersion && sVersion.length > 0 && sVersion[0] != this._selectedVersion) {
                        this._selectedVersion = sVersion[0];
                        this._versionId = this._selectedVersion.uri.split('/').pop() as string;
                        this._versionId = this._versionId.replace(/\./g, '+');
                        console.log('SET NEW VERSION')
                        this._selectedConfig = null;
                        this._selectedCalibration = null;

                        //Autoset config
                        if (this._selectedVersion.configs && this._selectedVersion.configs.length>0 &&
                            (!state.explorerUI.selectedConfig || this._selectedVersion.configs.filter((x:any) =>
                            x.uri===state.explorerUI!.selectedConfig).length===0)) {
                            let firstConfig = this._selectedVersion.configs[0];
                            let id = firstConfig.uri.split('/').pop();
                            id = id!.replace(/\./g,'+');
                            goToPage('models/explore/' + this._modelId + '/' + this._versionId + '/' + id);
                            //store.dispatch(explorerSetConfig(firstConfig.uri.split('/').pop()));
                        }
                    }
                }

            if (this._selectedVersion) {
                    // Set selected Config
                    if (state.explorerUI.selectedConfig && this._selectedVersion.configs) {
                        let sConfig = this._selectedVersion.configs.filter( (c:any) => 
                            c.uri === state.explorerUI!.selectedConfig);
                        if (sConfig && sConfig.length > 0 && sConfig[0] != this._selectedConfig) {
                            this._selectedConfig = sConfig[0];
                            this._configId = this._selectedConfig.uri.split('/').pop() as string;
                            console.log('SET NEW CONFIG')
                            this._selectedCalibration = null;
                            this._parameters = null;
                            this._compOutput = null;
                            this._compInput = null;
                            this._variables = {};
                            this._IOStatus = new Set();
                            this._inputs = null;
                            this._outputs = null;
                            this._modelMetadata = null;
                            this._versionMetadata = null;
                            this._configMetadata = null;
                            this._calibrationMetadata = null;

                            // Load config related data.
                            store.dispatch(explorerFetchIO(this._selectedConfig.uri));
                            store.dispatch(explorerFetchParameters(this._selectedConfig.uri));
                            store.dispatch(explorerFetchCompatibleSoftware(this._selectedConfig.uri));
                            store.dispatch(explorerFetchMetadata(this._selectedConfig.uri));

                            // Auto set calibration
                            if (this._selectedConfig.calibrations && this._selectedConfig.calibrations.length>0 &&
                                (!state.explorerUI.selectedCalibration ||
                                this._selectedConfig.calibrations.filter((x:any) => x.uri ===
                                state.explorerUI!.selectedCalibration).length === 0)) {
                                let firstCalib = this._selectedConfig.calibrations[0];
                                let id = firstCalib.uri.split('/').pop();
                                id = id!.replace('.','+');
                                goToPage('models/explore/' + this._modelId + '/' + this._versionId + '/' + this._configId + '/' + id);
                            }
                        }
                    }

                    // Set selected Calibration
                    if (this._selectedConfig) {
                        if (state.explorerUI.selectedCalibration && this._selectedConfig.calibrations) {
                            let sCalib = this._selectedConfig.calibrations.filter((c:any) => 
                                         c.uri === state.explorerUI!.selectedCalibration);
                            if (sCalib && sCalib.length > 0 && sCalib[0] != this._selectedCalibration) {
                                this._selectedCalibration = sCalib[0];
                                console.log('SET NEW CALIBRATION')
                                store.dispatch(explorerFetchMetadata(this._selectedCalibration.uri));

                                store.dispatch(explorerFetchIO(this._selectedCalibration.uri));
                                store.dispatch(explorerFetchParameters(this._selectedCalibration.uri));

                            }
                        } else if (state.explorerUI.selectedCalibration === "") {
                            this._selectedCalibration = null;
                            this._calibrationMetadata = null;
                        }
                    }
                }
            }

            
            if (state.explorer) {
                // Set metadata
                if (state.explorer.modelMetadata) {
                    if (this._model && state.explorer.modelMetadata[this._model.uri]){
                        this._modelMetadata = state.explorer.modelMetadata[this._model.uri];
                    }
                    if (this._selectedVersion && state.explorer.modelMetadata[this._selectedVersion.uri]){
                        this._versionMetadata = state.explorer.modelMetadata[this._model.uri];
                    }
                    if (this._selectedConfig && state.explorer.modelMetadata[this._selectedConfig.uri]) {
                        this._configMetadata = state.explorer.modelMetadata[this._selectedConfig.uri];
                    }
                    if (this._selectedCalibration && state.explorer.modelMetadata[this._selectedCalibration.uri]) {
                        this._calibrationMetadata = state.explorer.modelMetadata[this._selectedCalibration.uri];
                    } 
                }

                if (this._selectedConfig) {
                    //Set parameters
                    if (state.explorer.parameters) {
                        let selectedUri : string = this._selectedCalibration ? 
                                this._selectedCalibration.uri : this._selectedConfig.uri;
                        if (state.explorer.parameters[selectedUri] && state.explorer.parameters[selectedUri].length > 0 
                            && this._parameters != state.explorer.parameters[selectedUri]) {
                            this._parameters = state.explorer.parameters[selectedUri];
                        }
                    }

                    //Set compatible Inputs
                    if (state.explorer.compatibleInput &&
                        state.explorer.compatibleInput[this._selectedConfig.uri] &&
                        state.explorer.compatibleInput[this._selectedConfig.uri].length > 0 &&
                        this._compInput != state.explorer.compatibleInput[this._selectedConfig.uri]) {
                        this._compInput = state.explorer.compatibleInput[this._selectedConfig.uri];
                    }

                    //Set compatible Outputs
                    if (state.explorer.compatibleOutput &&
                        state.explorer.compatibleOutput[this._selectedConfig.uri] &&
                        state.explorer.compatibleOutput[this._selectedConfig.uri].length > 0 &&
                        this._compOutput != state.explorer.compatibleOutput[this._selectedConfig.uri]) {
                        this._compOutput = state.explorer.compatibleOutput[this._selectedConfig.uri];
                    }

                    //Set Inputs
                    if (state.explorer.inputs) {
                        let selectedUri : string = this._selectedCalibration ? 
                                this._selectedCalibration.uri : this._selectedConfig.uri;
                        if (state.explorer.inputs[selectedUri] && state.explorer.inputs[selectedUri].length > 0
                            && this._inputs != state.explorer.inputs[selectedUri]) {
                            this._inputs = state.explorer.inputs[selectedUri];
                        }
                    }

                    //Set Outputs
                    if (state.explorer.outputs) {
                        let selectedUri : string = this._selectedCalibration ? 
                                this._selectedCalibration.uri : this._selectedConfig.uri;
                        if (state.explorer.outputs[selectedUri] && state.explorer.outputs[selectedUri].length > 0
                            && this._outputs != state.explorer.outputs[selectedUri]) {
                            this._outputs = state.explorer.outputs[selectedUri];
                        }
                    }

                    if (state.explorer.variables && this._IOStatus.size > 0) {
                        this._IOStatus.forEach((uri:string) => {
                            if (state.explorer!.variables[uri]) {
                                this._variables[uri] = state.explorer!.variables[uri];
                                this._IOStatus.delete(uri);
                                this._count += 1;//FIXME
                            }
                        });
                    }
                }
            }
        }
    }
}
