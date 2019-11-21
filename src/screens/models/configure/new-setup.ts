import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../model-explore/explorer-styles'

import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';

import { renderNotifications } from "util/ui_renders";
import { showNotification, showDialog, hideDialog } from 'util/ui_functions';

import { personGet, personPost, modelConfigurationPost, parameterPost, modelConfigurationPut,
         parameterGet, datasetSpecificationGet, gridGet,
         timeIntervalGet,  processGet, softwareImageGet, } from 'model-catalog/actions';
import { sortByPosition, createUrl, renderExternalLink, renderParameterType } from './util';

import "weightless/slider";
import "weightless/progress-spinner";
//import "weightless/tab";
//import "weightless/tab-group";
import 'components/loading-dots'

import './person';
import './process';
import { ModelsConfigurePerson } from './person';
import { ModelsConfigureProcess } from './process';
import { ModelsConfigureParameter } from './parameter';

@customElement('models-new-setup')
export class ModelsNewSetup extends connect(store)(PageViewElement) {
    @property({type: Boolean})
    private _editing : boolean = false;

    @property({type: Object})
    private _model: any = null;

    @property({type: Object})
    private _version: any = null;

    @property({type: Object})
    private _config: any = null;

    @property({type: Object})
    private _originalConfig : any = null;

    @property({type: Object})
    private _parameters : any = {};

    @property({type: Object})
    private _inputs : any = {};

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
    private _dialog : 'person' | 'process' | 'parameter' | undefined;

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
                text-align: right;
                padding-right: 6px;
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

    _addSetupToConfig (setupId) {
        if (!this._originalConfig.hasSetup) {
            this._originalConfig.hasSetup = []
        }
        this._originalConfig.hasSetup.push({id: setupId})
        store.dispatch(modelConfigurationPut(this._originalConfig));
    }

    private _parameterIdentifier = 0;
    private _waitingParameters : Set<string> = new Set();
    private _newParametersUris : string[] = [];
    private _setupIdentifier = 0;
    private _waitingFor : string = '';

    _saveNewSetup () {
        let nameEl      = this.shadowRoot.getElementById('new-setup-name') as HTMLInputElement;
        let descEl      = this.shadowRoot.getElementById('new-setup-desc') as HTMLInputElement;
        let keywordsEl  = this.shadowRoot.getElementById('new-setup-keywords') as HTMLInputElement;
        let assignMeEl  = this.shadowRoot.getElementById('new-setup-assign-method') as HTMLInputElement;
        let complocEl   = this.shadowRoot.getElementById('new-setup-comp-loc') as HTMLInputElement;

        if (nameEl && descEl && keywordsEl && assignMeEl && complocEl) {
            let name        = nameEl.value;
            let desc        = descEl.value;
            let keywords    = keywordsEl.value;
            let assignMe    = assignMeEl.value;
            let comploc     = complocEl.value;

            if (!name || !assignMe) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>nameEl).refreshAttributes();
                (<any>assignMeEl).refreshAttributes();
                this._scrollUp();
                return;
            }

            let setupCreated = {...this._config};

            setupCreated.id = undefined;
            setupCreated.label = [name];
            setupCreated.description = [desc];
            setupCreated.keywords = [keywords.split(/ *, */).join('; ')];
            setupCreated.hasComponentLocation = [comploc];
            setupCreated.parameterAssignmentMethod = [assignMe];

            /* FIXME: Parameters are returning 400, numbers are not objects!!
            setupCreated.hasParameter = this._newParametersUris.map((uri) => {
                return {'id': uri}
            });
            */

            this._waitingFor = 'PostSetup' + this._setupIdentifier;
            this._setupIdentifier += 1;

            store.dispatch(modelConfigurationPost(setupCreated, this._waitingFor));
            console.log(setupCreated);
            

            //showNotification("saveNotification", this.shadowRoot!);
            //goToPage(createUrl(this._model, this._version, this._config));
        }
    }

    _newSetup () {
        let nameEl      = this.shadowRoot.getElementById('new-setup-name') as HTMLInputElement;
        let assignMeEl  = this.shadowRoot.getElementById('new-setup-assign-method') as HTMLInputElement;

        if (nameEl && assignMeEl) {
            let name        = nameEl.value;
            let assignMe    = assignMeEl.value;

            if (!name || !assignMe) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>nameEl).refreshAttributes();
                (<any>assignMeEl).refreshAttributes();
                this._scrollUp();
                return;
            }

            let parametersToCreate = this._config.hasParameter.map(e => typeof e === 'object' ? e.id :e);

            parametersToCreate.forEach(id => {
                let newParam = { ... this._parameters[id] };
                newParam.id = undefined
                newParam.position = [newParam.position];
                let identifier = 'PParameter' + this._parameterIdentifier;
                store.dispatch(parameterPost(newParam, identifier));
                this._waitingParameters.add(identifier);
                this._parameterIdentifier += 1;
            });
            this._waiting = true;

            showNotification("saveNotification", this.shadowRoot!);
        }
    }

    protected render() {
        // Sort parameters by order
        let paramOrder = []
        if (this._config.hasParameter) {
            Object.values(this._parameters).sort(sortByPosition).forEach((id: any) => {
                if (typeof id === 'object') id = id.id;
                paramOrder.push(id);
            });
            this._config.hasParameter.forEach((id: any) => {
                if (typeof id === 'object') id = id.id;
                if (paramOrder.indexOf(id) < 0) {
                    paramOrder.push(id)
                }
            })
        }

        // Sort inputs by order
        let inputOrder = []
        if (this._config.hasInput) {
            Object.values(this._inputs).sort(sortByPosition).forEach((id: any) => {
                if (typeof id === 'object') id = id.id;
                inputOrder.push(id);
            });
            this._config.hasInput.forEach((id: any) => {
                if (typeof id === 'object') id = id.id;
                if (inputOrder.indexOf(id) < 0) {
                    inputOrder.push(id)
                }
            })
        }
        let keywords = ''
        if (this._config.keywords) {
            keywords = this._config.keywords[0].split(/ *; */).join(', ');
        }

        // FIXME this should work with the new API
        let selectRegions = [];
        if (this._region['model_catalog_uri'] === 'https://w3id.org/okn/i/mint/Ethiopia') {
            selectRegions = [
                {label: 'Baro basin', id: 'https://w3id.org/okn/i/mint/Baro'},
                {label: 'Gambella region', id: 'https://w3id.org/okn/i/mint/Gambella'},
            ]
        } else if (this._region['model_catalog_uri'] === 'https://w3id.org/okn/i/mint/South_Sudan') {
            selectRegions = [
                {label: 'Pongo basin', id: 'https://w3id.org/okn/i/mint/Pongo_Basin_SS'},
            ]
        } else if (this._region['model_catalog_uri'] === 'https://w3id.org/okn/i/mint/Texas') {
            selectRegions = [
                {label: 'Barton Springs', id: ''},
            ]
        }

        return html`
        <span id="start"/>
        <wl-textfield id="new-setup-name" label="New setup name" value="" required></wl-textfield>

        <table class="details-table">
            <colgroup width="150px">
            <tr>
                <td>Description:</td>
                <td>
                    <textarea id="new-setup-desc" name="description" rows="5"></textarea>
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
                    <select id="edit-config-regions">
                        ${selectRegions.map(r => html`<option value="${r.id}">${r.label}</option>`)}
                    </select>
                </td>
            </tr>

            <tr>
                <td>Authors:</td>
                <td>
                    ${this._config.author && this._config.author.length > 0? 
                    html`${this._config.author.map(a => typeof a === 'object' ? a.id : a).map((authorUri:string) => 
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
                        <option value="Expert-tuned">Expert tuned</option>
                    </wl-select>
                </td>
            </tr>

            <tr>
                <td>Software Image:</td>
                <td>
                    <input id="new-setup-software-image" type="text" value="${this._softwareImage ? this._softwareImage.label : ''}"/>
                </td>
            </tr>

            <tr>
                <td>Component Location:</td>
                <td>
                    <textarea id="new-setup-comp-loc"></textarea>
                </td>
            </tr>

            <tr>
                <td>Grid:</td>
                <td>
                    ${this._config.hasGrid ?
                    (this._grid ?
                        html`
                        <span class="grid">
                            <span style="margin-right: 30px; text-decoration: underline;">${this._grid.label}</span>
                            <span style="font-style: oblique; color: gray;">${this._grid.type.filter(g => g != 'Grid')}</span>
                            <wl-icon style="margin-left:10px">edit</wl-icon>
                            <br/>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="font-size: 12px;">Spatial resolution:</span>
                                <span style="margin-right:20px; font-size: 14px;" class="monospaced">${this._grid.hasSpatialResolution}</span>
                                <span style="font-size: 12px;">Dimensions:</span>
                                <span style="margin-right:20px" class="number">${this._grid.hasDimension}</span>
                                <span style="font-size: 12px;">Shape:</span>
                                <span style="font-size: 14px" class="monospaced">${this._grid.hasShape}</span>
                            </div>
                        </span>`
                        : html`${this._config.hasGrid[0].id} ${this._gridLoading ?
                            html`<loading-dots style="--width: 20px"></loading-dots>` : ''}`) 
                    : 'No grid'}
                </td>
            </tr>

            <tr>
                <td>Time interval:</td>
                <td>
                    ${this._config.hasOutputTimeInterval ?
                    (this._timeInterval ? html`
                        <span class="time-interval">
                            ${this._timeInterval.label}
                            <wl-icon style="margin-left:10px">edit</wl-icon>
                        </span>`
                        : html`${this._config.hasOutputTimeInterval[0].id} ${this._timeIntervalLoading ? 
                            html`<loading-dots style="--width: 20px"></loading-dots>` : ''}`)
                    : 'No time interval'}
                </td>
            </tr>

            <tr>
                <td>Processes:</td>
                <td>
                    ${this._config.hasProcess ?
                    html`${this._config.hasProcess.map(a => typeof a === 'object' ? a.id : a).map((procUri:string) => 
                        (this._processes[procUri] ? html`
                        <span class="process">
                            ${this._processes[procUri].label}
                        </span>`
                        : procUri + ' '))}
                    ${this._processesLoading.size > 0 ? html`<loading-dots style="--width: 20px"></loading-dots>`: ''}`
                    : 'No processes'}
                    <wl-button style="float:right;" class="small" flat inverted
                        @click="${this._showProcessDialog}"><wl-icon>edit</wl-icon></wl-button>
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
                <th class="ta-right">
                    <b>Value in this setup</b>
                    <span class="tooltip" tip="If a value is set up in this field, you will not be able to change it in run time. For example, a price adjustment is set up to be 10%, it won't be editable when running the the model">
                        <wl-icon>help</wl-icon>
                    </span>
                </th>
                <th class="ta-right"><b>Unit</b></th>
                <th class="ta-right"></th>
            </thead>
            <tbody>
            ${this._config.hasParameter ? paramOrder.map((uri:string) => html`
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
                </td>
                <td class="ta-right">${this._parameters[uri].usesUnit ?this._parameters[uri].usesUnit[0].label : ''}</td>
                <td style="text-align: right;">
                    <wl-button @click="${() => this._showParameterDialog(uri)}"class="small"><wl-icon>edit</wl-icon></wl-button>
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
                <th><b>Name</b></th>
                <th><b>Description</b></th>
                <th class="ta-right"><b>Format</b></th>
            </thead>
            <tbody>
            ${this._config.hasInput ? inputOrder.map((uri:string) => html `
            <tr>${this._inputs[uri] ? html`
                <td><code>${this._inputs[uri].label}</code></td>
                <td>${this._inputs[uri].description}</td>
                <td class="ta-right monospaced">${this._inputs[uri].hasFormat}</td>`
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
        
        <models-configure-person id="person-configurator" ?active=${this._dialog == 'person'} class="page"></models-configure-person>
        <models-configure-process id="process-configurator" ?active=${this._dialog == 'process'} class="page"></models-configure-process>
        <models-configure-parameter id="parameter-configurator" ?active=${this._dialog == 'parameter'} class="page"></models-configure-parameter>
        ${renderNotifications()}`
    }

    _showAuthorDialog () {
        this._dialog = 'person';
        console.log(this._config.author);
        let selectedAuthors = this._config.author.filter(x => x.type === "Person").reduce((acc, author) => {
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
        this._config.author = [];
        selectedPersons.forEach((person) => {
            this._config.author.push( {id: person.id, type: 'Person'} );
            this._authors[person.id] = person;
        });
        this.requestUpdate();
    }

    _onClosedDialog () {
        this._openedDialog = '';
    }

    _showProcessDialog () {
        this._dialog = 'process';
        let selectedProcesses = this._config.hasProcess.reduce((acc: any, process: any) => {
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
        this._config.hasProcess = [];
        selectedProcesses.forEach((process) => {
            this._config.hasProcess.push( {id: process.id, type: 'Process'} );
            this._processes[process.id] = process;
        });
        this.requestUpdate();
    }

    _showParameterDialog (parameterID: string) {
        //FIXME
        this._dialog = 'parameter';
        let parameterConfigurator = this.shadowRoot.getElementById('parameter-configurator') as ModelsConfigureParameter;
        parameterConfigurator.edit(parameterID);
    }

    _onParameterEdited (ev) {
        //console.log(ev);
        let editedParameter = ev.detail;
        this._parameters[editedParameter.id] = editedParameter;
        this.requestUpdate();
        //let parameterConfigurator = this.shadowRoot.getElementById('parameter-configurator');
        //FIXME
    }

    firstUpdated () {
        this.addEventListener('dialogClosed', this._onClosedDialog);
        this.addEventListener('authorsSelected', this._onAuthorsSelected);
        this.addEventListener('processesSelected', this._onProcessesSelected);
        this.addEventListener('parameterEdited', this._onParameterEdited);
    }

    stateChanged(state: RootState) {
        if (state.explorerUI) {
            let ui = state.explorerUI;
            // check whats changed
            let modelChanged : boolean = (ui.selectedModel !== this._selectedModel);
            let versionChanged : boolean = (modelChanged || ui.selectedVersion !== this._selectedVersion)
            let configChanged : boolean = (versionChanged || ui.selectedConfig !== this._selectedConfig);
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
            }

            if (state.modelCatalog) {
                let db = state.modelCatalog;

                //TO SAVE
                if (this._waitingFor) {
                    if (db.created[this._waitingFor]) {
                        let newid = this._waitingFor;
                        this._waitingFor = '';
                        this._addSetupToConfig(db.created[newid]);
                    }
                }
                /*if (this._waiting) {
                    if (this._waitingFor && db.created[this._waitingFor]) {
                        console.log(db.created[this._waitingFor]);
                    } else {
                        if (this._waitingParameters.size > 0) {
                            this._waitingParameters.forEach((id) => {
                                if (db.created[id]) {
                                    this._newParametersUris.push(db.created[id]);
                                    this._waitingParameters.delete(id);
                                }
                            });
                        } else {
                            console.log('NEW PARAMS URIS:', this._newParametersUris)
                            this._saveNewSetup();
                        }
                    }
                }*/

                // Set selected resources
                if (!this._model && db.models && this._selectedModel && db.models[this._selectedModel]) {
                    this._model = db.models[this._selectedModel];
                }
                if (!this._version && db.versions && this._selectedVersion && db.versions[this._selectedVersion]) {
                    this._version = db.versions[this._selectedVersion];
                }
                if (db.configurations) {
                    if (!this._config && this._selectedConfig && db.configurations[this._selectedConfig]) {
                        this._config = { ...db.configurations[this._selectedConfig] }; //this to no change on store
                        this._originalConfig = { ...db.configurations[this._selectedConfig] }; //this to no change on store
                        this._config.author = [];
                        this._waitingParameters = new Set();
                        this._newParametersUris = [];
                        //console.log('LOADED CONFIGURATION, FETCHING PARAMETERS...');
                        // Fetching not loaded parameters 
                        (this._config.hasParameter || []).forEach((p) => {
                            if (typeof p === 'object') p = p.id;
                            if (!db.parameters || !db.parameters[p]) {
                                store.dispatch(parameterGet(p));
                            }
                            this._parametersLoading.add(p);
                        });

                        // Fetching not loaded inputs 
                        (this._config.hasInput || []).forEach((i) => {
                            if (typeof i === 'object') {
                                if (i.type.indexOf('DatasetSpecification') < 0) {
                                    console.log(i, 'is not a DatasetSpecification (input)', this._config);
                                }
                                i = i.id;
                            } else {
                                console.log(i, 'is not an object (input)', this._config);
                            }
                            if (!db.datasetSpecifications || !db.datasetSpecifications[i]) {
                                store.dispatch(datasetSpecificationGet(i));
                            }
                            this._inputsLoading.add(i);
                        });

                        // Fetching not loaded authors, for the moment only Persons
                        (this._config.author || []).forEach((authorUri) => {
                            if (typeof authorUri === 'object') authorUri = authorUri.id;
                            if (!db.persons || !db.persons[authorUri]) {
                                store.dispatch(personGet(authorUri));
                            }
                            this._authorsLoading.add(authorUri);
                        });

                        // Fetching not loaded processes
                        (this._config.hasProcess || []).forEach((processUri) => {
                            if (typeof processUri === 'object') processUri = processUri.id;
                            if (!db.processes || !db.processes[processUri]) {
                                store.dispatch(processGet(processUri));
                            }
                            this._processesLoading.add(processUri);
                        });

                        // Fetching ONE grid
                        if (!this._grid && this._config.hasGrid) {
                            let gridId = typeof this._config.hasGrid[0] === 'object' ?  this._config.hasGrid[0].id : this._config.hasGrid[0];
                            if (!db.grids || !db.grids[gridId]) {
                                store.dispatch(gridGet(gridId));
                                this._gridLoading = true;
                            }
                        }

                        // Fetching ONE time interval
                        if (!this._timeInterval && this._config.hasOutputTimeInterval) {
                            let ti = this._config.hasOutputTimeInterval[0];
                            let tiId = typeof ti === 'object' ? ti.id : ti;
                            if (!db.timeIntervals || !db.timeIntervals[tiId]) {
                                store.dispatch(timeIntervalGet(tiId));
                                this._timeIntervalLoading = true;
                            }
                        }

                        // Fetching ONE softwareImage
                        if (!this._softwareImage && this._config.hasSoftwareImage) {
                            let si = this._config.hasSoftwareImage[0];
                            let siId = typeof si === 'object' ? si.id : si;
                            if (!db.softwareImages || !db.softwareImages[siId]) {
                                store.dispatch(softwareImageGet(siId));
                                this._softwareImageLoading = true;
                            }
                        }

                    }
                }

                // Other resources
                if (this._config) {
                    if (db.parameters) {
                        if (this._parametersLoading.size > 0 && this._config.hasParameter) {
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
                        if (this._inputsLoading.size > 0 && this._config.hasInput) {
                            this._inputsLoading.forEach((uri:string) => {
                                if (db.datasetSpecifications[uri]) {
                                    let tmp = { ...this._inputs };
                                    tmp[uri] = db.datasetSpecifications[uri];
                                    this._inputs = tmp;
                                    this._inputsLoading.delete(uri);
                                }
                            })
                        }
                    }

                    if (db.persons) {
                        if (this._authorsLoading.size > 0 && this._config.author) {
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
                        if (this._processesLoading.size > 0 && this._config.hasProcess) {
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

                    if (db.grids && !this._grid && this._config.hasGrid) {
                        let gridId = typeof this._config.hasGrid[0] === 'object' ?  this._config.hasGrid[0].id : this._config.hasGrid[0];
                        if (db.grids[gridId]) {
                            this._grid = db.grids[gridId];
                            this._gridLoading = false;
                        }
                    }

                    if (db.timeIntervals && !this._timeInterval && this._config.hasOutputTimeInterval) {
                        let ti = this._config.hasOutputTimeInterval[0];
                        let tiId = typeof ti === 'object' ? ti.id : ti;
                        if (db.timeIntervals[tiId]) {
                            this._timeInterval = db.timeIntervals[tiId];
                            this._timeIntervalLoading = false;
                        }
                    }

                    if (db.softwareImages && !this._softwareImage && this._config.hasSoftwareImage) {
                        let si = this._config.hasSoftwareImage[0];
                        let siId = typeof si === 'object' ? si.id : si;
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
