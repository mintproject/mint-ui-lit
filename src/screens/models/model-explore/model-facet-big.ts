import { html, property, customElement, css } from 'lit-element';

import { PageViewElement } from '../../../components/page-view-element.js';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../../../app/store';

import { FetchedModel, IODetail, VersionDetail, ConfigDetail, CalibrationDetail,
         CompIODetail } from "./reducers";
import { explorerSetVersion, explorerSetConfig, explorerSetCalibration,
         explorerClearCalibration, explorerFetchCompatibleSoftware,
         explorerFetchVersions, explorerFetchIO, explorerFetchIOVarsAndUnits, explorerFetchMetadata } from './actions';
import { SharedStyles } from '../../../styles/shared-styles';

//import { goToPage } from '../../../app/actions';
import "weightless/expansion";
import "weightless/tab";
import "weightless/tab-group";
import "weightless/card";
import "weightless/icon";

@customElement('model-facet-big')
export class ModelFacetBig extends connect(store)(PageViewElement) {
    @property({type: String})
        uri : string = "";

    @property({type: Number})
        _count : number = 0;

    @property({type: Object})
    private _metadata: any = null;

    @property({type: Object})
    private _model! : FetchedModel;

    @property({type: Object})
    private _io! : IODetail[];

    @property({type: Object})
    private _version!: Map<string, VersionDetail>;

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

                #hack {
                    display: none;
                }

                .clickable {
                    cursor: pointer;
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
}

            `
        ];
    }

    protected render() {
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
                            html`<b>Date:</b> ${this._model.dateC}<br/>`
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
                        ${this._version ?
                            html`<!-- FIXME: load selected from state -->
                            <span tip="Currently selected model version" class="tooltip">
                                <wl-icon>help_outline</wl-icon>
                            </span>
                            <span class="select-label">Version:</span>
                            <select class="select-css" label="Select version" @change="${this.changeVersion}">
                                <option value="" disabled selected>Select version</option>
                                ${Object.keys(this._version).map(uri => 
                                    html`<option value="${uri}">${uri}</option>`)}
                            </select>
                            ${(this._selectedVersion && this._selectedVersion.config)?
                                html`
                                <span tip="A model configuration is a unique way of running a model, exposing concrete inputs and outputs" class="tooltip">
                                    <wl-icon>help_outline</wl-icon>
                                </span>
                                <span class="select-label">Configuration:</span>
                                <select class="select-css" label="Select configuration" @change="${this.changeConfig}">
                                    <option value="" selected>Select configuration</option>
                                    ${this._selectedVersion.config.map( c =>
                                        html`<option value="${c.uri}">${c.uri}</option>`
                                    )}
                                </select>
                                ${(this._selectedConfig && this._selectedConfig.calibration) ?
                                    html`
                                    <span tip="A model calibration represents a model with parameters that have been adjusted (manually or automatically) to be run in a specific region" class="tooltip">
                                        <wl-icon>help_outline</wl-icon>
                                    </span>
                                    <span class="select-label">Calibration:</span>
                                    <select class="select-css" label="Select calibration" @change="${this.changeCalibration}">
                                        <option value="" disabled selected>Select calibration</option>
                                        ${this._selectedConfig.calibration.map( c =>
                                            html`<option value="${c.uri}">${c.uri}</option>`
                                        )}
                                    </select>
                                    `
                                    :html``
                                }
                                `
                                :html``
                            }
                            `
                            : html``
                        }
                    </td>
                </tr>

                <tr>
                    <td class="content" colspan="2">
                    <br/>
                    <wl-tab-group>
                        <wl-tab ?checked=${this._tab=='overview'}
                            @click="${() => {this.changeTab('overview')}}">Overview</wl-tab>
                        <wl-tab ?checked=${this._tab=='io'}
                            @click="${() => {this.changeTab('io')}}">Input/Output</wl-tab>
                        <wl-tab ?checked=${this._tab=='variables'}
                            @click="${() => {this.changeTab('variables')}}">Variables</wl-tab>
                        <!--<wl-tab @click="${() => {this.changeTab('tech')}}">Technical Details</wl-tab>-->
                        <!--<wl-tab @click="${() => {this.changeTab('execut')}}">Execute</wl-tab>-->
                        <wl-tab @click="${() => {this.changeTab('software')}}">Compatible Software</wl-tab>
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
                return html`

                    <ul>
                        ${this._model.purpose? html`<li><b>Purpose:</b> ${this._model.purpose}</li>`:html``}
                        ${this._model.assumptions? html`<li><b>Assumptions:</b> ${this._model.assumptions}</li>`:html``}
                    </ul>
                    ${this._metadata? 
                        html`<h4> ${this._selectedCalibration? html`Calibration` : html`${this._selectedConfig?
                            html`Configuration`:html`Model`
                            }`}
                        Metadata:
                        </h4>
                        <ul>
                            ${this._metadata[0].label? html`<li><b>Name:</b> ${this._metadata[0].label}</li>`:html``}
                            ${this._metadata[0].regionName? html`<li><b>Region name:</b>
                                ${this._metadata[0].regionName}</li>`:html``}
                            ${this._metadata[0].desc? html`<li><b>Description:</b>
                                ${this._metadata[0].desc}</li>`:html``}
                            ${this._metadata[0].input_variables? 
                                html`<li class="clickable" @click="${()=>{this.changeTab('io')}}">
                                <b>Input Variables:</b>
                                ${this._metadata[0].input_variables.length}</li>`:html``}
                            ${this._metadata[0].output_variables? 
                                html`<li class="clickable" @click="${()=>{this.changeTab('io')}}">
                                <b>Output Variables:</b>
                                ${this._metadata[0].output_variables.length}</li>`:html``}
                            ${this._metadata[0].parameters? 
                                html`<li class="clickable" @click="${()=>{this.changeTab('io')}}">
                                <b>Parameters:</b>
                                ${this._metadata[0].parameters.length}</li>`:html``}
                            ${this._metadata[0].processes? html`<li><b>Processes:</b>
                                ${this._metadata[0].processes.join(', ')}</li>`:html``}
                            ${this._metadata[0].gridType? html`<li><b>Grid Type:</b>
                                ${this._metadata[0].gridType}</li>`:html``}
                            ${this._metadata[0].gridDim? html`<li><b>Grid Dimentions:</b>
                                ${this._metadata[0].gridDim}</li>`:html``}
                            ${this._metadata[0].gridSpatial? html`<li><b>Spatial resolution:</b>
                                ${this._metadata[0].gridSpatial}</li>`:html``}
                            ${this._metadata[0].paramAssignMethod? html`<li><b>Parameter assignment method:</b>
                                ${this._metadata[0].paramAssignMethod}</li>`:html``}
                            ${this._metadata[0].adjustableVariables? html`<li><b>Adjustable variables:</b>
                                ${this._metadata[0].adjustableVariables.join(', ')}</li>`:html``}
                            ${this._metadata[0].targetVariables? html`<li><b>Target variables:</b>
                                ${this._metadata[0].targetVariables.join(', ')}</li>`:html``}
                            ${this._metadata[0].compLoc? html`<li><b>Download:</b>
                                <a target="_blank" href="${this._metadata[0].compLoc}">
                                    ${this._metadata[0].compLoc}</a></li>`:html``}
                        </ul>`
                        :html`<h4>Select a model configuration to display metadata.</h4>`
                    }
                    ${this._model.sampleVisualization && false ?
                        html`<img src="${this._model.sampleVisualization}"></img>` : html``}`

            case 'tech':
                return html`${(this._model.installInstr || (this._model.os && this._model.os.length>0) ||
                               this._model.sourceC || (this._model.pl && this._model.pl.length>0))?
                    html`<ul>
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
                                <a target="_blank" href="${this._model.installInstr}">${this._model.installInstr}</a>
                            </li>`: html``}
                    </ul>`
                    : html`<br/><h3 style="margin-left:30px">Sorry! We are currently working in this feature.</h3>`}`

            case 'io':
                return html`
                ${(this._io && this._io.length>0) ? html`
                <table class="pure-table pure-table-bordered">
                    <thead>
                        <th>I/O</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Format</th>
                    </thead>
                    <tbody>
                    ${this._io.map( io => html`
                        <tr>
                            <td>${io.kind}</td>
                            <td>${io.label}</td>
                            <td>${io.desc}</td>
                            <td>${io.format}</td>
                        </tr>`)}
                    </tbody>
                </table>`: html `${this._io?
                    html`<br/><h3 style="margin-left:30px">
                        Sorry! The selected configuration does not have input/output yet.</h3>`
                    :html`<br/><h3 style="margin-left:30px">Please select a version and configuration for this model.</h3>`}`}`;

            case 'variables':
                return html`<div id="hack">${this._count}</div><br/>
                    ${(this._io && this._io.length>0) ? 
                    html`${this._io.map((io) => {
                        let cont = html``;
                        if (io.variables && io.variables.length>0) 
                            cont = html`
                    <wl-expansion name="group">
                        <span slot="title">${io.label}</span>
                        <span slot="description">${io.desc}</span>
                        <table class="pure-table pure-table-bordered">
                            <thead>
                                <th>Label</th>
                                <th>Long Name</th>
                                <th>Description</th>
                                <th>Standard Name</th>
                                <th>Units</th>
                            </thead>
                            <tbody>
                            ${io.variables.map( v => 
                                html`
                                <tr>
                                    <td>${v.label}</td>
                                    <td>${v.longName}</td>
                                    <td>${v.desc}</td>
                                    <td style="word-wrap: break-word;">${v.sn}</td>
                                    <td style="min-width: 80px;">${v.unit}</td>
                                </tr>`)}
                            </tbody>
                        </table>
                    </wl-expansion>`
                        return cont
                    })}`
                    : html`${(!this._selectedConfig)? html`
                    <h3 style="margin-left:30px">Please select a version and configuration for this model.</h3>
                    `
                    : html`<h3 style="margin-left:30px">
                        Sorry! The selected configuration does not have software compatible inputs/outputs yet.
                    </h3>`}
                    `}
                `

            case 'software':
                return html`${(this._selectedVersion && this._selectedConfig)?
                    html`${(this._compInput && this._compInput.length>0) || 
                           (this._compOutput && this._compOutput.length>0) ?
                        html`
                            ${(this._compInput && this._compInput.length>0)?
                                html`<h3> This model configuration uses variables that can be produced from:</h3>
                                <ul>${this._compInput.map(i=>{
                                    return html`<li><b>${i.label}:</b> With variables: ${i.vars.join(', ')}</li>`
                                })}</ul>`: html``
                            }
                            ${(this._compOutput && this._compOutput.length>0)?
                                html`<h3> This model configuraion produces variables that can be used by:</h3>
                                <ul>${this._compOutput.map(i=>{
                                    return html`<li><b>${i.label}:</b> With variables: ${i.vars.join(', ')}</li>`
                                })}</ul>`: html``
                            }`
                        : html`<br/><h3 style="margin-left:30px">
                            Sorry! The selected configuration does not have software compatible inputs/outputs yet.
                        </h3>
                        `
                    }`
                    : html`<br/><h3 style="margin-left:30px">Please select a version and configuration for this model.</h3>`
                }`

            default:
                return html`<br/><h3 style="margin-left:30px">Sorry! We are currently working in this feature.</h3>`
        }
    }

    changeVersion (ev:any) {
        let versionUri : string = ev.path[0].value;
        if (this._selectedVersion) {
            let v = this._model.version![versionUri];
            this.changeConfig({path: [{value: v.config[0].uri}]})
        }
        store.dispatch(explorerSetVersion(versionUri));
    }

    changeConfig (ev:any) {
        let configUri : string = ev.path[0].value;
        if (configUri) {
            store.dispatch(explorerFetchIO(configUri));
            store.dispatch(explorerFetchCompatibleSoftware(configUri));
            store.dispatch(explorerFetchMetadata(configUri));
        }
        store.dispatch(explorerClearCalibration());
        store.dispatch(explorerSetConfig(configUri));
    }

    changeCalibration (ev:any) {
        let calibUri : string = ev.path[0].value;
        store.dispatch(explorerSetCalibration(calibUri));
        store.dispatch(explorerFetchMetadata(calibUri));
        console.log(this._selectedCalibration);
    }

    firstUpdated() {
        store.dispatch(explorerFetchVersions(this.uri));
        store.dispatch(explorerFetchMetadata(this.uri));
    }

    stateChanged(state: RootState) {
        let lastConfig = this._selectedConfig? this._selectedConfig.uri : '';
        if (state.explorer) {
            if (state.explorer.models) {
                this._model = state.explorer.models[this.uri];
            } 
            if (state.explorer.version && state.explorer.version[this.uri]) {
                this._version = state.explorer.version[this.uri];
                if (state.explorer.selectedVersion) {
                    this._selectedVersion = this._version[state.explorer.selectedVersion];
                    if (state.explorer.selectedConfig && this._selectedVersion && this._selectedVersion.config) {
                        this._selectedConfig = this._selectedVersion.config
                                                   .filter((c:any) => (c.uri === state.explorer!.selectedConfig))[0];
                        if (state.explorer.selectedCalibration &&
                            this._selectedConfig && this._selectedConfig.calibration) {
                            this._selectedCalibration = this._selectedConfig.calibration
                                    .filter((c:any) => (c.uri===state.explorer!.selectedCalibration))[0];
                        } else {
                            this._selectedCalibration = null;
                        }
                    } else {
                        this._selectedConfig = null;
                    }
                } else {
                    this._selectedVersion = null;
                }
            } 

            if (this._selectedConfig) {
                if (state.explorer.io) {
                    if ((!this._io || this._selectedConfig.uri != lastConfig) &&
                        state.explorer.io[this._selectedConfig.uri]) {
                        state.explorer.io[this._selectedConfig.uri].forEach((u:any) => {
                            store.dispatch(explorerFetchIOVarsAndUnits(u.uri));
                        });
                    }
                    this._io = state.explorer.io[this._selectedConfig.uri];
                    if (this._io && state.explorer.variables) {
                        for (let i = 0; i < this._io.length; i++) {
                            if (state.explorer.variables[this._io[i].uri]) {
                                this._io[i].variables = state.explorer.variables[this._io[i].uri];
                                this._count += 1;
                            }
                        }
                    }
                }

                if (state.explorer.compatibleInput) {
                    this._compInput = state.explorer.compatibleInput[this._selectedConfig.uri];
                }

                if (state.explorer.compatibleOutput) {
                    this._compOutput = state.explorer.compatibleOutput[this._selectedConfig.uri];
                }
            }

            if (state.explorer.modelMetadata) {
                if (this._selectedCalibration && state.explorer.modelMetadata[this._selectedCalibration.uri]) {
                    this._metadata = state.explorer.modelMetadata[this._selectedCalibration.uri];
                } else if (this._selectedConfig && state.explorer.modelMetadata[this._selectedConfig.uri]) {
                    this._metadata = state.explorer.modelMetadata[this._selectedConfig.uri];
                } else if (state.explorer.modelMetadata[this._model.uri]){
                    this._metadata = state.explorer.modelMetadata[this._model.uri];
                }
            }

        }
    }
}
