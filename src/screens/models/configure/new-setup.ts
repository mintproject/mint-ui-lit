import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../model-explore/explorer-styles'

import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';

import { renderNotifications } from "util/ui_renders";
import { showNotification, showDialog, hideDialog } from 'util/ui_functions';

import { personGet, modelConfigurationSetupPost, parameterGet, datasetSpecificationGet, gridGet,
         timeIntervalGet,  processGet, softwareImageGet, } from 'model-catalog/actions';
import { sortByPosition, createUrl, renderExternalLink, renderParameterType } from './util';

import { IdMap } from 'app/reducers';
import { Person, Parameter, DatasetSpecification, Process, SampleResource, SampleCollection,
         Region, Model, SoftwareVersion, ModelConfiguration, ModelConfigurationSetup } from '@mintproject/modelcatalog_client';

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

@customElement('models-new-setup')
export class ModelsNewSetup extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _model: Model;

    @property({type: Object})
    private _regions : IdMap<Region> = {} as IdMap<Region>;

    @property({type: Object})
    private _version: SoftwareVersion;

    @property({type: Object})
    private _config: ModelConfiguration;

    @property({type: Object})
    private _setup : ModelConfigurationSetup = null;

    @property({type: Object})
    private _parameters : any = {};

    @property({type: Object})
    private _inputs : any = {};

    @property({type: Object})
    private _sampleResources : IdMap<SampleResource> = {} as IdMap<SampleResource>;

    @property({type: Object})
    private _sampleCollections : IdMap<SampleCollection> = {} as IdMap<SampleCollection>;

    @property({type: Object})
    private _authors : any = {};

    @property({type: Object})
    private _processes : any = {};

    @property({type: Object})
    private _grid : any = null;

    @property({type: Object})
    private _timeInterval : any = null;

    @property({type: Boolean})
    private _waiting : boolean = false;

    @property({type: Object})
    private _softwareImage : any = null;

    @property({type: String})
    private _dialog : ''|'person'|'process'|'parameter'|'input'|'region'|'grid'|'timeInterval' = '';

    @property({type: String})
    private _mode : string = '';

    private _selectedModel : string = '';
    private _selectedVersion : string = '';
    private _selectedConfig : string = '';
    private _openedDialog : string = '';

    private _parametersLoading : Set<string> = new Set();
    private _inputsLoading : Set<string> = new Set();
    private _authorsLoading : Set<string> = new Set();
    private _processesLoading : Set<string> = new Set();
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

            .details-table tr td:first-child {
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
            `,
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
        goToPage(createUrl(this._model, this._version, this._config));
    }

    _saveNewSetup () {
        let nameEl      = this.shadowRoot.getElementById('new-setup-name') as HTMLInputElement;
        let descEl      = this.shadowRoot.getElementById('new-setup-desc') as HTMLInputElement;
        let keywordsEl  = this.shadowRoot.getElementById('new-setup-keywords') as HTMLInputElement;
        let assignMeEl  = this.shadowRoot.getElementById('new-setup-assign-method') as HTMLInputElement;
        let usageEl     = this.shadowRoot.getElementById('new-setup-usage-notes') as HTMLInputElement;

        if (nameEl && descEl && keywordsEl && assignMeEl) {
            let name        = nameEl.value;
            let desc        = descEl.value;
            let keywords    = keywordsEl.value;
            let assignMe    = assignMeEl.value;
            let notes       = usageEl.value;

            if (!name || !assignMe) {
                if (!name) nameEl.setAttribute('invalid', 'true');
                if (!assignMe) assignMeEl.setAttribute('invalid', 'true');
                this._scrollUp();
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                return;
            }

            let setupCreated = {...this._setup};

            delete setupCreated.hasSetup;
            setupCreated.id = undefined;
            setupCreated.type = ['ModelConfigurationSetup', 'Theory-GuidedModel', 'ConfigurationSetup'];
            setupCreated.label = [name];
            setupCreated.description = [desc];
            setupCreated.hasUsageNotes = [notes];
            setupCreated.keywords = [keywords.split(/ *, */).join('; ')];
            setupCreated.parameterAssignmentMethod = [assignMe];

            setupCreated.hasGrid = this._grid ? [this._grid] : undefined;
            setupCreated.hasOutputTimeInterval = this._timeInterval ? [this._timeInterval] : undefined;

            setupCreated.hasInput = (setupCreated.hasInput || []).map((input: DatasetSpecification) => {
                let newInput = this._inputs[input.id];
                newInput.id = '';
                newInput.hasFixedResource = (newInput.hasFixedResource||[]).map((sample:SampleCollection|SampleResource) => {
                    sample.id = '';
                    sample['hasPart'] = ((<SampleCollection>sample).hasPart||[]).map((sr:SampleResource) => {
                        sr.id = '';
                        return sr;
                    });
                    return sample;
                });
                return newInput;
            });
            setupCreated.hasParameter = (setupCreated.hasParameter || []).map((param: Parameter) => {
                let newParam = this._parameters[param.id];
                if (!newParam['isAdjustable'] && (!newParam.hasFixedValue || newParam.hasFixedValue.length === 0) && newParam.hasDefaultValue) {
                    newParam.hasFixedValue = newParam.hasDefaultValue;
                }
                newParam.id = '';
                return newParam;
            });

            store.dispatch(modelConfigurationSetupPost(setupCreated, this._config)).then((setup:ModelConfigurationSetup) => {
                goToPage(createUrl(this._model, this._version, this._config, setup));
            });
            showNotification("saveNotification", this.shadowRoot!);
        }
    }

    protected render() {
        if (!this._setup) {
            return html`<div style="text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`;
        }
        // Sort parameters by order
        let paramOrder = []
        if (this._setup.hasParameter) {
            Object.values(this._parameters).sort(sortByPosition).forEach((id: any) => {
                if (typeof id === 'object') id = id.id;
                if (id) paramOrder.push(id);
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
        if (this._setup.hasInput) {
            Object.values(this._inputs).sort(sortByPosition).forEach((id: any) => {
                if (typeof id === 'object') id = id.id;
                if (id) inputOrder.push(id);
            });
            this._setup.hasInput.forEach((id: any) => {
                if (typeof id === 'object') id = id.id;
                if (inputOrder.indexOf(id) < 0) {
                    inputOrder.push(id)
                }
            })
        }
        let keywords = ''
        if (this._setup.keywords) {
            keywords = this._setup.keywords[0].split(/ *; */).join(', ');
        }

        return html`
        <table class="details-table" id="start">
            <colgroup width="150px">

            <tr>
                <td colspan="2" style="padding: 5px 20px;">
                    <wl-textfield id="new-setup-name" label="New setup name" value="" required></wl-textfield>
                </td>
            </tr>

            <tr>
                <td>Description:</td>
                <td>
                    <textarea id="new-setup-desc" name="description" rows="4"></textarea>
                </td>
            </tr>

            <tr>
                <td>Keywords:</td>
                <td>
                    <input id="new-setup-keywords" type="text" value="${keywords}"/>
                </td>
            </tr>

            <tr>
                <td>Region:</td>
                <td>
                    ${this._setup.hasRegion.map((r:Region) => this._regions[r.id] ?
                        html`<span class="region">${this._regions[r.id].label}</span>`
                        : html`${r.id} <loading-dots style="--width: 20px"></loading-dots>`
                    )}
                    <wl-button style="float:right;" class="small" flat inverted
                        @click="${this._showRegionDialog}"><wl-icon>edit</wl-icon></wl-button>
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
                    <wl-button style="float:right;" class="small" flat inverted
                        @click="${this._showAuthorDialog}"><wl-icon>edit</wl-icon></wl-button>
                </td>
            </tr>

            <tr>
                <td>Parameter assignment method:</td>
                <td>
                    <wl-select id="new-setup-assign-method" label="Parameter assignment method" placeholder="Select a parameter assignament method" required>
                        <option value="" disabled selected>Please select a parameter assignment method</option>
                        <option value="Calibration">Calibration</option>
                        <option value="Expert-configured">Expert tuned</option>
                    </wl-select>
                </td>
            </tr>

            <tr>
                <td>Software Image:</td>
                <td>
                    <span class="software-image">${this._softwareImage ? this._softwareImage.label : 'No software image'}</span>
                </td>
            </tr>

            <tr>
                <td>Component Location:</td>
                <td>
                    <textarea id="new-setup-comp-loc" disabled>${this._setup.hasComponentLocation}</textarea>
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
                    <wl-button style="float:right;" class="small" flat inverted
                        @click="${this._showGridDialog}"><wl-icon>edit</wl-icon></wl-button>
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
                    <wl-button style="float:right;" class="small" flat inverted
                        @click="${this._showTimeIntervalDialog}"><wl-icon>edit</wl-icon></wl-button>
                </td>
            </tr>

            <tr>
                <td>Processes:</td>
                <td>
                    ${this._setup.hasProcess ?
                    html`${this._setup.hasProcess.map(a => typeof a === 'object' ? a.id : a).map((procUri:string) => 
                        (this._processes[procUri] ? html`
                        <span class="process">
                            ${this._processes[procUri].label ? this._processes[procUri].label : this._processes[procUri].id}
                        </span>`
                        : procUri + ' '))}
                    ${this._processesLoading.size > 0 ? html`<loading-dots style="--width: 20px"></loading-dots>`: ''}`
                    : 'No processes'}
                    <wl-button style="float:right;" class="small" flat inverted
                        @click="${this._showProcessDialog}"><wl-icon>edit</wl-icon></wl-button>
                </td>
            </tr>

            <tr>
                <td>Usage notes:</td>
                <td>
                    <textarea id="new-setup-usage-notes" rows="6">${this._setup.hasUsageNotes}</textarea>
                </td>
            </tr>

        </table>

        <wl-title level="4" style="margin-top:1em;">Parameters:</wl-title>
        <table class="pure-table pure-table-striped" style="width: 100%">
            <colgroup>
                <col span="1">
                <col span="1">
                <col span="1">
                <col span="1">
                <col span="1">
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
                <th class="ta-right" style="white-space:nowrap;" colspan="1">
                    <b>Adjustable</b>
                    <span class="tooltip" style="white-space:normal;"
                     tip="An adjustable parameter is a knob that a user will be able to fill with a value when executing the model">
                        <wl-icon>help</wl-icon>
                    </span>
                </th>
                <th> </th>
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
                <td style="text-align: center;">
                    <wl-button flat inverted @click="${() => {
                            this._parameters[uri]['isAdjustable'] = !this._parameters[uri]['isAdjustable'];
                            this.requestUpdate();
                        }}">
                        <wl-icon>${this._parameters[uri]['isAdjustable'] ? 'check_box' : 'check_box_outline_blank'}</wl-icon>
                    </wl-button>
                </td>
                <td>
                    <wl-button flat inverted @click="${() => this._showParameterDialog(uri)}" class="small"><wl-icon>edit</wl-icon></wl-button>
                </td>
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
                <th style="white-space:nowrap;" colspan="2">
                    <b>Value in this setup</b>
                    <span class="tooltip" style="white-space:normal;" tip="If a value is set up in this field, you will not be able to change it in run time.">
                        <wl-icon>help</wl-icon>
                    </span>
                </th>
            </thead>
            <tbody>
            ${this._setup.hasInput ? inputOrder.map((uri:string) => html `
            <tr>${this._inputs[uri] ? html`
                <td>
                    <code style="font-size: 13px">${this._inputs[uri].label}</code>
                    ${this._inputs[uri].hasFormat && this._inputs[uri].hasFormat.length === 1 ?  
                        html`<span class="monospaced" style="color: gray;">(.${this._inputs[uri].hasFormat})<span>` : ''}
                    <br/>
                    ${this._inputs[uri].description}
                </td>
                <td>
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
                                <summary style="cursor: pointer;">${sample.label}</summary>
                                <div style="padding-left: 14px;">
                                    ${this._sampleResources[sample.id] ? html`
                                    <a target="_blank" href="${this._sampleResources[sample.id].value}">
                                        ${this._sampleResources[sample.id].value}
                                    </a><br/>
                                    <span class="monospaced" style="white-space: nowrap;">${this._sampleResources[sample.id].dataCatalogIdentifier}</span>
                                </div>
                                ` : html`${sample.id.split('/').pop()} <loading-dots style="--width: 20px"></loading-dots>`}
                            `)}
                        </span>`
                        : html`${fixed.id.split('/').pop()} <loading-dots style="--width: 20px"></loading-dots>`))
                    : html`
                    <div class="info-center" style="white-space:nowrap;">- Not set -</div>`}
                </td>
                <td class="ta-right">
                    <wl-button @click="${() => {this._showNewInputDialog(uri)}}" class="small" flat inverted><wl-icon>add</wl-icon></wl-button>
                </td>`
                : html`<td colspan="4" style="text-align: center;"> <wl-progress-spinner></wl-progress-spinner> </td>`}
            </tr>`)
            : html`<tr><td colspan="4" class="info-center">- This configuration has no input files -</td></tr>`}
            </tbody>
        </table>

        <div style="float:right; margin-top: 1em;">
            <wl-button @click="${this._cancel}" style="margin-right: 1em;" flat inverted>
                <wl-icon>cancel</wl-icon>&ensp;Discard changes
            </wl-button>
            <wl-button @click="${this._saveNewSetup}">
                <wl-icon>save</wl-icon>&ensp;Save
            </wl-button>
        </div>

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

    clearForm () {
        let nameEl      = this.shadowRoot.getElementById('new-setup-name') as HTMLInputElement;
        let descEl      = this.shadowRoot.getElementById('new-setup-desc') as HTMLInputElement;
        let keywordsEl  = this.shadowRoot.getElementById('new-setup-keywords') as HTMLInputElement;
        let assignMeEl  = this.shadowRoot.getElementById('new-setup-assign-method') as HTMLInputElement;
        let usageEl     = this.shadowRoot.getElementById('new-setup-usage-notes') as HTMLInputElement;
        if (nameEl && descEl && keywordsEl && assignMeEl) {
            nameEl      .value = '';
            descEl      .value = '';
            keywordsEl  .value = '';
            assignMeEl  .value = '';
            usageEl     .value = '';
        }
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

    _showNewInputDialog ( datasetSpecUri : string ) {
        this._dialog = 'input';
        let inputConfigurator = this.shadowRoot.getElementById('input-configurator') as ModelsConfigureInput;
        inputConfigurator.newInput(datasetSpecUri);
    }

    _showRegionDialog () {
        this._dialog = 'region';
        let regionConfigurator = this.shadowRoot.getElementById('region-configurator') as ModelsConfigureRegion;
        regionConfigurator.open(this._setup.hasRegion);
    }

    _showAuthorDialog () {
        this._dialog = 'person';
        let selectedAuthors = this._setup.author
                .map(x => typeof x === 'object' ? x : {id: x})
                .reduce((acc, author: Person) => {
            if (!acc[author.id]) acc[author.id] = true;
            return acc;
        }, {})
        let personConfigurator = this.shadowRoot.getElementById('person-configurator') as ModelsConfigurePerson;
        personConfigurator.setSelected(selectedAuthors);
        personConfigurator.open();
    }

    _onAuthorsSelected () {
        let personConfigurator = this.shadowRoot.getElementById('person-configurator') as ModelsConfigurePerson;
        let selectedPersons = personConfigurator.getSelected();
        console.log('SELECTED AUTHORS:',selectedPersons);
        this._setup.author = selectedPersons;
        selectedPersons.forEach((person) => {
            this._authors[person.id] = person;
        });
        this.requestUpdate();
    }

    _onClosedDialog () {
        this._openedDialog = '';
    }

    _showProcessDialog () {
        this._dialog = 'process';
        let selectedProcesses = (this._setup.hasProcess||[]).reduce((acc: any, process: any) => {
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
        this._setup.hasProcess = selectedProcesses;
        selectedProcesses.forEach((process) => {
            this._processes[process.id] = process;
        });
        this.requestUpdate();
    }

    _showParameterDialog (parameterID: string) {
        this._dialog = 'parameter';
        let parameterConfigurator = this.shadowRoot.getElementById('parameter-configurator') as ModelsConfigureParameter;
        parameterConfigurator.edit(parameterID);
    }

    _onParameterEdited (ev) {
        let editedParameter = ev.detail;
        this._parameters[editedParameter.id] = editedParameter;
        this.requestUpdate();
    }

    _onInputCreated (ev) {
        let createdInput = ev.detail.input;
        let datasetSpecId = ev.detail.datasetSpecificationUri;
        createdInput.id = datasetSpecId.split('/').pop() + createdInput.id;

        if (this._sampleCollections[createdInput.id]) delete this._sampleCollections[createdInput.id];
        if (this._sampleResources[createdInput.id]) delete this._sampleResources[createdInput.id];

        if (createdInput.type.indexOf('SampleCollection') >= 0) {
            this._sampleCollections[createdInput.id] = createdInput;
            createdInput.hasPart.forEach((sample) => {
                this._sampleResources[sample.id] = sample;
            });
        } else {
            this._sampleResources[createdInput.id] = createdInput;
        }
        this._inputs[datasetSpecId].hasFixedResource = [createdInput];
        this.requestUpdate();
    }

    _onRegionsSelected (ev) {
        console.log('>>', ev.detail)
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

    firstUpdated () {
        this.addEventListener('dialogClosed', this._onClosedDialog);
        this.addEventListener('gridSelected', this._onGridSelected);
        this.addEventListener('timeIntervalSelected', this._onTimeIntervalSelected);
        this.addEventListener('authorsSelected', this._onAuthorsSelected);
        this.addEventListener('processesSelected', this._onProcessesSelected);
        this.addEventListener('parameterEdited', this._onParameterEdited);
        this.addEventListener('inputCreated', this._onInputCreated);
        this.addEventListener('regionsSelected', this._onRegionsSelected);
    }

    stateChanged(state: RootState) {
        if (state.explorerUI) {
            let ui = state.explorerUI;
            // check whats changed
            let modelChanged : boolean = (ui.selectedModel !== this._selectedModel);
            let versionChanged : boolean = (modelChanged || ui.selectedVersion !== this._selectedVersion)
            let configChanged : boolean = (versionChanged || ui.selectedConfig !== this._selectedConfig);

            if (ui.mode != this._mode) {
                this.clearForm();
            }
            this._mode = ui.mode;

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
                this._authors = {};
                this._authorsLoading = new Set();
                this._processes = {};
                this._processesLoading = new Set();

                this.clearForm();
            }

            if (state.modelCatalog) {
                let db = state.modelCatalog;
                this._regions = db.regions;

                // Set selected resources
                if (!this._model && db.models && this._selectedModel && db.models[this._selectedModel]) {
                    this._model = db.models[this._selectedModel];
                }
                if (!this._version && db.versions && this._selectedVersion && db.versions[this._selectedVersion]) {
                    this._version = db.versions[this._selectedVersion];
                }
                if (db.configurations) {
                    if (!this._config && this._selectedConfig && db.configurations[this._selectedConfig]) {
                        this._config = db.configurations[this._selectedConfig];
                        this._setup = { ...db.configurations[this._selectedConfig] } as ModelConfigurationSetup; 
                        this._setup.author = [];
                        this._setup.hasRegion = [];
                        if (this._region && this._region.model_catalog_uri) {
                            if (db.regions && db.regions[this._region.model_catalog_uri]) {
                                this._setup.hasRegion.push( db.regions[this._region.model_catalog_uri] );
                            } else {
                                this._setup.hasRegion.push( {id: this._region.model_catalog_uri, label: [this._region.name]} );
                            }
                        }

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
                        (this._setup.hasInput || []).forEach((i:DatasetSpecification) => {
                            if (typeof i === 'string') {
                                console.error(i, 'is not an object.')
                                i = {id: i};
                            }
                            if (!db.datasetSpecifications || !db.datasetSpecifications[i.id]) {
                                store.dispatch(datasetSpecificationGet(i.id));
                            }
                            this._inputsLoading.add(i.id);
                        });

                        // Fetching not loaded authors, for the moment only Persons
                        (this._setup.author || []).forEach((author:Person) => {
                            if (typeof author === 'string') {
                                console.error(author, 'is not an object.')
                                author = {id: author};
                            }
                            if (!db.persons || !db.persons[author.id]) {
                                store.dispatch(personGet(author.id));
                            }
                            this._authorsLoading.add(author.id);
                        });

                        // Fetching not loaded processes
                        (this._setup.hasProcess || []).forEach((process:Process) => {
                            if (typeof process === 'string') {
                                console.error(process, 'is not an object.')
                                process = {id: process};
                            }
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

                        // Fetching ONE softwareImage
                        if (!this._softwareImage && this._setup.hasSoftwareImage) {
                            let si = this._setup.hasSoftwareImage[0];
                            let siId = typeof si === 'object' ? si['id'] : si;
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
                                    tmp[uri] = { ... db.datasetSpecifications[uri] };
                                    this._inputs = tmp;
                                    this._inputsLoading.delete(uri);
                                }
                            })
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

                    if (db.processes) {
                        if (this._processesLoading.size > 0 && this._setup.hasProcess) {
                            this._processesLoading.forEach((uri:string) => {
                                if (db.processes[uri]) {
                                    //console.log(uri, db.process[uri].label)
                                    let tmp = { ...this._processes };
                                    tmp[uri] = db.processes[uri];
                                    this._processes = tmp;
                                    this._processesLoading.delete(uri);
                                }
                            })
                        }
                    }

                    if (db.grids && !this._grid && this._setup.hasGrid) {
                        let gridId:string = typeof this._setup.hasGrid[0] === 'string'?
                            this._setup.hasGrid[0] as string
                            : this._setup.hasGrid[0].id;
                        if (db.grids[gridId]) {
                            this._grid = db.grids[gridId];
                            this._gridLoading = false;
                        }
                    }

                    if (db.timeIntervals && !this._timeInterval && this._setup.hasOutputTimeInterval) {
                        let ti = this._setup.hasOutputTimeInterval[0];
                        let tiId : string = typeof ti === 'object' ? ti['id'] : ti;
                        if (db.timeIntervals[tiId]) {
                            this._timeInterval = db.timeIntervals[tiId];
                            this._timeIntervalLoading = false;
                        }
                    }

                    if (db.softwareImages && !this._softwareImage && this._setup.hasSoftwareImage) {
                        let si = this._setup.hasSoftwareImage[0];
                        let siId = typeof si === 'object' ? si['id'] : si;
                        if (db.softwareImages[siId]) {
                            this._softwareImage = db.softwareImages[siId];
                            this._softwareImageLoading = false;
                        }
                    }
                }

            }
        }
    }
}
