import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../model-explore/explorer-styles'

import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';

//import { renderNotifications } from "util/ui_renders";
//import { showNotification, showDialog, hideDialog } from 'util/ui_functions';

import { parameterGet, datasetSpecificationGet, configurationPut, personGet, gridGet, timeIntervalGet,
         configurationPost, processGet, softwareImageGet } from 'model-catalog/actions';
import { sortByPosition, createUrl, renderExternalLink, renderParameterType } from './util';

import "weightless/slider";
import "weightless/progress-spinner";
//import "weightless/tab";
//import "weightless/tab-group";
import 'components/loading-dots'

@customElement('models-configure-configuration')
export class ModelsConfigureConfiguration extends connect(store)(PageViewElement) {
    @property({type: Boolean})
    private _editing : boolean = false;

    @property({type: Object})
    private _model: any = null;

    @property({type: Object})
    private _version: any = null;

    @property({type: Object})
    private _config: any = null;

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

    @property({type: Object})
    private _softwareImage : any = null;

    private _selectedModel : string = '';
    private _selectedVersion : string = '';
    private _selectedConfig : string = '';

    private _parametersLoading : Set<string> = new Set();
    private _inputsLoading : Set<string> = new Set();
    private _authorsLoading : Set<string> = new Set();
    private _processsLoading : Set<string> = new Set();
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

            .monospaced {
                font: 12px Monaco, Consolas, "Andale Mono", "DejaVu Sans Mono", monospace;
            }

            .number {
                font-family: helvetica;
            }

            .details-table > tbody > tr > td > span {
                display: inline-block;
                border-radius: 4px;
                line-height: 20px;
                padding: 1px 4px;
                margin-right: 4px;
                margin-bottom: 2px;
            }

            .details-table td {
                padding: 5px 1px;
                vertical-align: top;
            }

            span.author {
                border: 2px solid cadetblue;
            }

            span.process {
                border: 2px solid purple;
            }

            span.time-interval {
                border: 2px solid burlywood;
            }

            span.grid {
                border: 2px solid teal;
            }
            `,
        ];
    }

    _cancel () {
        goToPage(createUrl(this._model, this._version, this._config));
    }

    _edit () {
        let el = this.shadowRoot.getElementById('start');
        console.log(el)
        if (el) {
            el.scrollIntoView({behavior: "smooth", block: "start"})
        }
        goToPage(createUrl(this._model, this._version, this._config) + '/edit');
    }

    _saveConfig () {
        let labelEl     = this.shadowRoot.getElementById('edit-config-name') as HTMLInputElement;
        let descEl      = this.shadowRoot.getElementById('edit-config-desc') as HTMLInputElement;
        let keywordsEl  = this.shadowRoot.getElementById('edit-config-keywords') as HTMLInputElement;
        let imgEl       = this.shadowRoot.getElementById('edit-config-sw-img') as HTMLInputElement;
        let complocEl   = this.shadowRoot.getElementById('edit-config-comp-loc') as HTMLInputElement;

        /*
        let authEl = this.shadowRoot.getElementById('edit-config-authors') as HTMLInputElement;
        let repoEl = this.shadowRoot.getElementById('edit-config-repo') as HTMLInputElement;
        let paramEls = this.shadowRoot.querySelectorAll('.edit-config-param');
        // TODO: capture min and max val, check what to do with the inputs
        let inputEls = this.shadowRoot.querySelectorAll('.edit-config-input');*/

        if (labelEl && descEl && keywordsEl && imgEl && complocEl) {
            let label    = labelEl.value;
            let desc     = descEl.value;
            let keywords = keywordsEl.value;
            let dImg     = imgEl.value;
            let compLoc  = complocEl.value;

            if (!label) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>labelEl).refreshAttributes();
                return;
            }
            let editedConfig = {...this._config};
            editedConfig.label = [label];
            editedConfig.description = [desc];
            editedConfig.keywords = [keywords.split(/ *, */).join('; ')];
            editedConfig.hasSoftwareImage = [dImg];
            editedConfig.hasComponentLocation = [compLoc];

            console.log(Object.keys(this._config).filter((key) => this._config[key] != editedConfig[key]));
            store.dispatch(configurationPut(editedConfig));
        }

        /*if (labelEl && descEl && authEl) {
            let auth = authEl.value;
            let repo = repoEl.value;
            let params = Array.from(paramEls).map(e => (<HTMLInputElement>e).value);
            let inputs = Array.from(inputEls).map(e => (<HTMLInputElement>e).value);



            let newConfigMeta = Object.assign({}, this._configMetadata[0]);
            newConfigMeta.desc = desc;
            newConfigMeta.keywords = keywords.split(',');
            newConfigMeta.repo = repo;
            newConfigMeta.compLoc = compLoc;
            newConfigMeta.dImg = dImg;

            let newAuthors = auth.split(',').map(x => {return {label: x, name: x}});
            
            let newConfigParameters = Object.assign({}, this._parameters);
            for (let i = 0; i < params.length; i++) {
                newConfigParameters[i]['defaultvalue'] = params[i];
            }

            let newConfigInputs = Object.assign({}, this._inputs);
            for (let i = 0; i < inputs.length; i++) {
                newConfigInputs[i]['fixedValueURL'] = inputs[i];
            }

            store.dispatch(addParameters(this._config.uri, Object.values(newConfigParameters)));
            store.dispatch(addMetadata(this._config.uri, [newConfigMeta]));
            //store.dispatch(addInputs(this._config.uri, Object.values(Object.assign(newConfigInputs))));
            //store.dispatch(addAuthor(this._config.uri, newAuthors))
            showNotification("saveNotification", this.shadowRoot!);
            goToPage(this._url);
        }*/
    }

    protected render() {
        // Sort parameters by order
        let paramOrder = []
        if (this._config.hasParameter) {
            Object.values(this._parameters).sort(sortByPosition).forEach((id) => {
                if (typeof id === 'object') id = id.id;
                paramOrder.push(id);
            });
            this._config.hasParameter.forEach((id) => {
                if (typeof id === 'object') id = id.id;
                if (paramOrder.indexOf(id) < 0) {
                    paramOrder.push(id)
                }
            })
        }

        // Sort inputs by order
        let inputOrder = []
        if (this._config.hasInput) {
            Object.values(this._inputs).sort(sortByPosition).forEach((id) => {
                if (typeof id === 'object') id = id.id;
                inputOrder.push(id);
            });
            this._config.hasInput.forEach((id) => {
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

        return html`
        <span id="start"/>
        <table class="details-table">
            <tr>
                <td>Description:</td>
                <td>
                    ${this._config.description}
                </td>
            </tr>

            <tr>
                <td>Keywords:</td>
                <td>${keywords}</td>
            </tr>
            <tr>
                <td>Authors:</td>
                <td>
                    ${this._config.author ? 
                    html`${this._config.author.map(a => typeof a === 'object' ? a.id : a).map((authorUri:string) => 
                        (this._authors[authorUri] ?
                            html`<span class="author">${this._authors[authorUri].label}</span>`
                            : authorUri + ' ')
                    )}
                    ${this._authorsLoading.size > 0 ? html`<loading-dots style="--width: 20px"></loading-dots>`: ''}`
                    : 'No authors'}
                </td>
            </tr>
            <tr>
                <td>Software Image:</td>
                <td>
                    ${this._config.hasSoftwareImage ? 
                    ((this._softwareImage && Object.keys(this._softwareImage).length > 0) ?
                        html`TODO: ${Object.keys(this._softwareImage)}`
                        : html`${this._config.hasSoftwareImage[0].id} ${this._softwareImageLoading ?
                            html`<loading-dots style="--width: 20px"></loading-dots>`: ''}`)
                    : 'No software image'}
                </td>
            </tr>
            <tr>
                <td>Component Location:</td>
                <td>${renderExternalLink(this._config.hasComponentLocation)}</td>
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
                    (this._timeInterval ?
                        html `<span class="time-interval">${this._timeInterval.label} (fixme)</span>`
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
                        (this._processes[procUri] ?
                        html`<span class="process">${this._processes[procUri].label}</span>`
                        : procUri + ' '))}
                    ${this._processesLoading.size > 0 ? html`<loading-dots style="--width: 20px"></loading-dots>`: ''}`
                    : 'No processes'}
                </td>
            </tr>
        </table>

        <wl-title level="4" style="margin-top:1em;">Parameters:</wl-title>
        <table class="pure-table pure-table-striped" style="width: 100%">
            <colgroup>
                <col span="1" style="width: 55px;">
                <col span="1">
                <col span="1">
                <col span="1">
                <col span="1">
            </colgroup>
            <thead>
                <th class="ta-right"><b>#</b></th>
                <th><b>Label</b></th>
                <th><b>Type</b></th>
                <th class="ta-right">
                    <b>Default Value</b>
                </th>
                <th class="ta-right"><b>Unit</b></th>
            </thead>
            <tbody>
            ${this._config.hasParameter ? paramOrder.map((uri:string) => html`
            <tr>
                ${this._parameters[uri] ? html`
                <td class="ta-right">${this._parameters[uri].position}</td>
                <td>
                    <code>${this._parameters[uri].label}</code><br/>
                    <b>${this._parameters[uri].description}</b>
                </td>
                <td>
                    ${renderParameterType(this._parameters[uri])}
                </td>
                <td class="ta-right">
                    ${this._parameters[uri].hasDefaultValue ? this._parameters[uri].hasDefaultValue : '-'}
                </td>
                <td class="ta-right">${this._parameters[uri].usesUnit}</td>`
                : html`<td colspan="5" style="text-align: center;"> <wl-progress-spinner></wl-progress-spinner> </td>`}
            </tr>`)
            : html`<tr><td colspan="5" class="info-center">- This configuration has no parameters -</td></tr>`}
            </tbody>
        </table>

        <wl-title level="4" style="margin-top:1em;">Input files:</wl-title>
        <table class="pure-table pure-table-striped" style="width: 100%">
            <colgroup>
                <col span="1" style="width: 55px;">
                <col span="1">
                <col span="1">
                <col span="1">
            </colgroup>
            <thead>
                <th class="ta-right"><b>#</b></th>
                <th><b>Name</b></th>
                <th><b>Description</b></th>
                <th class="ta-right"><b>Format</b></th>
            </thead>
            <tbody>
            ${this._config.hasInput ? inputOrder.map((uri:string) => html `
            <tr>${this._inputs[uri] ? html`
                <td class="ta-right">${this._inputs[uri].position}</td>
                <td><code>${this._inputs[uri].label}</code></td>
                <td>${this._inputs[uri].description}</td>
                <td class="ta-right monospaced">${this._inputs[uri].hasFormat}</td>`
                : html`<td colspan="4" style="text-align: center;"> <wl-progress-spinner></wl-progress-spinner> </td>`}
            </tr>`)
            : html`<tr><td colspan="4" class="info-center">- This configuration has no input files -</td></tr>`}
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
        <div style="float:right; margin-top: 1em;">
            <wl-button @click="${this._edit}">
                <wl-icon>edit</wl-icon>&ensp;Edit
            </wl-button>
        </div>`}`
    }

    _renderEditConfig () {
        let loadingMeta = !this._configMetadata;
        let loadingParams = !this._parameters;
        let loadingIO = !this._inputs
        let meta = (!loadingMeta && this._configMetadata.length > 0) ? this._configMetadata[0] : null;
        let params = (!loadingParams && this._parameters.length > 0) ? this._parameters : null;
        let inputs = (!loadingIO && this._inputs.length > 0) ? this._inputs : null;

        return html`
        <div style="margin-bottom: 1em;">
            <wl-textfield id="edit-config-name" label="Config name" value="${this._config.label}" disabled></wl-textfield>
            <wl-textarea id="edit-config-desc" label="Description" value="${meta ? meta.desc : ''}"></wl-textarea>
            <wl-textarea id="edit-config-keywords" label="Keywords" value="${meta ? meta.keywords.join(', ') : ''}"></wl-textarea>
            <wl-textfield id="edit-config-authors" label="Authors" value="${this._authors && this._authors.length > 0 ?
                this._authors.map(c => c.name).join(', ') : ''}" disabled></wl-textfield>
            <br/>
            <wl-textfield id="edit-config-sw-img" label="Software Image" value="${meta ? meta.dImg : ''}"></wl-textfield>
            <wl-textfield id="edit-config-repo" label="Repository" value="${meta ? meta.repo : ''}"></wl-textfield>
            <wl-textfield id="edit-config-comp-loc" label="Component Location" value="${meta ? meta.compLoc : ''}"></wl-textfield>
        </div>

        <wl-title level="4" style="margin-top:1em;">Parameters:</wl-title>
        <table class="pure-table pure-table-striped" style="width: 100%">
            <thead>
                <th class="ta-right"><b>#</b></th>
                <th><b>Label</b></th>
                <th><b>Type</b></th>
                <th class="ta-right">
                    <b>Default Value</b>
                </th>
                <th class="ta-right"><b>Unit</b></th>
            </thead>
            <tbody>
            ${loadingParams ? html`<tr><td colspan="5" style="text-align: center;"> <wl-progress-spinner></wl-progress-spinner> </td></tr>`
            : ( !params ? html`<tr><td colspan="5" class="info-center">- This configuration has no parameters -</td></tr>`
                : params.map((p:any) => html`
                <tr>
                    <td class="ta-right">${p.position}</td>
                    <td>
                        <code>${p.paramlabel}</code><br/>
                        <b>${p.description}</b>
                    </td>
                    <td>
                        ${p.type} ${p.pdatatype ? '(' + p.pdatatype + ')' : ''}
                        ${(p.minVal || p.maxVal) ? html`<br/><span style="font-size: 11px;">Range is from ${p.minVal} to ${p.maxVal}</span>` : '' }
                    </td>
                    <td class="ta-right">
                    ${(p.minVal || p.maxVal) ? html`
                    <wl-slider class="edit-config-param" thumblabel value="${p.defaultvalue}" min="${p.minVal}" max="${p.maxVal}"
                            step="${p.pdatatype=='float' ? .01 : 1}">
                        <input slot="before" class="input-range value-edit" type="number" placeholder="-" value="${p.minVal || ''}"></input>
                        <input slot="after" class="input-range value-edit" type="number" placeholder="-" value="${p.maxVal || ''}"></input>
                    </wl-slider>
                    ` : html`
                    <input class="value-edit edit-config-param" type="text" placeholder="-" value="${p.defaultvalue || ''}"></input>
                    `}
                    </td>
                    <td class="ta-right">${p.unit}</td>
                </tr>`))}
            </tbody>
        </table>

        <wl-title level="4" style="margin-top:1em;">Input files:</wl-title>
        <table class="pure-table pure-table-striped" style="width: 100%">
            <colgroup>
                <col span="1">
                <col span="1">
                <col span="1">
                <col span="1">
            </colgroup>
            <thead>
                <th class="ta-right"><b>#</b></th>
                <th><b>Name</b></th>
                <th><b>Description</b></th>
                <th class="ta-right"><b>Format</b></th>
            </thead>
            <tbody>
            ${loadingIO ? html`<tr><td colspan="3" style="text-align: center;"> <wl-progress-spinner></wl-progress-spinner> </td></tr>`
            : (!inputs ?  html`<tr><td colspan="3" class="info-center">- This configuration has no input files -</td></tr>`
                : inputs.map(i => html`
                <tr>
                    <td class="ta-right">${i.position}</td>
                    <td><code>${i.label}</code></td>
                    <td>${i.desc}</td>
                    <td class="ta-right">${i.format}</td>
                </tr>
            `))}
            </tbody>
        </table>
`
    }


    updated () {
        if (this._editing) {
            let keywordsEl = this.shadowRoot.getElementById('edit-config-keywords');
            if (keywordsEl) (<any>keywordsEl).refreshHeight();
        }
    }


    stateChanged(state: RootState) {
        if (state.explorerUI) {
            let ui = state.explorerUI;
            // check whats changed
            let modelChanged : boolean = (ui.selectedModel !== this._selectedModel);
            let versionChanged : boolean = (modelChanged || ui.selectedVersion !== this._selectedVersion)
            let configChanged : boolean = (versionChanged || ui.selectedConfig !== this._selectedConfig);
            this._editing = (ui.mode === 'edit');

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

                        // Fetching not loaded authors, for the momen only Persons TODO
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
                        if (this._inputsLoading.size > 0 && this._config.hasParameter) {
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
