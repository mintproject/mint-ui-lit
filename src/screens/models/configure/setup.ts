import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../model-explore/explorer-styles'

import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';
import { IdMap } from 'app/reducers';

import { renderNotifications } from "util/ui_renders";
import { showNotification, showDialog, hideDialog } from 'util/ui_functions';

import { personGet, modelConfigurationSetupPut, regionGet, modelConfigurationSetupDelete, parameterGet, 
         datasetSpecificationGet, gridGet, timeIntervalGet, processGet, softwareImageGet, sampleResourceGet,
         sampleCollectionGet, parameterPut, sampleResourcePut, sampleCollectionPut } from 'model-catalog/actions';
import { sortByPosition, createUrl, renderExternalLink, renderParameterType } from './util';

import { Model, SoftwareVersion, ModelConfiguration, ModelConfigurationSetup, Parameter, SoftwareImage,
         Person, Process, SampleResource, SampleCollection, Region } from '@mintproject/modelcatalog_client';

import "weightless/slider";
import "weightless/progress-spinner";
import 'components/loading-dots'

import './grid';
import './time-interval';
import './person';
import './process';
import './parameter';
import './input';
import './region';

import { ModelsConfigureGrid } from './grid';
import { ModelsConfigureTimeInterval } from './time-interval';
import { ModelsConfigurePerson } from './person';
import { ModelsConfigureProcess } from './process';
import { ModelsConfigureParameter } from './parameter';
import { ModelsConfigureInput } from './input';
import { ModelsConfigureRegion } from './region';

@customElement('models-configure-setup')
export class ModelsConfigureSetup extends connect(store)(PageViewElement) {
    @property({type: Boolean})
    private _editing : boolean = false;

    @property({type: Object})
    private _model: Model = null;

    @property({type: Object})
    private _version: SoftwareVersion = null;

    @property({type: Object})
    private _config: ModelConfiguration = null;

    @property({type: Object})
    private _setup: ModelConfigurationSetup = null;

    @property({type: Object})
    private _parameters : any = {};

    @property({type: Object})
    private _editedParameters : IdMap<Parameter> = {};

    @property({type: Object})
    private _inputs : any = {};

    @property({type: Object})
    private _sampleResources : IdMap<SampleResource> = {} as IdMap<SampleResource>;

    @property({type: Object})
    private _sampleCollections : IdMap<SampleCollection> = {} as IdMap<SampleCollection>;

    @property({type: Object})
    private _editedSampleResources : IdMap<SampleResource> = {};

    @property({type: Object})
    private _editedSampleCollections : IdMap<SampleCollection> = {};

    @property({type: Object})
    private _authors : any = {};

    @property({type: Object})
    private _processes : any = {};

    @property({type: Object})
    private _grid : any = null;

    @property({type: Object})
    private _timeInterval : any = null;

    @property({type: Object})
    private _softwareImage : any = null;

    @property({type: Object})
    private _regions : IdMap<Region> = {} as IdMap<Region>;

    @property({type: String})
    private _dialog : ''|'person'|'process'|'parameter'|'input'|'region'|'grid'|'timeInterval' = '';

    private _selectedModel : string = '';
    private _selectedVersion : string = '';
    private _selectedConfig : string = '';
    private _selectedSetup : string = '';

    private _openedDialog : string = '';

    private _parametersLoading : Set<string> = new Set();
    private _inputsLoading : Set<string> = new Set();
    private _sampleResourcesLoading : Set<string> = new Set();
    private _sampleCollectionsLoading : Set<string> = new Set();
    private _authorsLoading : Set<string> = new Set();
    private _processesLoading : Set<string> = new Set();
    private _regionsLoading : Set<string> = new Set();
    private _softwareImageLoading : boolean = false;
    private _gridLoading : boolean = false;
    private _timeIntervalLoading : boolean = false;

    static get styles() {
        return [ExplorerStyles, SharedStyles, css`
            wl-slider > .value-edit {
                width: 47px;
            }

            input.value-edit {
                width: 100%;
                background-color: transparent;
                border: 0px;
                text-align: right;
                font-size: 16px;
                font-weight: 400;
                family: Raleway;
            }

            input.value-edit::placeholder {
                color: rgb(136, 142, 145);
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
                vertical-align: bottom;
                margin-left: 4px;
                --icon-size: 14px;
            }

            .info-center {
                text-align: center;
                font-size: 13pt;
                height: 32px;
                line-height:32px;
                color: #999;
            }

            li > a {
                cursor: pointer;
            }

            .ta-right {
                text-align: right;
            }

            .input-range {
                width: 50px !important;
                color: black;
            }

            .details-table {
                border-collapse: collapse;
                width: 100%;
            }

            .details-table tr td:first-child {
                font-weight: bold;
                padding-right: 6px;
                padding-left: 13px;
            }

            .details-table tr td:last-child {
                padding-right: 13px;
            }

            .details-table tr:nth-child(odd) {
                background-color: rgb(246, 246, 246);
            }

            .details-table > tbody > tr > td > span {
                display: inline-block;
                border-radius: 4px;
                line-height: 20px;
                padding: 1px 4px;
                margin-right: 4px;
                margin-bottom: 2px;
            }

            .details-table > tbody > tr > td > span > wl-icon {
                --icon-size: 16px;
                cursor: pointer;
                vertical-align: middle;
            }

            .details-table > tbody > tr > td > input, textarea {
                background: transparent;
                font-family: Raleway;
                font-size: 14px;
                width: calc(100% - 10px);
                resize: vertical;
            }

            .details-table > tbody > tr > td > span > wl-icon:hover {
                background-color: rgb(224, 224, 224);
            }

            .details-table td {
                padding: 5px 1px;
                vertical-align: top;
            }

            wl-button.small {
                border: 1px solid gray;
                margin-right: 5px;
                --button-padding: 4px;
            }

            #pam.tooltip:hover::after {
                bottom: 26px;
                color: rgb(255, 255, 255);
                right: 20%;
                position: absolute;
                z-index: 98;
                background: rgba(0, 0, 0, 0.8);
                border-radius: 5px;
                padding: 5px 15px;
                width: 610px;
                content: attr(tip);
                white-space: pre;
                word-wrap: break-word;
            }`,
        ];
    }

    _scrollUp () {
        let el = this.shadowRoot.getElementById('start');
        if (el) {
            el.scrollIntoView({behavior: "smooth", block: "start"})
        }
    }

    _cancel () {
        this._scrollUp();
        goToPage(createUrl(this._model, this._version, this._config, this._setup));
    }

    _edit () {
        this._scrollUp();
        goToPage(createUrl(this._model, this._version, this._config, this._setup) + '/edit');
    }

    _delete () {
        if (confirm('This setup and all its associated resources (variables, files) will be deleted. Are you sure?')) {
            store.dispatch( modelConfigurationSetupDelete(this._setup) );
            goToPage(createUrl(this._model, this._version, this._config));
            //FIXME: Do something after the removal, is not removing the related resources.
        }
    }

    _saveConfig () {
        let labelEl     = this.shadowRoot.getElementById('edit-setup-name') as HTMLInputElement;
        let descEl      = this.shadowRoot.getElementById('edit-setup-desc') as HTMLInputElement;
        let keywordsEl  = this.shadowRoot.getElementById('edit-setup-keywords') as HTMLInputElement;
        let complocEl   = this.shadowRoot.getElementById('edit-setup-comp-loc') as HTMLInputElement;

        if (labelEl && descEl && keywordsEl && complocEl) {
            let label    = labelEl.value;
            let desc     = descEl.value;
            let keywords = keywordsEl.value;
            let compLoc  = complocEl.value;

            if (!label) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>labelEl).refreshAttributes();
                this._scrollUp();
                return;
            }

            let editedSetup = {...this._setup};

            editedSetup.label = [label];
            editedSetup.description = [desc];
            editedSetup.keywords = [keywords.split(/ *, */).join('; ')];
            editedSetup.hasComponentLocation = [compLoc];
            /*editedSetup.adjustableParameter = (editedSetup.adjustableParameter||[])
                    .map((uri) => {return  {id: uri} as Parameter});*/

            editedSetup.hasGrid = this._grid ? [this._grid] : undefined;
            editedSetup.hasOutputTimeInterval = this._timeInterval ? [this._timeInterval] : undefined;

            console.log('saving', editedSetup);
            showNotification("saveNotification", this.shadowRoot!);

            let paramProms : Promise<Parameter>[] = Object.values(this._editedParameters)
                    .map((p:Parameter) => store.dispatch(parameterPut(p)));
            
            let sampleResProms : Promise<SampleResource>[] = Object.values(this._editedSampleResources)
                    .map((s:SampleResource) => store.dispatch(sampleResourcePut(s)));
            
            let sampleColProms : Promise<SampleCollection>[] = Object.values(this._editedSampleCollections)
                    .map((s:SampleCollection) => store.dispatch(sampleCollectionPut(s)));

            Promise.all( paramProms.concat(sampleResProms).concat(sampleColProms) ).then((results:any) => {
                store.dispatch(modelConfigurationSetupPut(editedSetup)).then((setup) => {
                    goToPage(createUrl(this._model, this._version, this._config, setup));
                });
            });
        }
    }

    protected render() {
        if (!this._setup) {
            return html`<div style="text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`;
        }
        // Sort parameters by order
        let paramOrder = []
        if (this._setup && this._setup.hasParameter) {
            Object.values(this._parameters).sort(sortByPosition).forEach((id: any) => {
                if (typeof id === 'object') id = id.id;
                paramOrder.push(id);
            });
            this._setup.hasParameter.forEach((id: any) => {
                if (typeof id === 'object') id = id.id;
                if (paramOrder.indexOf(id) < 0) {
                    paramOrder.push(id)
                }
            })
        }

        // Sort inputs by order
        let inputOrder = []
        if (this._setup && this._setup.hasInput) {
            Object.values(this._inputs).sort(sortByPosition).forEach((id: any) => {
                if (typeof id === 'object') id = id.id;
                inputOrder.push(id);
            });
            this._setup.hasInput.forEach((input) => {
                let id : string = (typeof input === 'object') ? input.id : input;
                if (inputOrder.indexOf(id) < 0) {
                    inputOrder.push(id)
                }
            })
        }

        let keywords = '';
        if (this._setup.keywords) {
            keywords = this._setup.keywords[0].split(/ *; */).join(', ');
        }

        return html`
        <span id="start"/>

        <table class="details-table">
            <colgroup width="150px">

            <tr>
                ${this._editing ? html`
                <td colspan="2" style="padding: 5px 20px;">
                    <wl-textfield id="edit-setup-name" label="Setup name" value="${this._setup.label}" required></wl-textfield>
                </td>` : ''}
            </tr>

            <tr>
                <td>Description:</td>
                <td>
                    ${this._editing ? html`
                    <textarea id="edit-setup-desc" name="description" rows="5">${this._setup.description}</textarea>
                    ` : this._setup.description}
                </td>
            </tr>

            <tr>
                <td>Keywords:</td>
                <td>
                    ${this._editing ? html`
                    <input id="edit-setup-keywords" type="text" value="${keywords}"/>
                    ` : keywords}
                </td>
            </tr>

            <tr>
                <td>Region:</td>
                <td>
                    ${(this._setup.hasRegion || []).map((r:Region) => this._regions[r.id] ?
                        html`<span class="region">${this._regions[r.id].label}</span>`
                        : html`${r.id} <loading-dots style="--width: 20px"></loading-dots>`
                    )}
                    ${this._editing ? html`
                    <wl-button style="float:right;" class="small" flat inverted
                        @click="${this._showRegionDialog}"><wl-icon>edit</wl-icon></wl-button>
                    `: ''}
                </td>
            </tr>

            <tr>
                <td>Setup creator:</td>
                <td>
                    ${this._setup.author && this._setup.author.length > 0? 
                    html`${this._setup.author.map(a => typeof a === 'object' ? a['id'] : a).map((authorUri:string) => 
                        (this._authors[authorUri] ? html`
                        <span class="author">
                            ${this._authors[authorUri].label ? this._authors[authorUri].label : authorUri}
                        </span>`
                        : authorUri + ' ')
                    )}
                    ${this._authorsLoading.size > 0 ? html`<loading-dots style="--width: 20px"></loading-dots>`: ''}`
                    : 'No authors'}
                    ${this._editing ? html`
                    <wl-button style="float:right;" class="small" flat inverted
                        @click="${this._showAuthorDialog}"><wl-icon>edit</wl-icon></wl-button>
                    `: ''}
                </td>
            </tr>

            <tr>
                <td>Parameter assignment method:</td>
                <td>
                    <div style="display: grid; grid-template-columns: auto 36px;">
                        ${this._editing ? html`
                        <wl-select id="edit-setup-assign-method" label="Parameter assignment method" placeholder="Select a parameter assignament method" required>
                            <option value="" disabled selected>Please select a parameter assignment method</option>
                            <option value="Calibration">Calibration</option>
                            <option value="Expert-configured">Expert tuned</option>
                        </wl-select>`
                        : html`<span style="vertical-align: middle; line-height: 40px; font-size: 16px;">${this._setup.parameterAssignmentMethod}</span>` }
                        <span tip="Calibrated: The model was calibrated (either manually or automatically) against baseline data.&#10;Expert configured: A modeler did an expert guess of the parameters based on available data." 
                              id="pam" class="tooltip" style="top: 8px;">
                            <wl-icon style="--icon-size: 24px;">help_outline</wl-icon>
                        </span>
                    </div>
                </td>
            </tr>

            <tr>
                <td>Software Image:</td>
                <td>
                    ${this._setup.hasSoftwareImage ? 
                    ((this._softwareImage && Object.keys(this._softwareImage).length > 0) ?
                        html`<span class="software-image">
                            <a target="_blank"
                               href="https://hub.docker.com/r/${this._softwareImage.label[0].split(':')[0]}/tags">
                                ${this._softwareImage.label}
                            </a>
                        </span>`
                        : html`${this._setup.hasSoftwareImage[0]['id']} ${this._softwareImageLoading ?
                            html`<loading-dots style="--width: 20px"></loading-dots>`: ''}`)
                    : 'No software image'}
                </td>
            </tr>

            <tr>
                <td>Component Location:</td>
                <td>
                    ${this._editing ? html`
                    <textarea id="edit-setup-comp-loc" disabled>${this._setup.hasComponentLocation}</textarea>
                    ` : renderExternalLink(this._setup.hasComponentLocation)}
                </td>
            </tr>

            <tr>
                <td>Grid:</td>
                <td>
                    ${this._gridLoading ?
                        html`${this._setup.hasGrid[0].id} <loading-dots style="--width: 20px"></loading-dots>`
                        : (this._grid ?  html`
                        <span class="grid">
                            <span style="margin-right: 30px; text-decoration: underline;">${this._grid.label}</span>
                            <span style="font-style: oblique; color: gray;">${this._grid.type.filter(g => g != 'Grid')}</span>
                            <br/>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="font-size: 12px;">Spatial resolution:</span>
                                <span style="margin-right:20px; font-size: 14px;" class="monospaced">
                                    ${this._grid.hasSpatialResolution && this._grid.hasSpatialResolution.length > 0 ?
                                        this._grid.hasSpatialResolution[0] : '-'}
                                </span>
                                <span style="font-size: 12px;">Dimensions:</span>
                                <span style="margin-right:20px" class="number">
                                    ${this._grid.hasDimension && this._grid.hasDimension.length > 0 ? this._grid.hasDimension[0] : '-'}
                                </span>
                                <span style="font-size: 12px;">Shape:</span>
                                <span style="font-size: 14px" class="monospaced">
                                    ${this._grid.hasShape && this._grid.hasShape.length > 0 ? this._grid.hasShape[0] : '-'}
                                </span>
                            </div>
                        </span>` : 'No grid'
                    )}
                    ${this._editing ? html`
                    <wl-button style="float:right;" class="small" flat inverted
                        @click="${this._showGridDialog}"><wl-icon>edit</wl-icon></wl-button>
                    `: ''}
                </td>
            </tr>

            <tr>
                <td>Time interval:</td>
                <td>
                    ${this._timeIntervalLoading ? 
                        html`${this._setup.hasOutputTimeInterval[0].id} <loading-dots style="--width: 20px"></loading-dots>`
                        : (this._timeInterval ? html`
                        <span class="time-interval">
                            <span style="display: flex; justify-content: space-between;">
                                <span style="margin-right: 30px; text-decoration: underline;">
                                    ${this._timeInterval.label ? this._timeInterval.label : this._timeInterval.id}
                                </span>
                                <span> 
                                    ${this._timeInterval.intervalValue}
                                    ${this._timeInterval.intervalUnit ? this._timeInterval.intervalUnit[0].label : ''}
                                </span>
                            </span>
                            <span style="font-style: oblique; color: gray;"> ${this._timeInterval.description} </span>
                        </span>` : 'No time interval'
                    )}
                    ${this._editing ? html`
                    <wl-button style="float:right;" class="small" flat inverted
                        @click="${this._showTimeIntervalDialog}"><wl-icon>edit</wl-icon></wl-button>
                    ` : ''}
                </td>
            </tr>

            <tr>
                <td>Processes:</td>
                <td>
                    ${this._setup.hasProcess ?
                    html`${this._setup.hasProcess.map(a => typeof a === 'object' ? a.id : a).map((procUri:string) => 
                        (this._processes[procUri] ? html`
                        <span class="process">
                            ${this._processes[procUri].label}
                            ${this._processes[procUri].label ? this._processes[procUri].label : this._processes[procUri].id}
                        </span>`
                        : procUri + ' '))}
                    ${this._processesLoading.size > 0 ? html`<loading-dots style="--width: 20px"></loading-dots>`: ''}`
                    : 'No processes'}
                    ${this._editing ? html`
                    <wl-button style="float:right;" class="small" flat inverted
                        @click="${this._showProcessDialog}"><wl-icon>edit</wl-icon></wl-button>
                    `: ''}
                </td>
            </tr>
        </table>

        <wl-title level="4" style="margin-top:1em;">Parameters:</wl-title>
        <table class="pure-table pure-table-striped" style="width: 100%">
            <colgroup>
                <col span="1">
                <col span="1">
                <col span="1">
                <!--col span="1"-->
                ${this._editing? html`<col span="1">` : ''}
            </colgroup>
            <thead>
                <th><b>Label</b></th>
                <th><b>Type</b></th>
                <th class="ta-right" style="white-space:nowrap;">
                    <b>Value in this setup</b>
                    <span class="tooltip" style="white-space:normal;"
                     tip="If a value is set up in this field, you will not be able to change it in run time. For example, a price adjustment is set up to be 10%, it won't be editable when running the the model">
                        <wl-icon>help</wl-icon>
                    </span>
                </th>
                <!--th class="ta-right" style="white-space:nowrap;" colspan="1">
                    <b>Adjustable</b>
                    <span class="tooltip" style="white-space:normal;"
                     tip="An adjustable parameter is a knob that a user will be able to fill with a value when executing the model">
                        <wl-icon>help</wl-icon>
                    </span>
                </th-->
                ${this._editing? html`<th> </th>` : ''}
            </thead>
            <tbody>
            ${this._setup.hasParameter ? paramOrder.map((uri:string) => html`
            <tr>
                ${this._parameters[uri] ? html`
                <td>
                    <code>${this._parameters[uri].label}</code><br/>
                    <b>${this._parameters[uri].description}</b>
                </td>
                <td>
                    ${renderParameterType(this._parameters[uri])}
                </td>
                <td class="ta-right">
                    ${this._parameters[uri].hasFixedValue && this._parameters[uri].hasFixedValue.length > 0 ?
                        this._parameters[uri].hasFixedValue : (
                        this._parameters[uri].hasDefaultValue ? this._parameters[uri].hasDefaultValue + ' (default)' : '-'
                    )}
                    ${this._parameters[uri].usesUnit ?this._parameters[uri].usesUnit[0].label : ''}
                </td>
                <!--td style="text-align: center;">
                    <wl-button flat inverted>
                        <wl-icon>check_box</wl-icon>
                    </wl-button>
                </td-->
                ${this._editing ? html`
                <td class="ta-right">
                    <wl-button flat inverted @click="${() => this._showParameterDialog(uri)}"class="small"><wl-icon>edit</wl-icon></wl-button>
                </td>
                `: ''}
                `
                : html`<td colspan="5" style="text-align: center;"> <wl-progress-spinner></wl-progress-spinner> </td>`}
            </tr>`)
            : html`<tr><td colspan="5" class="info-center">- This setup has no parameters -</td></tr>`}
            </tbody>
        </table>

        <wl-title level="4" style="margin-top:1em;">Input files:</wl-title>
        <table class="pure-table pure-table-striped" style="width: 100%">
            <colgroup>
                <col span="1">
                <col span="1">
                <col span="1">
            </colgroup>
            <thead>
                <th><b>Input description</b></th>
                <th colspan="2"><b>File URL in this setup</b></th>
            </thead>
            <tbody>
            ${this._setup.hasInput ? inputOrder.map((uri:string, i:number) => html `
            <tr>${this._inputs[uri] ? html`
                <td>
                    <code style="font-size: 13px">${this._inputs[uri].label}</code>
                    ${this._inputs[uri].hasFormat && this._inputs[uri].hasFormat.length === 1 ?  
                        html`<span class="monospaced" style="color: gray;">(.${this._inputs[uri].hasFormat})<span>` : ''}
                    <br/>
                    ${this._inputs[uri].description}
                </td>
                <td colspan="${this._editing ? 1 : 2}">
                    ${this._inputs[uri].hasFixedResource && this._inputs[uri].hasFixedResource.length > 0 ? 
                    this._inputs[uri].hasFixedResource.map((fixed) => this._sampleResources[fixed.id] ? 
                        html`
                        <span>
                            <b>${this._sampleResources[fixed.id].label}</b> <br/>
                            <a target="_blank" href="${this._sampleResources[fixed.id].value}">
                                ${this._sampleResources[fixed.id].value}
                            </a><br/>
                            <span class="monospaced" style="white-space: nowrap;">${this._sampleResources[fixed.id].dataCatalogIdentifier}</span>
                        </span>` : ( this._sampleCollections[fixed.id] ? html`
                        <span>
                            <b>${this._sampleCollections[fixed.id].label}</b> <br/>
                            ${this._sampleCollections[fixed.id].description}
                            ${this._sampleCollections[fixed.id].hasPart.map(sample => html`
                            <details>
                                <summary style="cursor: pointer;" @click="${() => {this._loadSample(sample.id)}}">${sample.label}</summary>
                                <div style="padding-left: 14px;">
                                    ${this._sampleResources[sample.id] ? html`
                                    <a target="_blank" href="${this._sampleResources[sample.id].value}">
                                        ${this._sampleResources[sample.id].value}
                                    </a><br/>
                                    <span class="monospaced" style="white-space: nowrap;">${this._sampleResources[sample.id].dataCatalogIdentifier}</span>
                                </div>
                                ` : html`${sample.id ? sample.id.split('/').pop() : console.log(fixed, sample)} <loading-dots style="--width: 20px"></loading-dots>`}
                            `)}
                        </span>`
                        : html`${fixed.id.split('/').pop()} <loading-dots style="--width: 20px"></loading-dots>`))
                    : html`
                    <div class="info-center" style="white-space:nowrap;">- Not set -</div>`}
                </td>
                ${this._editing ? html`
                <td>
                    ${this._inputs[uri].hasFixedResource && this._inputs[uri].hasFixedResource.length > 0 ? html`
                    <wl-button style="float:right;" class="small" flat inverted
                        @click="${() => {this._showEditInputDialog(this._inputs[uri].hasFixedResource[0].id, uri)}}"><wl-icon>edit</wl-icon></wl-button>`
                    : html`
                    <wl-button style="float:right;" class="small" flat inverted
                        @click="${() => {this._showNewInputDialog(uri)}}"><wl-icon>add</wl-icon></wl-button>`}
                </td>` : ''}
                `
                : html`<td colspan="4" style="text-align: center;"> <wl-progress-spinner></wl-progress-spinner> </td>`}
            </tr>`)
            : html`<tr><td colspan="4" class="info-center">- This setup has no input files -</td></tr>`}
            </tbody>
        </table>

        ${this._editing? html`
        <div style="float:right; margin-top: 1em;">
            <wl-button @click="${this._cancel}" style="margin-right: 1em;" flat inverted>
                <wl-icon>cancel</wl-icon>&ensp;Discard changes
            </wl-button>
            <wl-button @click="${this._saveConfig}">
                <wl-icon>save</wl-icon>&ensp;Save
            </wl-button>
        </div>` 
        :html`
        <div style="margin-top: 1em;">
            <wl-button style="float:right;" @click="${this._edit}"> <wl-icon>edit</wl-icon>&ensp;Edit </wl-button>
            <wl-button style="--primary-hue: 0; --primary-saturation: 75%" @click="${this._delete}"> <wl-icon>delete</wl-icon>&ensp;Delete </wl-button>
        </div>`}

        <models-configure-grid id="grid-configurator" ?active=${this._dialog == 'grid'} class="page"></models-configure-grid>
        <models-configure-time-interval id="time-interval-configurator" ?active=${this._dialog == 'timeInterval'} class="page">
        </models-configure-time-interval>
        <models-configure-person id="person-configurator" ?active=${this._dialog == 'person'} class="page"></models-configure-person>
        <models-configure-process id="process-configurator" ?active=${this._dialog == 'process'} class="page"></models-configure-process>
        <models-configure-parameter id="parameter-configurator" ?active=${this._dialog == 'parameter'} class="page"></models-configure-parameter>
        <models-configure-input id="input-configurator" ?active=${this._dialog == 'input'} class="page"></models-configure-input>
        <models-configure-region id="region-configurator" ?active=${this._dialog == 'region'} class="page"></models-configure-region>
        ${renderNotifications()}`
    } 

    _showGridDialog () {
        this._dialog = 'grid';
        let gridConfigurator = this.shadowRoot.getElementById('grid-configurator') as ModelsConfigureGrid;
        if (this._grid)
            gridConfigurator.setSelected(this._grid);
        gridConfigurator.open();
    }

    _showTimeIntervalDialog () {
        this._dialog = 'timeInterval';
        let timeIntervalConfigurator = this.shadowRoot.getElementById('time-interval-configurator') as ModelsConfigureTimeInterval;
        if (this._timeInterval)
            timeIntervalConfigurator.setSelected(this._timeInterval);
        timeIntervalConfigurator.open();
    }

    _loadSample (sampleID : string) {
        if (!this._sampleResources[sampleID] && !this._sampleResourcesLoading.has(sampleID)) {
            store.dispatch(sampleResourceGet(sampleID));
            this._sampleResourcesLoading.add(sampleID);
        }
    }

    _showRegionDialog () {
        this._dialog = 'region';
        let regionConfigurator = this.shadowRoot.getElementById('region-configurator') as ModelsConfigureRegion;
        regionConfigurator.open(this._setup.hasRegion);
    }

    _showNewInputDialog (datasetSpecUri: string) {
        this._dialog = 'input';
        let inputConfigurator = this.shadowRoot.getElementById('input-configurator') as ModelsConfigureInput;
        inputConfigurator.newInput(datasetSpecUri);
    }

    _showEditInputDialog (inputID: string, datasetSpecUri: string) {
        this._dialog = 'input';
        let inputConfigurator = this.shadowRoot.getElementById('input-configurator') as ModelsConfigureInput;
        if (this._sampleCollections[inputID]) {
            inputConfigurator.editCollection(inputID, datasetSpecUri);
        } else {
            inputConfigurator.edit(inputID, datasetSpecUri);
        }
    }

    _showParameterDialog (parameterID: string) {
        this._dialog = 'parameter';
        let parameterConfigurator = this.shadowRoot.getElementById('parameter-configurator') as ModelsConfigureParameter;
        parameterConfigurator.edit(parameterID);
    }

    _showAuthorDialog () {
        this._dialog = 'person';
        let selectedAuthors = this._setup.author ?
            this._setup.author
                    .map(x => typeof x === 'object' ? x : {id: x})
                    .reduce((acc: any, author: any) => {
                if (!acc[author.id]) acc[author.id] = true;
                return acc;
            }, {}) 
            : {};

        let personConfigurator = this.shadowRoot.getElementById('person-configurator') as ModelsConfigurePerson;
        personConfigurator.setSelected(selectedAuthors);
        personConfigurator.open();
    }

    _onAuthorsSelected () {
        let personConfigurator = this.shadowRoot.getElementById('person-configurator') as ModelsConfigurePerson;
        let selectedPersons = personConfigurator.getSelected();
        console.log('SELECTED AUTHORS:',selectedPersons);
        this._setup.author = [];
        selectedPersons.forEach((person) => {
            this._setup.author.push( {id: person.id, type: 'Person'} );
            this._authors[person.id] = person;
        });
        this.requestUpdate();
    }

    _onClosedDialog () {
        this._openedDialog = '';
    }

    _showProcessDialog () {
        this._dialog = 'process';
        let selectedProcesses = this._setup.hasProcess.reduce((acc: any, process: any) => {
            if (!acc[process.id]) acc[process.id] = true;
            return acc;
        }, {})
        let processConfigurator = this.shadowRoot.getElementById('process-configurator') as ModelsConfigureProcess;
        processConfigurator.setSelected(selectedProcesses);
        processConfigurator.open();
    }

    _onProcessesSelected () {
        let processConfigurator = this.shadowRoot.getElementById('process-configurator') as ModelsConfigureProcess;
        let selectedProcesses = processConfigurator.getSelected();
        console.log('SELECTED PROCESS:',selectedProcesses);
        this._setup.hasProcess = [];
        selectedProcesses.forEach((process) => {
            this._setup.hasProcess.push( {id: process.id, type: ['Process']} );
            this._processes[process.id] = process;
        });
        this.requestUpdate();
    }

    _onParameterEdited (ev) {
        let editedParameter = ev.detail;
        this._parameters[editedParameter.id] = editedParameter;
        this._editedParameters[editedParameter.id] = editedParameter;
        this.requestUpdate();
    }

    _onInputEdited (ev) {
        let editedInput = ev.detail.input;
        let datasetSpecId = ev.detail.datasetSpecificationUri;
        if (editedInput.type.indexOf('SampleCollection') >= 0) {
            this._sampleCollections[editedInput.id] = editedInput;
            this._editedSampleCollections[editedInput.id] = editedInput;
            editedInput.hasPart.forEach((sample) => {
                this._sampleResources[sample.id] = sample;
                this._editedSampleResources[sample.id] = sample;
            });
        } else {
            this._sampleResources[editedInput.id] = editedInput;
            this._editedSampleResources[editedInput.id] = editedInput;
        }
        this.requestUpdate();
    }

    _onRegionsSelected (ev) {
        //console.log('>>', ev.detail)
        this._setup.hasRegion = ev.detail;
        this._setup.hasRegion.forEach((r:Region) => {
            this._regions[r.id] = r;
        });
        this.requestUpdate();
    }

    _onGridSelected () {
        let gridConfigurator = this.shadowRoot.getElementById('grid-configurator') as ModelsConfigureGrid;
        let selectedGrid = gridConfigurator.getSelected();
        console.log('Changed grid:', selectedGrid);
        this._grid = selectedGrid;
        this.requestUpdate();
    }

    _onTimeIntervalSelected () {
        let timeIntervalConfigurator = this.shadowRoot.getElementById('time-interval-configurator') as ModelsConfigureTimeInterval;
        let selectedTimeInterval = timeIntervalConfigurator.getSelected();
        console.log('Changed time interval:', selectedTimeInterval);
        this._timeInterval = selectedTimeInterval;
        this.requestUpdate();
    }

    updated () {
        if (this._editing && this._setup) {
            if (this._setup.parameterAssignmentMethod && this._setup.parameterAssignmentMethod.length === 1) {
                let el = this.shadowRoot.getElementById('edit-setup-assign-method') as HTMLInputElement;
                el.value = this._setup.parameterAssignmentMethod[0];
            }
        }
    }

    firstUpdated () {
        this.addEventListener('dialogClosed', this._onClosedDialog);
        this.addEventListener('gridSelected', this._onGridSelected);
        this.addEventListener('timeIntervalSelected', this._onTimeIntervalSelected);
        this.addEventListener('authorsSelected', this._onAuthorsSelected);
        this.addEventListener('processesSelected', this._onProcessesSelected);
        this.addEventListener('parameterEdited', this._onParameterEdited);
        this.addEventListener('inputEdited', this._onInputEdited);
        this.addEventListener('regionsSelected', this._onRegionsSelected);
    }

    stateChanged(state: RootState) {
        if (state.explorerUI) {
            let ui = state.explorerUI;
            // check whats changed
            let modelChanged : boolean = (ui.selectedModel !== this._selectedModel);
            let versionChanged : boolean = (modelChanged || ui.selectedVersion !== this._selectedVersion)
            let configChanged : boolean = (versionChanged || ui.selectedConfig !== this._selectedConfig);
            let setupChanged : boolean = (configChanged || ui.selectedCalibration !== this._selectedSetup);
            this._editing = (ui.mode === 'edit');

            super.setRegionId(state);

            if (modelChanged) {
                this._selectedModel = ui.selectedModel;
                this._model = null;
            }
            if (versionChanged) {
                this._selectedVersion = ui.selectedVersion;
                this._version = null;
            }
            if (configChanged) {
                this._selectedConfig = ui.selectedConfig;
                this._config = null;
            }
            if (setupChanged) {
                this._selectedSetup = ui.selectedCalibration;
                this._setup = null;

                this._grid = null;
                this._gridLoading = false
                this._timeInterval = null;
                this._timeIntervalLoading = false
                this._softwareImage = null;
                this._softwareImageLoading = false

                this._parameters = {};
                this._parametersLoading = new Set();
                this._inputs = {};
                this._inputsLoading = new Set();
                this._sampleResources = {} as IdMap<SampleResource>;
                this._sampleResourcesLoading = new Set();
                this._sampleCollections = {} as IdMap<SampleCollection>;
                this._sampleCollectionsLoading = new Set();
                this._authors = {};
                this._authorsLoading = new Set();
                this._regions = {} as IdMap<Region>;
                this._regionsLoading = new Set();
                this._processes = {};
                this._processesLoading = new Set();
            }

            if (state.modelCatalog) {
                let db = state.modelCatalog;
                this.setRegion(state);

                // Set selected resources
                if (!this._model && db.models && this._selectedModel && db.models[this._selectedModel]) {
                    this._model = db.models[this._selectedModel];
                }
                if (!this._version && db.versions && this._selectedVersion && db.versions[this._selectedVersion]) {
                    this._version = db.versions[this._selectedVersion];
                }
                if (!this._config && this._selectedConfig && db.configurations && db.configurations[this._selectedConfig]) {
                    this._config =  db.configurations[this._selectedConfig];
                }

                if (db.setups) {
                    if (!this._setup && this._selectedSetup && db.setups[this._selectedSetup]) {
                        this._setup = { ...db.setups[this._selectedSetup] }; //this to no change on store
                        //console.log('LOADED CONFIGURATION, FETCHING PARAMETERS...');
                        // Fetching not loaded parameters 
                        (this._setup.hasParameter || []).forEach((p:Parameter) => {
                            if (typeof p === 'string') {
                                console.error(p, 'is not an object.')
                                p = {id: p};
                            }
                            if (!db.parameters || !db.parameters[p.id]) {
                                store.dispatch(parameterGet(p.id));
                            }
                            this._parametersLoading.add(p.id);
                        });

                        // Fetching not loaded inputs 
                        (this._setup.hasInput || []).forEach((i : SampleResource | SampleCollection) => {
                            if (typeof i === 'string') {
                                console.error(i, 'is not an object.')
                                i = {id: i};
                            }
                            if (!db.datasetSpecifications || !db.datasetSpecifications[i.id]) {
                                store.dispatch(datasetSpecificationGet(i.id));
                            }
                            this._inputsLoading.add(i.id);
                        });

                        // Fetching not loaded regions
                        (this._setup.hasRegion || []).forEach((regionObj: any) => {
                            let regionId : string;
                            if (typeof regionObj === 'object') {
                                regionId = regionObj.id;
                            } else {
                                console.error(regionObj + ' is not an object (region)');
                                regionId = regionObj.id;
                            }
                            if (!db.regions || !db.regions[regionId]) {
                                store.dispatch(regionGet(regionId));
                            }
                            this._regionsLoading.add(regionId);
                        });

                        // Fetching not loaded authors, for the moment only Persons TODO
                        (this._setup.author || []).forEach((author: Person) => {
                            if (typeof author === 'string') author = {id: author};
                            if (!db.persons || !db.persons[author.id]) {
                                store.dispatch(personGet(author.id));
                            }
                            this._authorsLoading.add(author.id);
                        });

                        // Fetching not loaded processes
                        (this._setup.hasProcess || []).forEach((process: Process) => {
                            if (typeof process === 'string') process = {id: process};
                            if (!db.processes || !db.processes[process.id]) {
                                store.dispatch(processGet(process.id));
                            }
                            this._processesLoading.add(process.id);
                        });

                        // Fetching ONE grid
                        if (!this._grid && this._setup.hasGrid) {
                            let gridId : string = typeof this._setup.hasGrid[0] === 'string' ?
                                this._setup.hasGrid[0] as string
                                : this._setup.hasGrid[0].id;
                            if (!db.grids || !db.grids[gridId]) {
                                store.dispatch(gridGet(gridId));
                                this._gridLoading = true;
                            }
                        }

                        // Fetching ONE time interval
                        if (!this._timeInterval && this._setup.hasOutputTimeInterval) {
                            let ti = this._setup.hasOutputTimeInterval[0];
                            let tiId = typeof ti === 'object' ? ti.id : ti;
                            if (!db.timeIntervals || !db.timeIntervals[tiId]) {
                                store.dispatch(timeIntervalGet(tiId));
                                this._timeIntervalLoading = true;
                            }
                        }

                        // Fetching ONE softwareImage FIXME
                        if (!this._softwareImage && this._setup.hasSoftwareImage) {
                            let si = this._setup.hasSoftwareImage[0];
                            let siId = typeof si === 'object' ? si.id : si;
                            if (!db.softwareImages || !db.softwareImages[siId]) {
                                store.dispatch(softwareImageGet(siId));
                                this._softwareImageLoading = true;
                            }
                        }

                    }
                }

                // Other resources
                if (this._setup) {
                    if (db.parameters) {
                        if (this._parametersLoading.size > 0 && this._setup.hasParameter) {
                            this._parametersLoading.forEach((uri:string) => {
                                if (db.parameters[uri]) {
                                    let tmp = { ...this._parameters };
                                    tmp[uri] = db.parameters[uri];
                                    this._parameters = tmp;
                                    this._parametersLoading.delete(uri);
                                }
                            })
                        }
                    }

                    if (db.datasetSpecifications) {
                        if (this._inputsLoading.size > 0 && this._setup.hasInput) {
                            this._inputsLoading.forEach((uri:string) => {
                                if (db.datasetSpecifications[uri]) {
                                    let tmp = { ...this._inputs };
                                    tmp[uri] = db.datasetSpecifications[uri];
                                    this._inputs = tmp;
                                    this._inputsLoading.delete(uri);
                                    if (tmp[uri].hasFixedResource && tmp[uri].hasFixedResource.length > 0) {
                                        tmp[uri].hasFixedResource.forEach(fixed => {
                                            if (fixed.type.indexOf('SampleCollection') >= 0) {
                                                store.dispatch(sampleCollectionGet(fixed.id))
                                                this._sampleCollectionsLoading.add(fixed.id);
                                            } else {
                                                store.dispatch(sampleResourceGet(fixed.id))
                                                this._sampleResourcesLoading.add(fixed.id);
                                            }
                                        });
                                    }
                                }
                            })
                        }
                    }

                    if (db.sampleResources) {
                        if (this._sampleResourcesLoading.size > 0) {
                            this._sampleResourcesLoading.forEach((uri:string) => {
                                if (db.sampleResources[uri]) {
                                    let tmp : IdMap<SampleResource> = { ...this._sampleResources };
                                    tmp[uri] = db.sampleResources[uri];
                                    this._sampleResources = tmp;
                                    this._sampleResourcesLoading.delete(uri);
                                }
                            });
                        }
                    }

                    if (db.sampleCollections) {
                        if (this._sampleCollectionsLoading.size > 0) {
                            this._sampleCollectionsLoading.forEach((uri:string) => {
                                if (db.sampleCollections[uri]) {
                                    let tmp : IdMap<SampleCollection> = { ...this._sampleCollections };
                                    tmp[uri] = db.sampleCollections[uri];
                                    this._sampleCollections = tmp;
                                    this._sampleCollectionsLoading.delete(uri);
                                }
                            });
                        }
                    }

                    if (db.persons) {
                        if (this._authorsLoading.size > 0 && this._setup.author) {
                            this._authorsLoading.forEach((uri:string) => {
                                if (db.persons[uri]) {
                                    let tmp = { ...this._authors };
                                    tmp[uri] = db.persons[uri];
                                    this._authors = tmp;
                                    this._authorsLoading.delete(uri);
                                }
                            })
                        }
                    }

                    if (db.regions) {
                        if (this._regionsLoading.size > 0 && this._setup.hasRegion) {
                            this._regionsLoading.forEach((uri:string) => {
                                if (db.regions[uri]) {
                                    let tmp = { ...this._regions };
                                    tmp[uri] = db.regions[uri];
                                    this._regions = tmp;
                                    this._regionsLoading.delete(uri);
                                }
                            })
                        }
                    }

                    if (db.processes) {
                        if (this._processesLoading.size > 0 && this._setup.hasProcess) {
                            this._processesLoading.forEach((uri:string) => {
                                if (db.processes[uri]) {
                                    let tmp = { ...this._processes };
                                    tmp[uri] = db.processes[uri];
                                    this._processes = tmp;
                                    this._processesLoading.delete(uri);
                                }
                            })
                        }
                    }

                    if (db.grids && !this._grid && this._setup.hasGrid) {
                        let gridId : string = typeof this._setup.hasGrid[0] === 'string' ?
                            this._setup.hasGrid[0] as string
                            : this._setup.hasGrid[0].id;
                        if (db.grids[gridId]) {
                            this._grid = db.grids[gridId];
                            this._gridLoading = false;
                        }
                    }

                    if (db.timeIntervals && !this._timeInterval && this._setup.hasOutputTimeInterval) {
                        let ti = this._setup.hasOutputTimeInterval[0];
                        let tiId = typeof ti === 'object' ? ti.id : ti;
                        if (db.timeIntervals[tiId]) {
                            this._timeInterval = db.timeIntervals[tiId];
                            this._timeIntervalLoading = false;
                        }
                    }

                    if (db.softwareImages && !this._softwareImage && this._setup.hasSoftwareImage) {
                        let si : SoftwareImage = typeof this._setup.hasSoftwareImage[0] === 'string' ?
                            {id: <unknown>this._setup.hasSoftwareImage[0] as string} as SoftwareImage
                            : this._setup.hasSoftwareImage[0];
                        if (db.softwareImages[si.id]) {
                            this._softwareImage = db.softwareImages[si.id];
                            this._softwareImageLoading = false;
                        }
                    }
                }

            }
        }
    }
}
