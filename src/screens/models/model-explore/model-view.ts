import { html, property, customElement, css } from 'lit-element';

import { PageViewElement } from 'components/page-view-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { IdMap } from 'app/reducers'

import { Model, SoftwareVersion, ModelConfiguration, ModelConfigurationSetup, Person, Organization, Region, FundingInformation, 
         Image, Grid, TimeInterval, Process, Visualization, SourceCode, SoftwareImage, Parameter, DatasetSpecification,
         Intervention, VariablePresentation } from '@mintproject/modelcatalog_client';

import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';
import { ModelCatalogState } from 'model-catalog-api/reducers';

import { setupInRegion, capitalizeFirstLetter, getId, getLabel, getURL, uriToId, sortByPosition, isExecutable,
         getModelTypeNames } from 'model-catalog/util';
import { GalleryEntry } from 'components/image-gallery';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from './explorer-styles'
import marked from 'marked';

import { showDialog, hideDialog } from 'util/ui_functions';
import { urlify } from 'util/ui_renders';

import { goToPage } from 'app/actions';
import "weightless/expansion";
import "weightless/tab";
import "weightless/tab-group";
import "weightless/card";
import "weightless/icon";
import "weightless/progress-spinner";
import "weightless/progress-bar";
import "weightless/select";
import 'components/image-gallery';
import 'components/loading-dots';

import { Select } from "weightless/select";

type tabType = 'overview'|'io'|'variables'|'tech'|'example';

@customElement('model-view')
export class ModelView extends connect(store)(PageViewElement) {
    private PREFIX : string = 'models/explore/';
    // URIs of selected resources
    @property({type:String}) private _selectedModel   : string = '';
    @property({type:String}) private _selectedVersion : string = '';
    @property({type:String}) private _selectedConfig  : string = '';
    @property({type:String}) private _selectedSetup   : string = '';

    // All versions, configs and setups
    @property({type: Object}) private _versions : IdMap<SoftwareVersion> = {} as IdMap<SoftwareVersion>;
    @property({type: Object}) private _configs : IdMap<ModelConfiguration> = {} as IdMap<ModelConfiguration>;
    @property({type: Object}) private _setups : IdMap<ModelConfigurationSetup> = {} as IdMap<ModelConfigurationSetup>;
    @property({type: Object}) private _regions : IdMap<Region> = {} as IdMap<Region>;

    // Direct data for this model, selected config and setup, loaded from store
    @property({type: Object}) private _model! : Model;
    @property({type: Object}) private _version : SoftwareVersion | null = null;
    @property({type: Object}) private _config : ModelConfiguration | null = null;
    @property({type: Object}) private _setup : ModelConfigurationSetup | null = null;
    @property({type: Object}) private _logo! : Image;
    @property({type: Object}) private _authors : IdMap<Person> = {} as IdMap<Person>;
    @property({type: Object}) private _funding : IdMap<FundingInformation> = {} as IdMap<FundingInformation>;
    @property({type: Object}) private _organizations : IdMap<Organization> = {} as IdMap<Organization>;
    @property({type: Object}) private _timeIntervals : IdMap<TimeInterval> = {} as IdMap<TimeInterval>;
    @property({type: Object}) private _grids : IdMap<Grid> = {} as IdMap<Grid>;
    @property({type: Object}) private _processes : IdMap<Process> = {} as IdMap<Process>;
    @property({type: Object}) private _images : IdMap<Image> = {} as IdMap<Image>;
    @property({type: Object}) private _visualizations : IdMap<Visualization> = {} as IdMap<Visualization>;
    @property({type: Object}) private _sourceCodes : IdMap<SourceCode> = {} as IdMap<SourceCode>;
    @property({type: Object}) private _softwareImages : IdMap<SoftwareImage> = {} as IdMap<SoftwareImage>;
    @property({type: Object}) private _parameters : IdMap<Parameter> = {} as IdMap<Parameter>;
    @property({type: Object}) private _datasetSpecifications : IdMap<DatasetSpecification> = {} as IdMap<DatasetSpecification>;
    @property({type: Object}) private _datasetSpecifications2 : IdMap<DatasetSpecification> = {} as IdMap<DatasetSpecification>;
    @property({type: Object}) private _interventions : IdMap<Intervention> = {} as IdMap<Intervention>;
    @property({type: Object}) private _variablePresentations : IdMap<VariablePresentation> = {} as IdMap<VariablePresentation>;

    // Computed data
    @property({type: Array}) private _modelRegions : string[] | null = null;
    @property({type: String}) private _runArgs : string = '';

    // View controls
    @property({type: Object}) private _loading : IdMap<boolean> = {} as IdMap<boolean>;
    @property({type: Object}) private _loadedPresentations : IdMap<boolean> = {} as IdMap<boolean>;
    @property({type: Boolean}) private _shouldUpdateConfigs : boolean = false;
    @property({type: Boolean}) private _shouldUpdateSetups : boolean = false;
    @property({type: Boolean}) private _loadingGlobals : boolean = false;
    @property({type: Boolean}) private _loadingRegions : boolean = false;
    @property({type: String}) private _tab : tabType = 'overview';

    @property({type: Boolean}) private _setupNotFound : boolean = false;

    private _emulators = {
        'https://w3id.org/okn/i/mint/CYCLES' : '/emulators/cycles',
        'https://w3id.org/okn/i/mint/TOPOFLOW': '/emulators/topoflow',
        'https://w3id.org/okn/i/mint/PIHM' : '/emulators/pihm',
        'https://w3id.org/okn/i/mint/HAND' : '/emulators/hand'
    }

    static get styles() {
        return [SharedStyles, ExplorerStyles,
            css `
                .hidden {
                    display: none !important;
                }

                .config-selector {
                    display: grid;
                    grid-template-columns: 50px auto 205px;
                    align-items: center;
                    height: 50px;
                }

                .setup-selector {
                    display: grid;
                    grid-template-columns: 50px auto 144px;
                    align-items: center;
                    height: 50px;
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

                a[disabled] {
                    cursor: not-allowed;
                }

                .wrapper {
                    display:grid;
                    grid-gap:4px;
                    grid-template-columns: 1fr 1fr 1fr 1fr;
                }

                .col-img {
                    grid-column: 1 / 2;
                    grid-row: 2;
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
                    grid-row: 2;
                }

                .col-title {
                    grid-column: 2 / 5;
                    grid-row: 1;
                }

                .col-desc > wl-select {
                    width: calc(100% - 100px);
                    margin-left:25px;
                }

                .col-desc > .tooltip > wl-icon {
                    padding-top: 16px;
                    --icon-size: 24px;
                }

                .tooltip-text {
                    display: inline;
                    border-bottom: 1px dotted;
                    margin: 0;
                }

                .tooltip.nm {
                    margin: 0;
                }

                .desc-ext {
                    padding: 10px 5px 0px 5px;
                    line-height: 1.5em;
                }

                .desc-ext > wl-text {
                    display: block;
                }

                .row-tab-header {
                    grid-column: 1 / 5;
                    grid-row: 3;
                }
                
                .row-tab-content {
                    grid-column: 1 / 5;
                    grid-row: 4;
                }
                
                .info-center {
                    text-align: center;
                    font-size: 13pt;
                    height: 32px;
                    line-height:32px;
                    color: #999;
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

                .rdf-icon[disabled] {
                    display: inline-block;
                    vertical-align: middle;
                    height: 22px;
                    width: 24px;
                    background: url(images/rdf-disabled.png) no-repeat 0px 0px;
                    background-size: 20px 22px;
                    cursor: not-allowed;
                }

                .table-title {
                    padding-bottom: 0 !important;
                    font-size: 13px !important;
                    font-weight: bold !important;
                }

                .row-tab-content > wl-title {
                    margin-top: 6px;
                    margin-bottom: 4px;
                }

                .link {
                    border-bottom: 1px dotted;
                    cursor: pointer;
                }

                .code-example {
                    display: grid;
                    grid-template-columns: auto 38px;
                    line-height:38px;
                    height: 38px;
                    background-color: white;
                    padding-left:10px;
                    border-radius: 8px;
                    margin: 10px;
                }

                .small-tooltip:hover::after {
                    bottom: 38px;
                    right: 10%;
                    width: 130px;
                }

                .small-tooltip:hover::before {
                    bottom: 32px;
                    right: 35%;
                }

                .config-tooltip:hover::after {
                    bottom: 38px;
                    right: 10%;
                    width: 320px;
                }

                .config-tooltip:hover::before {
                    bottom: 32px;
                    right: 30%;
                }

                .io-tooltip:hover::after {
                    bottom: 28px;
                    right: 10%;
                    width: 340px;
                }

                .io-tooltip:hover::before {
                    bottom: 22px;
                    right: 30%;
                }

                .table-tooltip:hover::after {
                    text-align: left;
                    font-size: 14px;
                    bottom: 28px;
                    right: 10%;
                    width: 270px;
                }

                .table-tooltip:hover::before {
                    bottom: 22px;
                    right: 30%;
                }
                `
        ];
    }

    _renderCLIDialog () {
        return html`
        <wl-dialog class="larger" id="CLIDialog" fixed backdrop blockscrolling>
            <h3 slot="header">Execute with DAME</h3>
            <div slot="content">
                <wl-text> You can run this model with the following command: </wl-text>
                <div class="monospaced code-example">
                    <div style="font-size: 14px; overflow: hidden;">
                        <span style="color: darkgray;">$</span> dame run ${this._runArgs}
                    </div>
                    <div>
                        <!-- TODO: Notify copy! -->
                        <wl-button inverted flat @click="${this._copyRun}">
                            <wl-icon>link</wl-icon>
                        </wl-button>
                    </div>
                </div>
                <wl-text> 
                    Visit the
                    <a target="_blank" href="https://mint-cli.readthedocs.io/en/latest/">
                        <b>DAME</b> website
                    </a>
                    (Desktop Application for Model Execution) 
                    for documentation and installation instructions.
                </wl-text>
            </div>
            <div slot="footer">
                <wl-button @click="${() => hideDialog("CLIDialog", this.shadowRoot)}" style="margin-right: 5px;" inverted flat>Close</wl-button>
            </div>
        </wl-dialog>`
    }

    _openCLIDialog (uri:string) {
        this._runArgs = uriToId(uri);
        showDialog("CLIDialog", this.shadowRoot);
    }

    _copyRun () {
        let text : string = 'dame run ' + this._runArgs;
        navigator.clipboard.writeText(text).then(() => {
            console.log('Text copied!');
        }, (err) => {
            console.warn('Could no copy text', err);
        })
    }

    _editModel () {
        goToPage('models/edit/' + getURL(this._selectedModel) + '/edit');
    }

    _goToEdit (configUri: string, setupUri?:string) {
        goToPage('models/configure/' + getURL(this._selectedModel, this._selectedVersion, configUri, setupUri) + '/edit');
    }

    _addConfig () {
        goToPage('models/configure/' + getURL(this._selectedModel, this._selectedVersion, this._selectedConfig) + '/new');
    }

    private _lastSelectorTimeout : any = null;
    _updateConfigSelector () {
        let configSelectorWl : Select = this.shadowRoot!.getElementById('config-selector') as Select;
        let configSelector : HTMLSelectElement | null = configSelectorWl? configSelectorWl.getElementsByTagName('select')[0] : null;
        if (configSelectorWl && configSelector) {
            if (this._lastSelectorTimeout != null) clearTimeout(this._lastSelectorTimeout);
            console.log('Updating Config Selector');
            this._shouldUpdateConfigs = false;
            while (configSelector.options.length > 0)
                configSelector.remove(configSelector.options.length - 1);

            let newOption = document.createElement('option');
            newOption.text = 'No configuration'
            newOption.value = "";
            configSelector.add(newOption, null);

            this._model.hasVersion
                    .map((ver:SoftwareVersion) => this._versions[ver.id] ? this._versions[ver.id] : ver)
                    .forEach((ver:SoftwareVersion) => {
                let newOption = document.createElement('option');
                newOption.text = getLabel(ver);
                newOption.value = ver.id;
                newOption.disabled = true;
                configSelector.add(newOption, null);

                if (ver.hasConfiguration) {
                    ver.hasConfiguration
                            .map((cfg:ModelConfiguration) => this._configs[cfg.id] ? this._configs[cfg.id] : cfg)
                            .forEach((cfg:ModelConfiguration) => {
                        let newOption = document.createElement('option');
                        newOption.text = '\xA0\xA0' + getLabel(cfg);
                        newOption.value = cfg.id;
                        configSelector.add(newOption, null);
                    });
                }
            });

            configSelector.value = this._selectedConfig;
            configSelector.setAttribute("style", "padding-right: 38px;");
            // FIX ARROW
            let arrowEl = configSelectorWl.shadowRoot.getElementById('arrow');
            if (arrowEl) arrowEl.style.pointerEvents = "none";
            (<any>configSelectorWl).refreshAttributes();
        } else {
            //when everything is loaded, this can be execubed before the selectors render...
            if (this._lastSelectorTimeout == null) {
                let me = this;
                this._lastSelectorTimeout = setTimeout(() => {
                    me._lastSelectorTimeout = null;
                    me._updateConfigSelector();
                }, 250);
            }
        }
    }

    _clearVariables () {
        /* This does not work 
        let wls = this.shadowRoot.querySelectorAll('wl-expansion');
        wls.forEach((exp) => exp.checked = false); */
        if (this._tab === "variables") {
            this._tab = "overview";
        }
    }

    _onConfigChange () {
        let configSelectorWl : Select = this.shadowRoot!.getElementById('config-selector') as Select;
        let configSelector : HTMLSelectElement | null = configSelectorWl? configSelectorWl.getElementsByTagName('select')[0] : null;
        if (configSelectorWl && configSelector) {
            this._clearVariables();
            let cfgURL : string = configSelector.value;
            let ver = Object.values(this._versions).filter((ver:SoftwareVersion) =>
                (ver.hasConfiguration||[]).some((cfg:ModelConfiguration) => cfg.id === cfgURL)
            ).pop();
            goToPage(this.PREFIX + getURL(this._model, ver, cfgURL));
        }
    }

    _updateSetupSelector () {
        let setupSelectorWl : Select = this.shadowRoot!.getElementById('setup-selector') as Select;
        let setupSelector : HTMLSelectElement | null = setupSelectorWl? setupSelectorWl.getElementsByTagName('select')[0] : null;
        if (setupSelectorWl && setupSelector && this._config) {
            //console.log('Updating Setup Selector', this._config);
            this._shouldUpdateSetups = false;
            while (setupSelector.options.length > 0) 
                setupSelector.remove(setupSelector.options.length - 1);

            let unselect = document.createElement('option');
            unselect.text = '\xA0\xA0No setup selected'
            unselect.value = '';
            setupSelector.add(unselect, null);
            (this._config.hasSetup || [])
                    .map((setup:ModelConfigurationSetup) => this._setups[setup.id] ? this._setups[setup.id] : setup)
                    .filter((setup:ModelConfigurationSetup) => setupInRegion(setup, this._region.model_catalog_uri, this._regions))
                    .forEach((setup:ModelConfigurationSetup) => {
                let newOption = document.createElement('option');
                newOption.text = '\xA0\xA0' + getLabel(setup);
                newOption.value = setup.id;
                setupSelector.add(newOption, null);
            })
            setupSelector.value = this._selectedSetup;
            setupSelector.setAttribute("style", "padding-right: 38px;");
            // FIX ARROW
            let arrowEl = setupSelectorWl.shadowRoot.getElementById('arrow');
            if (arrowEl) {
                arrowEl.style.pointerEvents = "none";
            }
            (<any>setupSelectorWl).refreshAttributes();
        }
    }

    _onSetupChange () {
        let setupSelectorWl : Select = this.shadowRoot!.getElementById('setup-selector') as Select;
        let setupSelector : HTMLSelectElement | null = setupSelectorWl? setupSelectorWl.getElementsByTagName('select')[0] : null;
        if (setupSelectorWl && setupSelector) {
            this._clearVariables();
            let setupURL : string = setupSelector.value;
            goToPage(this.PREFIX + getURL(this._model, this._version, this._config, setupURL));
        }
    }

    _renderSelectors () {
        if (!this._model.hasVersion) {
            return html`<div class="info-center">- No version available -</div>`;
        }
        let hasVersions = (this._model.hasVersion.length > 0);
        return html`
            <div class="config-selector">
                ${this._selectedConfig ? html`
                <a class="no-decoration" style="text-align: center;" target="_blank" href="${this._selectedConfig}">
                    <wl-button flat inverted>
                        <span class="rdf-icon">
                    </wl-button>
                </a>`
                : html `
                <span>
                    <wl-button flat inverted disabled>
                        <span class="rdf-icon" disabled>
                    </wl-button>
                </span>
                `}
                <span>
                    <wl-select label=${this._selectedConfig ? "Selected configuration" : "Select a configuration"} id="config-selector" @input="${this._onConfigChange}">
                    </wl-select>
                </span>
                <span>
                    <wl-button flat inverted @click="${() => this._goToEdit(this._selectedConfig)}" ?disabled="${!this._selectedConfig}">
                        <wl-icon>edit</wl-icon>
                        <span style="font-size: 11px; font-weight: bold;">
                            Edit<br/>Configuration
                        </span>
                    </wl-button>
                    <span class="tooltip small-tooltip" tip="Download and Run">
                        <wl-button flat inverted @click=${() => this._openCLIDialog(this._selectedConfig)} ?disabled="${!isExecutable(this._config)}">
                            <wl-icon>get_app</wl-icon>
                        </wl-button>
                    </span>
                    <span tip="A model configuration is a unique way of running a model, exposing concrete inputs and outputs" 
                         class="tooltip config-tooltip" style="top: 4px;">
                        <wl-icon style="--icon-size: 24px;">help_outline</wl-icon>
                    </span>
                </span>
            </div>

            <div class="setup-selector 
                ${this._selectedConfig && this._config && this._config.hasSetup && this._config.hasSetup.length > 0? '' : 'hidden'}">
                ${this._selectedSetup ? html`
                    <a class="no-decoration" style="text-align: center;" target="_blank" href="${this._selectedSetup}">
                        <wl-button flat inverted>
                            <span class="rdf-icon">
                        </wl-button>
                    </a>`
                    : html`
                    <span>
                        <wl-button flat inverted disabled>
                            <span class="rdf-icon" disabled>
                        </wl-button>
                    </span>`
                }
                <span>
                    <wl-select label=${this._selectedSetup ? "Selected configuration setup" :"Select a configuration setup"} id="setup-selector" @input="${this._onSetupChange}">
                    </wl-select>
                </span>
                <span>
                    <wl-button flat inverted @click="${() => this._goToEdit(this._selectedConfig, this._selectedSetup)}" ?disabled="${!this._selectedSetup}">
                        <wl-icon>edit</wl-icon>
                        <span style="font-size: 11px; font-weight: bold;">
                            Edit<br/>Setup
                        </span>
                    </wl-button>
                    <span class="tooltip small-tooltip" tip="Download and Run">
                        <wl-button flat inverted @click=${() => this._openCLIDialog(this._selectedSetup)} ?disabled="${!isExecutable(this._setup)}">
                            <wl-icon>get_app</wl-icon>
                        </wl-button>
                    </span>
                    <span tip="A model configuration setup represents a model with parameters that have been adjusted (manually or automatically) to be run in a specific region" 
                         class="tooltip config-tooltip" style="top: 4px;">
                        <wl-icon style="--icon-size: 24px;">help_outline</wl-icon>
                    </span>
                </span>
            </div>
            <div class="info-center ${hasVersions? 'hidden' : ''}">- No version available -</div>
            <div class="info-center ${this._config && (!this._config.hasSetup || this._config.hasSetup.length === 0) ? '': 'hidden'}"
                >- No configuration setup available <a class="clickable" @click="${this._addConfig}">add one</a> -</div>
        `
    }

    protected render() {
        if (this._loading[this._selectedModel])
            return html`<div class="text-centered"><wl-progress-spinner></wl-progress-spinner></div>`

        if (!this._model)
            return html`NO MODEL`;

        let modelType : string[] = this._model.type ? getModelTypeNames(this._model.type) : [];

        return html`
            ${this._renderCLIDialog()}
            <div class="col-title">
                <wl-title level="2">
                    <a class="no-decoration" style="" target="_blank" href="${this._selectedModel}">
                        <wl-button flat inverted>
                            <span class="rdf-icon">
                        </wl-button>
                    </a>
                    <span>${getLabel(this._model)}</span>
                    <wl-button style="--button-font-size: 16px; --button-padding: 8px; float: right;" flat inverted 
                            @click="${() => this._editModel()}">
                        <wl-icon>edit</wl-icon>
                        <span style="font-size: 11px;">
                            Edit<br/>Model
                        </span>
                    </wl-button>
                </wl-title>
            </div>

            ${this._renderSelectors()}
            ${this._setupNotFound ? html`
            <p style="text-align: center; color:red;">
                The setup ${this._selectedSetup ? this._selectedSetup.split('/').pop() : 'selected'} is private or was deleted 
            </p>` : ''}

            <wl-divider style="margin: .5em 0;"></wl-divider>

            <div class="wrapper">
                <div class="col-img text-centered">
                    ${this._model.logo && this._model.logo.length > 0 ? (
                        this._loading[this._model.logo[0].id] ?
                            html`<wl-progress-spinner></wl-progress-spinner>`
                            : (this._logo.value ?
                                html`<img src="${this._logo.value[0]}"/>`
                                : 'Logo has no value'
                            )
                    ): 'No logo'}
                    ${this._model.dateCreated ?
                      html`<div><b>Creation date:</b> ${this._model.dateCreated[0].toString().replace(/T.*$/,'')}</div>`
                      :''}
                    ${this._model.hasModelCategory ?
                      html`<div><b>Category:</b> ${this._model.hasModelCategory.map(getLabel).join(', ')}</div>`
                      :''}
                    ${modelType.length > 0 ? html`<div><b>Model type:</b> ${modelType.join(', ')}</div>`:''}
                </div>
                <div class="col-desc">
                    <wl-text style="text-align: justify;">${this._model.description}</wl-text>
                    ${this._emulators[this._selectedModel] ?  html`
                    <div style="margin-top: 4px;">
                        You can see execution results for this model on
                        <a href="${'/'+this._regionid+this._emulators[this._selectedModel]}">the emulators page</a>.
                    </div>` 
                    : ''}
                    <div class="desc-ext">
                        ${this._model.author?
                          html`<wl-text><b>• Authors:</b> ${this._renderAuthors(this._model.author)}</wl-text>` 
                          :''}
                        ${this._model.hasFunding?
                          html`<wl-text><b>• Funding:</b> ${this._renderFundings(this._model.hasFunding)}</wl-text>` :''}

                        ${this._model.publisher?
                          html`<wl-text><b>• Publisher:</b> 
                            ${ this._model.publisher.map((publisher:Organization) => html`
                            <span class="resource organization">
                                ${getLabel(publisher)}
                            </span>
                            `)}
                        </wl-text>` :''}
                        ${this._model.datePublished?
                          html`<wl-text><b>• Publication date:</b> ${ this._model.datePublished }</wl-text>`
                          :''}
                        ${this._model.citation && this._model.citation.length > 0 ?
                          html`<wl-text><b>• Preferred citation:</b> <i>${ urlify(this._model.citation[0]) }<i></wl-text>` 
                          :''}
                        ${this._model.hasDocumentation?
                          html`<wl-text>
                            <b>• Documentation:</b>
                            <a target="_blank" href="${this._model.hasDocumentation[0]}">
                                ${this._model.hasDocumentation[0]}
                            </a>
                        </wl-text>` :''}
                        ${!this._modelRegions || this._modelRegions.length > 0 ? html`<wl-text><b>• Regions:</b>
                            ${!this._modelRegions ? 
                                html`<loading-dots style="--width: 20px"></loading-dots>` 
                                : this._modelRegions.map((rid:string) => this._regions[rid]).map((region:Region) =>
                                html`<span class="resource region">${getLabel(region)}
                                </span>`)}
                        </wl-text>` :''}

                        ${this._model.hasProcess && this._model.hasProcess.length > 0 ? html`<wl-text><b>• Processes:</b>
                            ${this._renderProcesses(this._model.hasProcess)}
                        </wl-text>` :''}

                        ${this._model.keywords? html`<wl-text><b>• Keywords:</b>
                            ${ this._model.keywords.map((kws:string) => kws.split(/ *; */).map(capitalizeFirstLetter).join(', ') ).join(', ') }
                        </wl-text>` :''}
                    </div>
                </div>

                <div class="row-tab-header">
                    <wl-tab-group>
                        <wl-tab id="tab-overview" ?checked=${this._tab=='overview'} @click="${() => this._goToTab('overview')}"
                            >Overview</wl-tab>
                        <wl-tab id="tab-io" ?checked=${this._tab=='io'} @click="${() => this._goToTab('io')}"
                            >Inputs and Outputs</wl-tab>
                        <wl-tab id="tab-variable" ?checked=${this._tab=='variables'} @click="${() => this._goToTab('variables')}"
                            >Variables</wl-tab>
                        ${this._getExample() ? html`
                        <wl-tab id="tab-example" @click="${() => this._goToTab('example')}">
                            Example
                        </wl-tab>` : ''}
                        <wl-tab id="tab-overview" ?checked=${this._tab=='tech'} @click="${() => this._goToTab('tech')}"
                            >Technical Information</wl-tab>
                    </wl-tab-group>
                </div>
                <div class="row-tab-content">
                    ${(this._tab === 'overview') ? this._renderTabOverview() : ''}
                    ${(this._tab === 'tech') ? this._renderTabTechnical() : ''}
                    ${(this._tab === 'io') ? this._renderTabIO() : ''}
                    ${(this._tab === 'variables') ? this._renderTabVariables() : ''}
                    ${(this._tab === 'example') ? this._renderTabExample() : ''}
                </div>
            </div>
            ${this._renderCLIDialog()} 
            <div style="height: 50px;"></div>`
    }

    private _goToTab (tabid:tabType) {
        //console.log('GoToTab:', tabid);
        this._tab = tabid;
        if (tabid === 'tech') {
            let db = (store.getState() as RootState).modelCatalog;
            this._loadSourceCodes(this._model.hasSourceCode, db);
            if (this._config) {
                this._loadSourceCodes(this._config.hasSourceCode, db);
                this._loadSoftwareImages(this._config.hasSoftwareImage, db);
            }
        } 
        if (tabid === 'io' && this._config) {
            let db = (store.getState() as RootState).modelCatalog;
            this._loadParameters(this._config.hasParameter, db);
            this._loadDatasetSpecifications(this._config.hasInput, db);
            this._loadDatasetSpecifications(this._config.hasOutput, db);
        }
        if (tabid === 'variables' && this._config) {
            let db = (store.getState() as RootState).modelCatalog;
            this._loadDatasetSpecifications(this._config.hasInput, db);
            this._loadDatasetSpecifications(this._config.hasOutput, db);
        }
    }

    private _renderTabTechnical () {
        return html`
            <wl-title level="3"> Technical Information: </wl-title>
            ${this._model ? this._renderTableTechnical(this._model as ModelConfiguration, "MODEL") : ''}
            <br/>
            ${this._config ? this._renderTableTechnical(this._config, "CONFIGURATION") : ''}
            <br/>
            ${this._selectedSetup && this._loading[this._selectedSetup] ? html`
                <div class="text-centered"><wl-progress-spinner></wl-progress-spinner></div>
            ` : ''}
            ${this._setup ? this._renderTableTechnical(this._setup, "SETUP") : ''}
        `
    }

    private _renderTableTechnical (resource:ModelConfiguration|ModelConfigurationSetup, titlePrefix:string) {
        //Do no show when the model does not have any technical property
        if (!resource.hasSoftwareImage && !resource.operatingSystems && !resource.memoryRequirements && 
            !resource.processorRequirements && !resource.softwareRequirements && !resource.hasDownloadURL &&
            !resource.hasInstallationInstructions && !resource.hasComponentLocation && !resource.hasSourceCode &&
            !resource.parameterization && !resource.runtimeEstimation && !resource.limitations) {
            return html``;
        }
        
        let instructionsIsUrl : boolean = resource.hasInstallationInstructions &&
                                          resource.hasInstallationInstructions.length > 0 &&
                                          resource.hasInstallationInstructions[0].substring(0,4) === 'http';


        return html`
            <table class="pure-table pure-table-striped">
                <thead>
                    <tr><th colspan="2">${titlePrefix}: 
                        <span style="margin-left: 6px; font-size: 16px; font-weight: bold; color: black;">
                            ${getLabel(resource)}
                        </span>
                    </th></tr>
                </thead>
                <tbody>
                ${resource.hasSoftwareImage && resource.hasSoftwareImage.length > 0 ? html`
                    <tr>
                        <td><b>Software image:</b></td>
                        <td>${this._loading[resource.hasSoftwareImage[0].id] ? 
                            html`${resource.hasSoftwareImage[0].id} <loading-dots style="--width: 20px"></loading-dots>`
                            : html`<a target="_blank"
        href="https://hub.docker.com/r/${getLabel(this._softwareImages[resource.hasSoftwareImage[0].id]).split(':')[0]}/tags">
                                <span class="resource software-image">
                                    ${getLabel(this._softwareImages[resource.hasSoftwareImage[0].id])}
                                </span>
                            </a>`
                        }
                        </td>
                    </tr>`: ''}
                ${resource.operatingSystems && resource.operatingSystems.length > 0 ? html`
                    <tr>
                        <td><b>Operating systems:</b></td>
                        <td>${resource.operatingSystems[0].split(';').join(', ')}</td>
                    </tr>` : ''}
                ${resource.memoryRequirements && resource.memoryRequirements.length > 0 ? html`
                    <tr>
                        <td><b>Memory requirements:</b></td>
                        <td>${resource.memoryRequirements[0]}</td>
                    </tr>`: ''}
                ${resource.processorRequirements && resource.processorRequirements.length > 0 ? html`
                    <tr>
                        <td><b>Processor requirements:</b></td>
                        <td>${resource.processorRequirements[0]}</td>
                    </tr>`: ''}
                ${resource.softwareRequirements && resource.softwareRequirements.length > 0 ? html`
                    <tr>
                        <td><b>Software requirements:</b></td>
                        <td>${resource.softwareRequirements[0]}</td>
                    </tr>`: ''}

                ${resource.parameterization && resource.parameterization.length > 0 ? html`
                    <tr>
                        <td><b>Parameterization:</b></td>
                        <td>${resource.parameterization[0]}</td>
                    </tr>`: ''}
                ${resource.limitations && resource.limitations.length > 0 ? html`
                    <tr>
                        <td><b>Limitations:</b></td>
                        <td>${resource.limitations[0]}</td>
                    </tr>`: ''}
                ${resource.runtimeEstimation && resource.runtimeEstimation.length > 0 ? html`
                    <tr>
                        <td><b>Runtime Estimation:</b></td>
                        <td>${resource.runtimeEstimation[0]}</td>
                    </tr>`: ''}

                ${resource.hasDownloadURL && resource.hasDownloadURL.length > 0 ? html`
                    <tr>
                        <td><b>Download:</b></td>
                        <td><a target="_blank" href="${resource.hasDownloadURL[0]}">${resource.hasDownloadURL[0]}</a></td>
                    </tr>`: ''}
                ${resource.hasInstallationInstructions && resource.hasInstallationInstructions.length > 0 ? html`
                    <tr>
                        <td><b>Installation instructions:</b></td>
                        <td>
                        ${instructionsIsUrl ? html`
                            <a target="_blank" href="${resource.hasInstallationInstructions[0]}">${resource.hasInstallationInstructions[0]}</a>
                        ` : html`
                            <span>${resource.hasInstallationInstructions[0]}</span>
                        `}
                        </td>
                    </tr>`: ''}
                ${resource.hasComponentLocation && resource.hasComponentLocation.length > 0 ? html`
                    <tr>
                        <td><b>Component location:</b></td>
                        <td><a target="_blank" href="${resource.hasComponentLocation[0]}">${resource.hasComponentLocation[0]}</a></td>
                    </tr>`: ''}

                ${resource.hasSourceCode && resource.hasSourceCode.length > 0 ? html`
                    <tr>
                        <td><b>Source code:</b></td>
                        <td>${this._loading[resource.hasSourceCode[0].id] ? 
                            html`${resource.hasSourceCode[0].id} <loading-dots style="--width: 20px"></loading-dots>`
                            : (this._sourceCodes[resource.hasSourceCode[0].id].codeRepository ? 
                                html`<a target="_blank" href="${this._sourceCodes[resource.hasSourceCode[0].id].codeRepository}">
                                    ${getLabel(this._sourceCodes[resource.hasSourceCode[0].id])}
                                </a>` : html`
                                <span>${getLabel(this._sourceCodes[resource.hasSourceCode[0].id])}</span>
                            `)
                        }</td>
                    </tr>
                    ${!this._loading[resource.hasSourceCode[0].id] &&
                       this._sourceCodes[resource.hasSourceCode[0].id].programmingLanguage ? html`
                    <tr>
                        <td><b>Programing languages:</b></td>
                        <td>${this._sourceCodes[resource.hasSourceCode[0].id].programmingLanguage}</td>
                    </tr>` : ''}
                    ${!this._loading[resource.hasSourceCode[0].id] &&
                       this._sourceCodes[resource.hasSourceCode[0].id].license ? html`
                    <tr>
                        <td><b>License:</b></td>
                        <td>${this._sourceCodes[resource.hasSourceCode[0].id].license}</td>
                    </tr>` : ''}
                `: ''}

                ${titlePrefix == 'CONFIGURATION' || titlePrefix == 'SETUP' ? html`
                    <tr>
                        <td><b>DAME command:</b></td>
                        <td>
                            <div class="monospaced">
                                <div>
                                    <span style="color: darkgray;">$</span> dame run 
                                    ${titlePrefix == 'CONFIGURATION' ?
                                        uriToId(this._selectedConfig) : uriToId(this._selectedSetup) }
                                </div>
                            </div>
                        </td>
                    </tr>`: ''}
                </tbody>
            </table>`;
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

    /*_expandVariable (varLabel:string) {
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
    }*/

    _renderTabOverview () {
        return html`
            ${this._model.hasPurpose && this._model.hasPurpose.length > 0 ? html`
            <wl-title level="2" style="font-size: 16px;">Model purpose:</wl-title>
            <ul style="margin-top: 5px">
                ${this._model.hasPurpose.map((p:string) => html`<li>${capitalizeFirstLetter(p)}.</li>`)}
            </ul>`:''}

            ${this._model.usefulForCalculatingIndex && this._model.usefulForCalculatingIndex.length > 0 ? html`
            <wl-title level="2" style="font-size: 16px;">Relevant for calculating index:</wl-title>
            <ul style="margin-top: 5px">
                ${this._model.usefulForCalculatingIndex.map((index:any) => html`
                <li>
                    <a target="_blank" href="${index.id}">
                        ${getLabel(index)}
                    </a>
                </li>
                `)}
            </ul>` :''}

            ${this._model.theoreticalBasis && this._model.theoreticalBasis.length > 0 ? html`
            <wl-title level="2" style="font-size: 16px; display: inline-block; margin-right: 4px;">Theoretical Basis:</wl-title>
            <span> ${this._model.theoreticalBasis[0]} </span>`:''}

            ${this._model.hasAssumption && this._model.hasAssumption.length > 0 ? html`
            <wl-title level="2" style="font-size: 16px;">Assumptions:</wl-title>
            <ul style="margin-top: 5px">
                ${this._model.hasAssumption.map((a:string) => a.split('.').filter((txt:string) => !!txt).map((txt:string) => 
                html`<li>${txt}.</li>`
                ))}
            </ul>`
            :''}

            ${this._config ? this._renderConfigResume() : ''}
            ${this._renderRelatedModels()}
            ${this._renderGallery()}`
    }

    _renderConfigResume () {
        return html`
            <fieldset style="border-radius: 5px; padding: 0px 7px; border: 2px solid #D9D9D9; margin-bottom: 8px;">
                <legend style="font-weight: bold; font-size: 12px; color: gray;">Selected configuration</legend>
                <div class="metadata-top-buttons">
                    <div class="button-preview" @click=${() => this._changeTab('io')}>
                        <div>Parameters</div>
                        <div>${this._config.hasParameter ? this._config.hasParameter.length : 0}</div>
                    </div>
                    <div class="button-preview" @click=${() => this._changeTab('io')}>
                        <div>Input files</div>
                        <div>${this._config.hasInput ? this._config.hasInput.length : 0}</div>
                    </div>
                    <div class="button-preview" @click=${() => this._changeTab('io')}>
                        <div>Output files</div>
                        <div>${this._config.hasOutput ? this._config.hasOutput.length : 0}</div>
                    </div>
                </div>

                <wl-title level="2" style="font-size: 16px;">${this._config.label}</wl-title>
                <wl-text>${this._config.description}</wl-text>
                ${this._config.hasUsageNotes && this._config.hasUsageNotes.length > 0 ? html`
                    <br/>
                    <wl-text>
                        <b>Usage notes:</b>
                        ${this._config.hasUsageNotes[0]}
                    </wl-text>
                ` : ''}
                <div class="desc-ext" style="padding:10px;">
                    ${this._config.author && this._config.author.length > 0 ? html`
                        <wl-text>
                            <b>• Configuration creator:</b>
                            ${this._renderAuthors(this._config.author)}
                        </wl-text>
                    `: ''}

                    ${this._config.hasFunding && this._config.hasFunding.length > 0 ?
                        html`<wl-text><b>• Funding Source:</b> ${this._renderFundings(this._config.hasFunding)}</wl-text>` :''}
                    ${this._config.hasRegion && this._config.hasRegion.length > 0 ? 
                        html`<wl-text><b>• Regions:</b> ${this._config.hasRegion.map((region:Region) => this._loadingRegions ? 
                            html`${getId(region)} <loading-dots style="--width: 20px"></loading-dots>`
                            : html`<span class="resource region">${getLabel(region)}</span>`
                        )}</wl-text>` :''}
                    ${this._config.hasOutputTimeInterval && this._config.hasOutputTimeInterval.length > 0 ?
                        html`<wl-text style="display: flex; align-items: center; padding: 1px 0px;">
                            <b>• Time interval:</b> ${this._renderTimeInterval(this._config.hasOutputTimeInterval[0])}
                        </wl-text>` :''}
                    ${this._config.hasGrid && this._config.hasGrid.length > 0 ?
                        html`<wl-text style="display: flex; align-items: center; padding: 1px 0px;">
                            <b>• Grid:</b> ${this._renderGrid(this._config.hasGrid[0])}</wl-text>` :''}
                    ${this._config.hasProcess && this._config.hasProcess.length > 0 ?
                        html`<wl-text><b>• Processes:</b> ${this._renderProcesses(this._config.hasProcess)}</wl-text>` :''}
                </div>
                ${this._selectedSetup && !this._setupNotFound?
                    this._loading[this._selectedSetup] ? 
                        html`<div class="text-centered"><wl-progress-spinner></wl-progress-spinner></div>`
                        : (this._setup ? this._renderSetupResume() : '')
                : ''}
            </fieldset>
        `
    }

    _renderSetupResume () {
        //console.log('here', this._setup);
        let paramLen : number = this._setup.hasParameter ? this._setup.hasParameter.length : 0;
        let inputLen : number = this._setup.hasInput ? this._setup.hasInput.length : 0;
        let paramFixed : number = (this._setup.hasParameter || []).filter((p:Parameter) => !!p.hasFixedValue).length;
        let inputFixed : number = (this._setup.hasInput || []).filter((i:DatasetSpecification) => !!i.hasFixedResource).length;
        let configProcesses : string[] = (this._config.hasProcess || []).map((p:Process) => p.id);
        let setupProcesses : Process[] = (this._setup.hasProcess || []).filter((p:Process) => !configProcesses.includes(p.id));
        return html`
            <fieldset style="border-radius: 5px; padding: 0px 7px; border: 2px solid #D9D9D9; margin-bottom: 8px;">
                <legend style="font-weight: bold; font-size: 12px; color: gray;">Selected setup</legend>
                <div class="metadata-top-buttons">
                    <div class="button-preview" @click=${() => this._changeTab('io')}>
                        <div>Parameters</div>
                        <div>
                            <span class="tooltip nm io-tooltip" style="text-align: center;"
                                tip="${paramFixed} parameters have been pre-selected in this setup">
                            ${ (paramLen - paramFixed) + '/' + paramLen }
                            </span>
                        </div>
                    </div>
                    <div class="button-preview" @click=${() => this._changeTab('io')}>
                        <div>Input files</div>
                        <div>
                            <span class="tooltip nm io-tooltip" style="text-align: center;"
                                tip="${inputFixed} inputs have been pre-selected in this setup">
                            ${ (inputLen - inputFixed) + '/' + inputLen }
                            </span>
                        </div>
                    </div>
                </div>

                <wl-title level="2" style="font-size: 16px;">${this._setup.label}</wl-title>
                <wl-text>${this._setup.description}</wl-text>
                ${this._setup.hasUsageNotes && this._setup.hasUsageNotes.length > 0 ? html`
                    <br/>
                    <wl-text>
                        <b>Usage notes:</b>
                        ${this._setup.hasUsageNotes[0]}
                    </wl-text>
                ` : ''}
                <div class="desc-ext" style="padding:10px;">
                    ${this._setup.parameterAssignmentMethod && this._setup.parameterAssignmentMethod.length > 0 ? 
                        html`<wl-text>
                            <b>• Parameter assignment method:</b> ${this._setup.parameterAssignmentMethod[0]}
                        </wl-text>`
                    :''}
                    ${this._setup.author && this._setup.author.length > 0 ? html`
                        <wl-text>
                            <b>• Setup creator:</b>
                            ${this._renderAuthors(this._setup.author)}
                        </wl-text>
                    `: ''}

                    ${this._setup.hasFunding && this._setup.hasFunding.length > 0 ?
                        html`<wl-text><b>• Funding Source:</b> ${this._renderFundings(this._setup.hasFunding)}</wl-text>` :''}
                    ${this._setup.hasRegion && this._setup.hasRegion.length > 0 ? 
                        html`<wl-text><b>• Regions:</b> ${this._setup.hasRegion.map((region:Region) => this._loadingRegions ? 
                            html`${getId(region)} <loading-dots style="--width: 20px"></loading-dots>`
                            : html`<span class="resource region">${getLabel(region)}</span>`
                        )}</wl-text>` :''}
                    ${this._setup.hasOutputTimeInterval && this._setup.hasOutputTimeInterval.length > 0 && 
                      (!this._config.hasOutputTimeInterval || this._config.hasOutputTimeInterval.length == 0 || 
                       this._config.hasOutputTimeInterval[0].id != this._setup.hasOutputTimeInterval[0].id)?
                        html`<wl-text display: flex; align-items: center; padding: 1px 0px;>
                            <b>• Time interval:</b> ${this._renderTimeInterval(this._setup.hasOutputTimeInterval[0])}
                        </wl-text>` :''}
                    ${this._setup.hasGrid && this._setup.hasGrid.length > 0 && (!this._config.hasGrid ||
                    this._config.hasGrid.length === 0 || this._config.hasGrid[0].id != this._setup.hasGrid[0].id)?
                        html`<wl-text style="display: flex; align-items: center; padding: 1px 0px;">
                            <b>• Grid:</b> ${this._renderGrid(this._setup.hasGrid[0])}</wl-text>` :''}
                    ${setupProcesses.length > 0 ?
                        html`<wl-text><b>• Processes:</b> ${this._renderProcesses(setupProcesses)}</wl-text>` :''}
                    ${this._setup.adjustableParameter && this._setup.adjustableParameter.length > 0 ? 
                        html`<wl-text><b>• Adjustable parameters:</b> ${
                            this._setup.adjustableParameter.map((p:Parameter, i:number) => (i === 0) ?
                                html`<code class="clickable" @click="${() => this._changeTab('io','parameters')}">
                                    ${getLabel(p)}
                                </code>`
                                : html`, <code class="clickable" @click="${() => this._changeTab('io','parameters')}">
                                    ${getLabel(p)}
                                </code>`)
                        }` :''}
                    ${this._setup.calibrationTargetVariable && this._setup.calibrationTargetVariable.length > 0 ? 
                        html`<wl-text><b>• Target variables:</b> ${
                            this._setup.calibrationTargetVariable.map((v:VariablePresentation, i:number) => (i === 0) ?
                                html`<code>${getLabel(v)}</code>`
                                : html`, <code>${getLabel(v)}</code>`)
                        }` :''}
                </div>
            </fieldset>
        `
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
            <wl-title level="3"> Inputs: </wl-title> 
            <wl-title level="4"> Parameters: </wl-title> 
            ${this._renderParametersTable(this._setup ? this._setup : this._config)}
            <wl-title level="4"> Files: </wl-title> 
            ${this._renderInputFileTable(this._setup ? this._setup : this._config)}
            <wl-title level="3"> Output Files: </wl-title> 
            ${this._renderOutputFileTable(this._setup ? this._setup : this._config)}
            <wl-text style="font-style: italic; padding-left: 20px; margin-top: 1em;">
                Look at the Variables tab to see more information about the contents of the inputs and outputs.
            </wl-text>
        `
    }

    private _renderInputFileTable (resource:ModelConfiguration|ModelConfigurationSetup) {
        let isSetup = resource.type.includes('ModelConfigurationSetup');
        return html`
            <table class="pure-table pure-table-striped" style="overflow: visible;">
                <colgroup>
                    <col span="1" style="width: 20%;">
                    <col span="1">
                    ${isSetup? html`<col span="1">` : ''}
                    <col span="1" style="max-width: 140px;">
                </colgroup>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Description</th>
                        ${isSetup? html`
                        <th style="text-align: right;">
                            Value on setup
                            <span class="tooltip table-tooltip" tip="If a value is not set up in this field, the configuration default value will be used.">
                                <wl-icon>help</wl-icon>
                            </span>
                        </th>` : html``}
                        <th style="text-align: right;">Format</th>
                    </tr>
                </thead>
                <tbody>

                ${!resource.hasInput || resource.hasInput.length === 0 ?  html`
                    <tr>
                        <td colspan="4">
                            <div class="text-centered">This ${isSetup? 'setup' : 'configuration'} has no input files.</div>
                        </td>
                    </tr>` : html`
                    ${resource.hasInput
                            .filter((ds:DatasetSpecification) => !this._loading[ds.id])
                            .map((ds:DatasetSpecification) => this._datasetSpecifications[ds.id])
                            .sort(sortByPosition)
                            .map((ds:DatasetSpecification) => html`
                    <tr>
                        <td><span class="monospaced">${getLabel(ds)}</span></td>
                        <td>${ds.description && ds.description.length > 0 ? ds.description : ''}</td>
                        ${isSetup? html`
                        <td style="text-align: right;">
                            ${this._renderFixedResource(ds)}
                        </td>` : ''}
                        <td style="text-align: right;" class="number">
                            ${ds.hasFormat && ds.hasFormat.length > 0 ? ds.hasFormat[0] : ''}
                        </td>
                    </tr>
                    `)}
                    ${resource.hasInput.filter((ds:DatasetSpecification) => this._loading[ds.id]).map((ds:DatasetSpecification) => html`
                    <tr>
                        <td colspan="4">
                            <div class="text-centered">${getId(ds)} <loading-dots style="--height: 10px; margin-left:10px"></loading-dots></div>
                        </td>
                    </tr>
                    `)}`
                }
                </tbody>
            </table>`
    }

    _renderParametersTable (resource:ModelConfiguration|ModelConfigurationSetup) {
        let isSetup = resource.type.includes('ModelConfigurationSetup');
        return html`
            <table class="pure-table pure-table-striped" style="overflow: visible;" id="parameters-table">
                <col span="1" style="width: 20%;">
                <col span="1">
                <col span="1" style="width: 100px;">
                <col span="1" style="width: 130px;">
                <thead>
                    <tr style="vertical-align: middle;">
                        <th>Parameter</th>
                        <th>Description</th>
                        <th style="text-align: right;">
                            Relevant for intervention
                            <span style="display: inline-block;">/ Control<span>
                        </th>
                        <th style="text-align: right;">
                            ${isSetup? html`
                            Value on setup 
                            <span class="tooltip table-tooltip" tip="If a value is not set up in this field configuration default value will be used.">
                                <wl-icon>help</wl-icon>
                            </span>`
                            : 'Default value'}
                        </th>
                    </tr>
                </thead>
                <tbody>
                ${!resource.hasParameter || resource.hasParameter.length === 0 ?  html`
                    <tr>
                        <td colspan="4" style="vertical-align: middle;">
                            <div class="info-center">This ${isSetup? 'setup' : 'configuration'} has no input parameters.</div>
                        </td>
                    </tr>` : html`
                    ${resource.hasParameter.filter((p:Parameter) => !this._loading[p.id])
                            .map((p:Parameter) => this._parameters[p.id]).sort(sortByPosition).map((p:Parameter) => html`
                    <tr>
                        <td>
                            <code>${getLabel(p)}</code>
                            ${p.hasMinimumAcceptedValue && p.hasMinimumAcceptedValue.length > 0 ? html`
                                <br/>The range is from ${p.hasMinimumAcceptedValue[0]} 
                                    ${p.hasMaximumAcceptedValue && p.hasMaximumAcceptedValue.length > 0 ? 
                                    html`to ${p.hasMaximumAcceptedValue[0]}` :''}
                                `:''}
                        </td>
                        <td>
                            ${p.description && p.description.length > 0 ? html`
                                <b style="font-size: 14px;">${capitalizeFirstLetter(p.description[0])}</b>
                                `: ''}
                        </td>
                        <td>
                            ${p.relevantForIntervention && p.relevantForIntervention.length > 0 && p.relevantForIntervention[0].id ? html`
                                <span class="tooltip tooltip-text" tip="${this._loading[p.relevantForIntervention[0].id]?
                                        'loading...' : this._interventions[p.relevantForIntervention[0].id].description}">
                                <!--FIXME -->
                                    ${getLabel(p.relevantForIntervention[0])}
                                </span>
                                `: ''}
                        </td>
                        <td class="font-numbers" style="text-align: right;">
                            ${isSetup ? 
                                (p.hasFixedValue && p.hasFixedValue.length > 0 ? 
                                    p.hasFixedValue :
                                    p.hasDefaultValue + " (default)") 
                                : p.hasDefaultValue}
                            ${p.usesUnit && p.usesUnit.length > 0 ? getLabel(p.usesUnit[0]) : ''}
                        </td>
                    </tr>
                    `)}
                    ${resource.hasParameter.filter((p:Parameter) => this._loading[p.id]).map((p:Parameter) => html`
                    <tr>
                        <td colspan="4">
                            <div class="text-centered">${getId(p)} <loading-dots style="--height: 10px; margin-left:10px"></loading-dots></div>
                        </td>
                    </tr>
                    `)}`
                }
                </tbody>
            </table>`
    }

    private _renderOutputFileTable (resource:ModelConfiguration|ModelConfigurationSetup) {
        let isSetup = resource.type.includes('ModelConfigurationSetup');
        return html`
            <table class="pure-table pure-table-striped" style="overflow: visible;">
                <colgroup>
                    <col span="1" style="width: 20%;">
                    <col span="1">
                    ${isSetup? html`<col span="1">` : ''}
                    <col span="1" style="max-width: 140px;">
                </colgroup>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th colspan="${isSetup? 2 : 1}">Description</th>
                        <th style="text-align: right;">Format</th>
                    </tr>
                </thead>
                <tbody>
                ${!resource.hasOutput || resource.hasOutput.length === 0 ?  html`
                    <tr>
                        <td colspan="4">
                            <div class="text-centered">This ${isSetup? 'setup' : 'configuration'} has no output files.</div>
                        </td>
                    </tr>` : html`
                    ${resource.hasOutput.filter((ds:DatasetSpecification) => !this._loading[ds.id])
                            .map((ds:DatasetSpecification) => this._datasetSpecifications[ds.id])
                            .sort(sortByPosition).map((ds:DatasetSpecification) => html`
                    <tr>
                        <td><span class="monospaced">${getLabel(ds)}</span></td>
                        <td colspan="${isSetup? 2 : 1}">${ds.description && ds.description.length > 0 ? ds.description : ''}</td>
                        <td style="text-align: right;" class="number">
                            ${ds.hasFormat && ds.hasFormat.length > 0 ? ds.hasFormat[0] : ''}
                        </td>
                    </tr>`)}
                    ${resource.hasOutput.filter((ds:DatasetSpecification) => this._loading[ds.id]).map((ds:DatasetSpecification) => html`
                    <tr>
                        <td colspan="4">
                            <div class="text-centered">${getId(ds)} <loading-dots style="--height: 10px; margin-left:10px"></loading-dots></div>
                        </td>
                    </tr>
                    `)}`
                }
                </tbody>
            </table>`
    }

    private _renderFixedResource (ds: DatasetSpecification) {
        if (this._datasetSpecifications2[ds.id])
            ds = this._datasetSpecifications2[ds.id];
        return html`
            ${ds.hasFixedResource && ds.hasFixedResource.length > 0 &&
              ds.hasFixedResource[0].value && ds.hasFixedResource[0].value.length > 0 ? html`
                <a target="_blank" href="${ds.hasFixedResource[0].value[0]}">
                    ${(<unknown>ds.hasFixedResource[0].value[0] as string).split('/').pop()}
                    <!-- FIXME: The model catalog defines hasFixedResource as Object -->
                </a>
            `: html`<span style="color:#999999;">-</span>`}
        `;
    }

    private _renderTabExample () {
        return html`<div id="mk-example"></div>`
    }

    private _renderTabVariables () {
        let resource : ModelConfiguration | ModelConfigurationSetup = this._setup ? this._setup : this._config;
        return html`
            ${this._config ? html`
                <wl-title level="3">${this._setup ? 'Setup': 'Configuration'} variables:</wl-title>
                ${this._renderExpansionVariables(resource.hasInput, 'Inputs')}
                ${this._renderExpansionVariables(resource.hasOutput, 'Outputs')}
                ${((!resource.hasInput || resource.hasInput.length === 0) &&
                   (!resource.hasOutput || resource.hasOutput.length === 0)) ? html`
                <br/>
                <h3 style="margin-left:30px">
                    This information has not been specified in the ${this._setup ? 'setup': 'configuration'} yet.
                </h3>` : ''}
            ` : ''}

            ${this._model && (this._model.hasInputVariable || this._model.hasOutputVariable) ? html`
                <wl-title level="3" style="margin-top: 1em;"> Model variables:</wl-title>
                ${this._model.hasInputVariable && this._model.hasInputVariable.length > 0 ? html`
                <wl-title level="2" style="font-size: 16px;">Input Variables:</wl-title>
                ${this._renderVariablePresentationTable(this._model.hasInputVariable)}
                ` : ''}
                ${this._model.hasOutputVariable && this._model.hasOutputVariable.length > 0 ? html`
                <wl-title level="2" style="font-size: 16px;">Output Variables:</wl-title>
                ${this._renderVariablePresentationTable(this._model.hasOutputVariable)}
                ` : ''}
            ` : ''}
        `
    }

    private _renderExpansionVariables (dsArr: DatasetSpecification[], title: string) {
        if (!dsArr || dsArr.length === 0) return '';
        return html`
            <wl-title level="2" style="font-size: 16px;">${title}:</wl-title>
            ${dsArr.map((ds:DatasetSpecification) => html`
            <wl-expansion id="${getLabel(ds)}" name="${title}" @click="${() => this._expandDS(ds)}"
                    .disabled=${this._loading[ds.id]}
                    style="overflow-y: hidden;">
                <span slot="title" style="flex-grow: unset;">
                    ${this._loading[ds.id] ? 
                        getLabel(ds)
                        : getLabel(this._datasetSpecifications[ds.id])}
                </span>
                <span slot="description" style="overflow: hidden; text-overflow: ellipsis;">
                    ${this._loading[ds.id] ? 
                        html`<loading-dots style="--height: 10px; margin-left:10px"></loading-dots>`
                        : this._datasetSpecifications[ds.id].description}
                </span>
                ${this._loading[ds.id]? '' : html`
                <div style="font-style: oblique; margin-bottom: 1em; text-align: justify; font-size: 0.9em;">
                    ${this._datasetSpecifications[ds.id].description}
                </div>
                `}
                ${this._loading[ds.id] || (!this._loading[ds.id] && !this._loadedPresentations[ds.id])? 
                    html`<div class="text-centered"><wl-progress-spinner></wl-progress-spinner></div>`
                    : (!this._datasetSpecifications[ds.id].hasPresentation ||
                       this._datasetSpecifications[ds.id].hasPresentation.length === 0 ? html`
                        <div class="text-centered">
                            <h4>There is no description available for the variables in this file.</h4>
                        </div>`
                        : html`
                        <table class="pure-table pure-table-bordered">
                            <thead>
                                <th>Name</th>
                                <th>Long Name</th>
                                <th>Description</th>
                                <th>Standard Name</th>
                                <th>Units</th>
                            </thead>
                            <tbody>
                            ${this._datasetSpecifications[ds.id].hasPresentation
                                    .filter((vp:VariablePresentation) => !this._loading[vp.id])
                                    .map((vp:VariablePresentation) => this._variablePresentations[vp.id])
                                    .map((vp:VariablePresentation) => html`
                                <tr>
                                    <td>${getLabel(vp)}</td>
                                    <td>${vp.hasLongName}</td>
                                    <td>${vp.description}</td>
                                    <td style="word-wrap: break-word;">
                                    ${vp.hasStandardVariable && vp.hasStandardVariable.length > 0 ? html`
                                        <a class="monospaced link" target="_blank" href="${vp.hasStandardVariable[0].id}">
                                            ${getLabel(vp.hasStandardVariable[0])}
                                        </a>
                                    ` : '-'}
                                    </td>
                                    <td style="min-width: 80px;">
                                        ${vp.usesUnit && vp.usesUnit.length > 0 ? getLabel(vp.usesUnit[0]) : '-'}
                                    </td>
                                </tr>
                            `)}
                            ${this._datasetSpecifications[ds.id].hasPresentation
                                    .filter((vp:VariablePresentation) => this._loading[vp.id])
                                    .map((vp:VariablePresentation) => html`
                                <tr>
                                    <td colspan="5">
                                        <div class="text-centered">
                                            ${getId(vp)} <loading-dots style="--height: 10px; margin-left:10px"></loading-dots>
                                        </div>
                                    </td>
                                </tr>
                            `)}
                            </tbody>
                        </table>
                        `)
                }
            </wl-expansion>`)}
        `
    }

    private _renderVariablePresentationTable (vps:VariablePresentation[]) {
        return html`
            <table class="pure-table pure-table-bordered">
                <thead>
                    <th>Name</th>
                    <th>Long Name</th>
                    <th>Description</th>
                    <th>Standard Name</th>
                    <th>Units</th>
                </thead>
                <tbody>
                    ${vps.map((vp : VariablePresentation) => this._loading[vp.id] ? html`
                    <tr>
                        <td colspan="5">
                            <div class="text-centered">
                                ${getId(vp)} <loading-dots style="--height: 10px; margin-left:10px"></loading-dots>
                            </div>
                        </td>
                    </tr>
                    ` : html`
                    <tr>
                        <td>${getLabel(this._variablePresentations[vp.id])}</td>
                        <td>${this._variablePresentations[vp.id].hasLongName}</td>
                        <td>${this._variablePresentations[vp.id].description}</td>
                        <td style="word-wrap: break-word;">
                        ${this._variablePresentations[vp.id].hasStandardVariable && this._variablePresentations[vp.id].hasStandardVariable.length > 0 ? html`
                            <a class="monospaced link" target="_blank" href="${this._variablePresentations[vp.id].hasStandardVariable[0].id}">
                                ${getLabel(this._variablePresentations[vp.id].hasStandardVariable[0])}
                            </a>
                        ` : '-'}
                        </td>
                        <td style="min-width: 80px;">
                            ${this._variablePresentations[vp.id].usesUnit && 
                              this._variablePresentations[vp.id].usesUnit.length > 0 ?
                                getLabel(this._variablePresentations[vp.id].usesUnit[0]) : '-'}
                        </td>
                    </tr>
                    ` )}
                </tbody>
            </table>
        `;
    }

    private _closeAllExpansions () {
        let allExp = this.shadowRoot.querySelectorAll('wl-expansion');
        if (allExp && allExp.length > 0) {
            allExp.forEach(exp => exp["checked"] = false);
        }
    }

    private _expandDS (ds: DatasetSpecification) {
        if (!this._loading[ds.id]) {
            if (!this._loadedPresentations[ds.id]) {
                let db = (store.getState() as RootState).modelCatalog;
                this._loadedPresentations[ds.id] = true;
                let dataset = this._datasetSpecifications[ds.id];
                if (dataset.hasPresentation && dataset.hasPresentation.length > 0)
                    this._loadVariablePresentations(dataset.hasPresentation, db);
                else 
                    this.requestUpdate();
            }
        }
    }

    _renderRelatedModels () {
        //TODO
        return ''
    }

    _renderGallery () {
        let allImages : Set<string> = new Set();
        let allVisualizations : Set<string> = new Set();

        (this._model.hasExplanationDiagram || []).forEach((image:Image) => allImages.add(image.id));
        (this._model.screenshot || []).forEach((image:Image) => allImages.add(image.id));
        (this._model.hasSampleVisualization || []).forEach((viz:Visualization) => allVisualizations.add(viz.id));

        if (this._version) {
            (this._version.screenshot || []).forEach((image:Image) => allImages.add(image.id));
            (this._version.hasSampleVisualization || []).forEach((viz:Visualization) => allVisualizations.add(viz.id));
        }

        if (this._config) {
            (this._config.screenshot || []).forEach((image:Image) => allImages.add(image.id));
            (this._config.hasSampleVisualization || []).forEach((viz:Visualization) => allVisualizations.add(viz.id));
        }

        let allRes : (Image|Visualization)[] = Array.from(allImages)
                .filter((id:string) => !this._loading[id])
                .map((id:string) => this._images[id])
                .filter((img:Image) => img.label && img.label.length > 0 && img.value && img.value.length > 0)
                .concat(
                    Array.from(allVisualizations)
                            .filter((id:string) => !this._loading[id])
                            .map((id:string) => this._visualizations[id])
                            .filter((viz:Visualization) => viz.label && viz.label.length > 0 && viz.value && viz.value.length > 0)
                );
        let stillLoading : boolean = (allImages.size + allVisualizations.size) != allRes.length;

        let items : GalleryEntry[] = allRes.map((res:Image|Visualization) => {
            let item : GalleryEntry = {
                label: getLabel(res),
                desc: res.description && res.description.length > 0 ? res.description[0] : '',
                src: (<unknown>res.value[0]) as string
            };
            //FIXME: The model-catalog defines Image.value as object.
            if (res.hadPrimarySource && res.hadPrimarySource.length > 0 && res.hadPrimarySource[0]['id'])
                item.source = {
                    url: res.hadPrimarySource[0]['id'],
                    label: uriToId(res.hadPrimarySource[0]['id'])
                };
            return item;
        })

        if (items.length > 0) {
            return html`
                ${stillLoading ? html`
                <div style="float: right; margin: 1em 0;">
                    <loading-dots style="--height: 10px"></loading-dots>
                </div>` : ''}
                <wl-title level="2" style="font-size: 16px;">Gallery:</wl-title>
                <image-gallery style="--width: 300px; --height: 160px;" .items="${items}"></image-gallery>`;
        } else {
            // Shows nothing when no gallery
            return '';
        }
    }

    updated () {
        if (this._shouldUpdateConfigs) this._updateConfigSelector();
        if (this._shouldUpdateSetups) this._updateSetupSelector();
        if (this._tab == 'example') {
            let ex : string = this._getExample();
            if (ex) {
                let example = this.shadowRoot.getElementById('mk-example');
                if (example) {
                    example.innerHTML = marked(ex);
                }
            }
        } else if (this._tab == 'variables') {
            (this.shadowRoot.querySelectorAll('wl-expansion') || []).forEach((wle:any) => {
                let t = wle.shadowRoot!.getElementById('title');
                if (t) {
                    t.style["width"] = "calc(100% - 30px)";
                    t.style["overflow"] = "hidden";
                    t.style["white-space"] = "nowrap";
                    t.style["text-overflow"] = "ellipsis";
                }
            });
        }
    }

    private _getExample () {
        if (this._setup && this._setup.hasExample && this._setup.hasExample.length > 0)
            return this._setup.hasExample[0];
        if (this._config && this._config.hasExample && this._config.hasExample.length > 0)
            return this._config.hasExample[0];
        if (this._version && this._version.hasExample && this._version.hasExample.length > 0)
            return this._version.hasExample[0];
        if (this._model && this._model.hasExample && this._model.hasExample.length > 0)
            return this._model.hasExample[0];
        return '';
    }

    private _clear () {
        this._loading = {} as IdMap<boolean>;
        this._logo! = null;
        this._authors = {} as IdMap<Person>;
        this._regions = {} as IdMap<Region>;
        this._funding = {} as IdMap<FundingInformation>;
        this._organizations = {} as IdMap<Organization>;
        this._modelRegions = null;
        console.log('CLEAR');
    }

    firstUpdated() {
        this._loadingGlobals = true;
        this._loadingRegions = true;
        let rVer = store.dispatch(ModelCatalogApi.myCatalog.softwareVersion.getAll());
        let rCfg = store.dispatch(ModelCatalogApi.myCatalog.modelConfiguration.getAll());
        let rSet = store.dispatch(ModelCatalogApi.myCatalog.modelConfigurationSetup.getAll());
        let rReg = store.dispatch(ModelCatalogApi.myCatalog.region.getAll());
        rVer.then(() => this._shouldUpdateConfigs = true);
        rCfg.then(() => this._shouldUpdateConfigs = true);
        rSet.then(() => this._shouldUpdateSetups = true);
        rReg.then(() => this._loadingRegions = false);

        Promise.all([rVer, rCfg, rSet, rReg]).then(() => {
            this._loadingGlobals = false;
            this.stateChanged(store.getState() as RootState);
        });
    }

    stateChanged(state: RootState) {
        super.setRegion(state);
        let ui = state.explorerUI;
        let db = state.modelCatalog;

        this.setSubPage(state);
        if (this._subpage != "explore") {
            if (this._selectedModel) {
                this._selectedModel = '';
                this._selectedVersion = '';
                this._selectedConfig = '';
                this._selectedSetup = '';
            }
            return;
        }

        // check whats changed
        let modelChanged : boolean = ui && (ui.selectedModel !== this._selectedModel);
        let versionChanged : boolean = ui && (modelChanged || ui.selectedVersion !== this._selectedVersion);
        let configChanged : boolean = ui && (versionChanged || ui.selectedConfig !== this._selectedConfig);
        let setupChanged : boolean = ui && (ui.selectedCalibration !== this._selectedSetup);
        if (db) {
            this._versions = db.softwareversion;
            this._configs = db.modelconfiguration;
            this._setups = db.modelconfigurationsetup;
            this._regions = db.region;

            if (modelChanged) {
                this._selectedModel = ui.selectedModel;
                this._model = null;
                if (!this._selectedModel) {
                    this._clear();
                    return;
                }
                if (!this._selectedVersion) {
                    this._shouldUpdateConfigs = true;
                }
                this._loading[this._selectedModel] = true;
                store.dispatch(ModelCatalogApi.myCatalog.model.get(this._selectedModel)).then((model:Model) => {
                    this._loading[this._selectedModel] = false;
                    this._model = model;
                    this._modelRegions = null;

                    // Logo
                    this._logo = null;
                    if (this._model.logo && this._model.logo.length > 0) {
                        let logoId = (this._model.logo[0] as Image).id;
                        if (db.image[logoId]) {
                            this._logo = db.image[logoId];
                        } else {
                            this._loading[logoId] = true;
                            store.dispatch(ModelCatalogApi.myCatalog.image.get(logoId)).then((logo: Image) => {
                                this._loading[logoId] = false;
                                this._logo = logo;
                            });
                        }
                    }

                    // Authors
                    this._loadAuthors(this._model.author, db);
                    //Funding and all its organizations
                    this._loadFundings(this._model.hasFunding, db);
                    //Gallery (Image, Visualization)
                    this._loadImages(
                        (this._model.screenshot || []).concat(this._model.hasExplanationDiagram || [])
                    , db);
                    this._loadVisualizations(this._model.hasSampleVisualization, db);
                    // Software Images and Source Code only on tech tab
                    if (this._tab === 'tech') {
                        this._loadSourceCodes(this._model.hasSourceCode, db);
                    }
                    this._loadProcesses(this._model.hasProcess, db);
                    this._loadVariablePresentations(this._model.hasInputVariable, db);
                    this._loadVariablePresentations(this._model.hasOutputVariable, db);

                    //FIXME: this is duplicated
                    if (this._model && !this._modelRegions && !this._loadingGlobals) {
                        let regions : Set<string> = new Set();
                        (this._model.hasVersion || [])
                            .map((ver:SoftwareVersion) => this._versions[ver.id])
                            .forEach((ver:SoftwareVersion) => {
                                (ver.hasConfiguration || [])
                                    .map((cfg:ModelConfiguration) => this._configs[cfg.id])
                                    .forEach((cfg:ModelConfiguration) => {
                                        (cfg.hasRegion || [])
                                            .map((region:Region) => db.region[region.id])
                                            .forEach((region:Region) => regions.add(region.id));
                                        (cfg.hasSetup || [])
                                            .map((setup:ModelConfigurationSetup) => this._setups[setup.id])
                                            .forEach((setup:ModelConfigurationSetup) => {
                                                (setup && setup.hasRegion ? setup.hasRegion : [])
                                                    .map((region:Region) => db.region[region.id])
                                                    .forEach((region:Region) => regions.add(region.id));
                                            });
                                    });
                            });
                        this._modelRegions = Array.from(regions);
                    }
                });
            }

            if (versionChanged) {
                this._version = null;
                if (ui.selectedVersion) {
                    if (db.softwareversion[ui.selectedVersion]) {
                        this._selectedVersion = ui.selectedVersion;
                        this._version = db.softwareversion[ui.selectedVersion];
                        this._loadImages(this._version.screenshot, db);
                        this._loadVisualizations(this._version.hasSampleVisualization, db);
                    }
                } else {
                    this._selectedVersion = ui.selectedVersion;
                }
            }

            if (configChanged) {
                this._shouldUpdateSetups = true;
                this._config = null;
                if (ui.selectedConfig) {
                    if (db.modelconfiguration[ui.selectedConfig]) {
                        this._selectedConfig = ui.selectedConfig;
                        this._config = db.modelconfiguration[this._selectedConfig];
                        this._shouldUpdateConfigs = true;
                        //--
                        this._loadAuthors(this._config.author, db);
                        this._loadFundings(this._config.hasFunding, db);
                        this._loadTimeIntervals(this._config.hasOutputTimeInterval, db);
                        this._loadGrids(this._config.hasGrid, db);
                        this._loadProcesses(this._config.hasProcess, db);
                        this._loadImages(
                            (this._config.screenshot || []).concat(this._config.hasExplanationDiagram || [])
                        , db);
                        this._loadVisualizations(this._config.hasSampleVisualization, db);
                        // FIXME: This logic for tabs is being loaded even when a setup is selected
                        if (this._tab === 'tech') {
                            this._loadSourceCodes(this._config.hasSourceCode, db);
                            this._loadSoftwareImages(this._config.hasSoftwareImage, db);
                        } else if (this._tab === 'io') {
                            // Parameters and DatasetSpecification only on io
                            this._loadParameters(this._config.hasParameter, db);
                            this._loadDatasetSpecifications(this._config.hasInput, db);
                            this._loadDatasetSpecifications(this._config.hasOutput, db);
                        } else if (this._tab === 'variables') {
                            this._loadDatasetSpecifications(this._config.hasInput, db);
                            this._loadDatasetSpecifications(this._config.hasOutput, db);
                        }
                    } 
                } else {
                    this._selectedConfig = ui.selectedConfig;
                }
            }

            if (setupChanged) {
                this._setup = null;
                this._selectedSetup = ui.selectedCalibration;
                if (this._selectedSetup) this._loading[this._selectedSetup] = true;
                this._shouldUpdateSetups = true;
                if (this._selectedSetup) {
                    let detailsRequest : Promise<ModelConfigurationSetup> = store.dispatch(
                            ModelCatalogApi.myCatalog.modelConfigurationSetup.getDetails(this._selectedSetup)
                    );
                    detailsRequest.then((setup:ModelConfigurationSetup) => {
                        this._setupNotFound = false;
                        // Save authors 
                        (setup.author || []).forEach((author:Person|Organization) => {
                            if (author.type && author.type.includes("Person")) {
                                this._authors[author.id] = author;
                            } else if (author.type && author.type.includes("Organization")) {
                                this._organizations[author.id] = author;
                            } else {
                                console.warn("Cannot identify type of", author);
                            }
                        });
                        // Save time interval
                        (setup.hasOutputTimeInterval || []).forEach((ti:TimeInterval) => {
                            this._timeIntervals[ti.id] = ti;
                        });
                        // Save grids 
                        (setup.hasGrid || []).forEach((grid:Grid) => {
                            this._grids[grid.id] = grid;
                        });
                        // Save processes
                        (setup.hasProcess || []).forEach((process:Process) => {
                            this._processes[process.id] = process;
                        });
                        // Save source code
                        (setup.hasSourceCode || []).forEach((sourceCode:SourceCode) => {
                            this._sourceCodes[sourceCode.id] = sourceCode;
                        });
                        // Save softwareImage
                        (setup.hasSoftwareImage || []).forEach((si:SoftwareImage) => {
                            this._softwareImages[si.id] = si;
                        });

                        if (setup.hasParameter) this._loadParameters(setup.hasParameter, db);
                        if (setup.hasInput) this._loadDatasetSpecifications(setup.hasInput, db);
                        if (setup.hasOutput) this._loadDatasetSpecifications(setup.hasOutput, db);

                        (setup.hasInput || []).concat(setup.hasOutput || []).forEach((ds:DatasetSpecification) => {
                            //FIXME: this does not return hasFixedValue -> hasPart
                            this._datasetSpecifications2[ds.id] = ds;
                        });

                        this._setup = setup;
                        this._closeAllExpansions();
                        this._loading[this._selectedSetup] = false;
                    });
                    detailsRequest.catch((error) => {
                        if (error.status == 404) {
                            this._setupNotFound = true;
                        }
                    });
                }
            }

            if (this._model && !this._modelRegions && !this._loadingGlobals) {
                let regions : Set<string> = new Set();
                (this._model.hasVersion || [])
                    .map((ver:SoftwareVersion) => this._versions[ver.id])
                    .forEach((ver:SoftwareVersion) => {
                        (ver.hasConfiguration || [])
                            .map((cfg:ModelConfiguration) => this._configs[cfg.id])
                            .forEach((cfg:ModelConfiguration) => {
                                (cfg.hasRegion || [])
                                    .map((region:Region) => db.region[region.id])
                                    .forEach((region:Region) => regions.add(region.id));
                                (cfg.hasSetup || [])
                                    .map((setup:ModelConfigurationSetup) => this._setups[setup.id])
                                    .forEach((setup:ModelConfigurationSetup) => {
                                        (setup && setup.hasRegion ? setup.hasRegion : [])
                                            .map((region:Region) => db.region[region.id])
                                            .forEach((region:Region) => regions.add(region.id));
                                    });
                            });
                    });
                this._modelRegions = Array.from(regions);
            }
        }
    }

    private _loadAuthors (authorArr: (Person|Organization)[], db: ModelCatalogState) {
        (authorArr || []).forEach((author:Person|Organization) => {
            if (author.type && author.type.includes("Person")) {
                if (db.person[author.id]) {
                    this._authors[author.id] = db.person[author.id];
                } else {
                    this._loading[author.id] = true;
                    store.dispatch(ModelCatalogApi.myCatalog.person.get(author.id)).then((person:Person) => {
                        this._loading[author.id] = false;
                        this._authors[author.id] = person;
                        this.requestUpdate();
                    });
                }
            } else if (author.type && author.type.includes("Organization")) {
                if (db.organization[author.id]) {
                    this._organizations[author.id] = db.organization[author.id];
                } else {
                    this._loading[author.id] = true;
                    store.dispatch(ModelCatalogApi.myCatalog.organization.get(author.id)).then((organization:Organization) => {
                        this._loading[author.id] = false;
                        this._organizations[author.id] = organization;
                        this.requestUpdate();
                    });
                }
            } else {
                console.warn("Cannot identify type of", author);
            }
        })
    }

    private _renderAuthors (authorArray: (Person|Organization)[]) {
        //HACK
        if (this._selectedModel === "https://w3id.org/okn/i/mint/CYCLES") {
            authorArray = [
                {
                    id: "https://w3id.org/okn/i/mint/kemanian_armen",
                    label: ["Armen Kemanian"],
                    type: ["Person", "Thing"]
                } as Person,
                {
                    id: "https://w3id.org/okn/i/mint/shi_yuning",
                    label: ["Yuning Shi"],
                    type: ["Person", "Thing"]
                } as Person,
                {
                    id: "https://w3id.org/okn/i/mint/white_charlie",
                    label: ["Charlie M. White"],
                    type: ["Person", "Thing"]
                } as Person,
                {
                    id: "https://w3id.org/okn/i/mint/stockle_claudio",
                    label: ["Claudio O. Stockle"],
                    type: ["Person", "Thing"]
                } as Person
            ]
        }

        return (authorArray || []).map((author:Person|Organization) => {
            if (this._loading[author.id]) {
                return html`${getId(author)} <loading-dots style="--width: 20px"></loading-dots>&nbsp;`
            } else {
                if (author.type && author.type.includes("Person")) {
                    return html`<span class="resource author">${getLabel(this._authors[author.id])}</span>`
                } else if (author.type && author.type.includes("Organization")) {
                    return html`<span class="resource organization">${getLabel(this._organizations[author.id])}</span>`
                } else {
                    return html`<span class="resource">${getId(author)}</span>`
                }
            }
        });
    }

    private _loadFundings (fundArray: FundingInformation[], db: ModelCatalogState) {
        if (fundArray && fundArray.length > 0) {
            Promise.all(
                fundArray.map((fund:FundingInformation) => {
                    if (db.fundinginformation[fund.id]) {
                        this._funding[fund.id] = db.fundinginformation[fund.id];
                        (this._funding[fund.id].fundingSource || []).forEach((org:Organization) => {
                            this._loading[org.id] = true;
                        });
                        return Promise.resolve(this._funding[fund.id]);
                    } else {
                        this._loading[fund.id] = true;
                        let req = store.dispatch(ModelCatalogApi.myCatalog.fundingInformation.get(fund.id));
                        req.then((funding:FundingInformation) => {
                            this._loading[fund.id] = false;
                            this._funding[fund.id] = funding;
                            (this._funding[fund.id].fundingSource || []).forEach((org:Organization) => {
                                this._loading[org.id] = true;
                            });
                            this.requestUpdate();
                        });
                        return req;
                    }
                })
            ).then((fundings:FundingInformation[]) => {
                fundings.forEach((fund: FundingInformation) => {
                    (fund.fundingSource || []).forEach((org:Organization) => {
                        if (db.organization[org.id]) {
                            this._organizations[org.id] = db.organization[org.id];
                            this._loading[org.id] = false;
                        } else {
                            store.dispatch(ModelCatalogApi.myCatalog.organization.get(org.id)).then((organization:Organization) => {
                                this._organizations[org.id] = organization;
                                this._loading[org.id] = false;
                                this.requestUpdate();
                            });
                        }
                    });
                });
            });
        }
    }

    private _renderFundings (fundArray: FundingInformation[]) {
        return (fundArray || []).map((fund:FundingInformation) => this._loading[fund.id] ?
            html`${getId(fund)} <loading-dots style="--width: 20px"></loading-dots>&nbsp;`
            : (this._funding[fund.id].fundingSource ? 
                this._funding[fund.id].fundingSource.map((org:Organization) => 
                    this._loading[org.id] ? 
                    html`${getId(org)} <loading-dots style="--width: 20px"></loading-dots>&nbsp;`
                    : html`<span class="resource organization">
                        ${getLabel(this._organizations[org.id])}
                    </span>`)
                : (this._funding[fund.id].fundingGrant ? 
                    html`<span>${this._funding[fund.id].fundingGrant}</span>`
                    : html`${getLabel(this._funding[fund.id])}`
                    )
                )
            );
    }

    private _loadTimeIntervals (tiArr: TimeInterval[], db: ModelCatalogState) {
        (tiArr || []).forEach((ti:TimeInterval) => {
            if (db.timeinterval[ti.id]) {
                this._timeIntervals[ti.id] = db.timeinterval[ti.id];
            } else {
                this._loading[ti.id] = true;
                store.dispatch(ModelCatalogApi.myCatalog.timeInterval.get(ti.id)).then((ti:TimeInterval) => {
                    this._loading[ti.id] = false;
                    this._timeIntervals[ti.id] = ti;
                    this.requestUpdate();
                });
            }
        })
    }

    private _renderTimeInterval (ti: TimeInterval) {
        return this._loading[ti.id] ? 
            html`${getId(ti)} <loading-dots style="--width: 20px"></loading-dots>&nbsp;`
            : html`<span class="resource time-interval">
                <span>
                    ${this._timeIntervals[ti.id].intervalValue}
                    ${this._timeIntervals[ti.id].intervalUnit && this._timeIntervals[ti.id].intervalUnit.length > 0 ? 
                        getLabel(this._timeIntervals[ti.id].intervalUnit[0]) : ''}
                </span>
            </span>`
    }

    private _loadGrids (gridArr: Grid[], db: ModelCatalogState) {
        (gridArr || []).forEach((grid:Grid) => {
            if (db.grid[grid.id]) {
                this._grids[grid.id] = db.grid[grid.id];
            } else {
                this._loading[grid.id] = true;
                store.dispatch(ModelCatalogApi.myCatalog.grid.get(grid.id)).then((grid:Grid) => {
                    this._loading[grid.id] = false;
                    this._grids[grid.id] = grid;
                    this.requestUpdate();
                });
            }
        })
    }

    private _renderGrid (grid: Grid) {
        return this._loading[grid.id] ? 
            html`${getId(grid)} <loading-dots style="--width: 20px"></loading-dots>&nbsp;`
            : html`<span class="resource grid">
                <div style="display: flex; justify-content: space-between;">
                    <span style="text-decoration: underline;">
                        ${this._grids[grid.id].type.filter(t => t != 'Grid')}
                    </span>
                    <span style="margin-left:20px;">
                        ${this._grids[grid.id].hasDimension && this._grids[grid.id].hasDimension.length > 0 ?  html`
                            <span>Dimensions:</span>
                            <span class="number"> ${this._grids[grid.id].hasDimension[0]} </span>` : ""}
                    </span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    ${this._grids[grid.id].hasSpatialResolution && this._grids[grid.id].hasSpatialResolution.length > 0 ?
                    html`
                    <span>
                        <span>Spatial resolution:</span>
                        <span class="monospaced"> ${this._grids[grid.id].hasSpatialResolution[0]} </span>
                    </span>`: ""}
                    ${this._grids[grid.id].hasShape && this._grids[grid.id].hasShape.length > 0 ? html`
                    <span style="${this._grids[grid.id].hasSpatialResolution && this._grids[grid.id].hasSpatialResolution.length > 0 ?
                            'margin-left:20px;' : ''}">
                        <span>Shape:</span>
                        <span class="monospaced"> ${this._grids[grid.id].hasShape[0]} </span>
                    </span>` : ""}
                </div>
            </span>`
    }

    private _loadProcesses (processArr: Process[], db: ModelCatalogState) {
        (processArr || []).forEach((process:Process) => {
            if (db.process[process.id]) {
                this._processes[process.id] = db.process[process.id];
            } else {
                this._loading[process.id] = true;
                store.dispatch(ModelCatalogApi.myCatalog.process.get(process.id)).then((process:Process) => {
                    this._loading[process.id] = false;
                    this._processes[process.id] = process;
                    this.requestUpdate();
                });
            }
        })
    }

    private _renderProcesses (processes: Process[]) {
        return (processes || []).map((process:Process) => this._loading[process.id] ? 
            html`${getId(process)} <loading-dots style="--width: 20px"></loading-dots>&nbsp;`
            : html`<span class="resource process">
                ${getLabel(this._processes[process.id])}
            </span>`);
    }

    private _loadImages (imagesArr: Image[], db: ModelCatalogState) {
        (imagesArr || []).forEach((image:Image) => {
            if (db.image[image.id]) {
                this._images[image.id] = db.image[image.id];
            } else if (!this._loading[image.id]) {
                this._loading[image.id] = true;
                store.dispatch(ModelCatalogApi.myCatalog.image.get(image.id)).then((image:Image) => {
                    this._loading[image.id] = false;
                    this._images[image.id] = image;
                    this.requestUpdate();
                });
            }
        })
    }

    private _loadVisualizations (visualizationsArr: Visualization[], db: ModelCatalogState) {
        (visualizationsArr || []).forEach((visualization:Visualization) => {
            if (db.visualization[visualization.id]) {
                this._visualizations[visualization.id] = db.visualization[visualization.id];
            } else if (!this._loading[visualization.id]) {
                this._loading[visualization.id] = true;
                store.dispatch(ModelCatalogApi.myCatalog.visualization.get(visualization.id)).then((visualization:Visualization) => {
                    this._loading[visualization.id] = false;
                    this._visualizations[visualization.id] = visualization;
                    this.requestUpdate();
                });
            }
        })
    }

    private _loadSourceCodes (sourceArr: SourceCode[], db: ModelCatalogState) {
        (sourceArr || []).forEach((sourceCode:SourceCode) => {
            if (db.sourcecode[sourceCode.id]) {
                this._sourceCodes[sourceCode.id] = db.sourcecode[sourceCode.id];
            } else if (!this._loading[sourceCode.id]) {
                this._loading[sourceCode.id] = true;
                store.dispatch(ModelCatalogApi.myCatalog.sourceCode.get(sourceCode.id)).then((sourceCode:SourceCode) => {
                    this._loading[sourceCode.id] = false;
                    this._sourceCodes[sourceCode.id] = sourceCode;
                    this.requestUpdate();
                });
            }
        })
    }

    private _loadSoftwareImages (siArr: SoftwareImage[], db: ModelCatalogState) {
        (siArr || []).forEach((softwareImage:SoftwareImage) => {
            if (db.softwareimage[softwareImage.id]) {
                this._softwareImages[softwareImage.id] = db.softwareimage[softwareImage.id];
            } else if (!this._loading[softwareImage.id]) {
                this._loading[softwareImage.id] = true;
                store.dispatch(ModelCatalogApi.myCatalog.softwareImage.get(softwareImage.id)).then((softwareImage:SoftwareImage) => {
                    this._loading[softwareImage.id] = false;
                    this._softwareImages[softwareImage.id] = softwareImage;
                    this.requestUpdate();
                });
            }
        })
    }

    private _loadParameters (parametersArr: Parameter[], db: ModelCatalogState) {
        (parametersArr || []).forEach((parameter:Parameter) => {
            if (db.parameter[parameter.id]) {
                this._parameters[parameter.id] = db.parameter[parameter.id];
                if (this._parameters[parameter.id].relevantForIntervention)
                    this._loadInterventions(this._parameters[parameter.id].relevantForIntervention, db);
            } else if (!this._loading[parameter.id]) {
                this._loading[parameter.id] = true;
                store.dispatch(ModelCatalogApi.myCatalog.parameter.get(parameter.id)).then((parameter:Parameter) => {
                    this._loading[parameter.id] = false;
                    this._parameters[parameter.id] = parameter;
                    if (parameter.relevantForIntervention)
                        this._loadInterventions(parameter.relevantForIntervention, db);
                    this.requestUpdate();
                });
            }
        })
    }

    private _loadDatasetSpecifications (dsArr: DatasetSpecification[], db: ModelCatalogState) {
        (dsArr || []).forEach((ds:DatasetSpecification) => {
            if (db.datasetspecification[ds.id]) {
                this._datasetSpecifications[ds.id] = db.datasetspecification[ds.id];
            } else if (!this._loading[ds.id]) {
                this._loading[ds.id] = true;
                store.dispatch(ModelCatalogApi.myCatalog.datasetSpecification.get(ds.id)).then((datasetSpecification:DatasetSpecification) => {
                    this._loading[datasetSpecification.id] = false;
                    this._datasetSpecifications[datasetSpecification.id] = datasetSpecification;
                    this.requestUpdate();
                });
            }
        })
    }

    private _loadInterventions (interventionsArr: Intervention[], db: ModelCatalogState) {
        (interventionsArr || []).forEach((intervention:Intervention) => {
            if (db.intervention[intervention.id]) {
                this._interventions[intervention.id] = db.intervention[intervention.id];
            } else if (!this._loading[intervention.id]) {
                this._loading[intervention.id] = true;
                store.dispatch(ModelCatalogApi.myCatalog.intervention.get(intervention.id)).then((intervention:Intervention) => {
                    this._loading[intervention.id] = false;
                    this._interventions[intervention.id] = intervention;
                    this.requestUpdate();
                });
            }
        })
    }

    private _loadVariablePresentations (vpArr: VariablePresentation[], db: ModelCatalogState) {
        (vpArr || []).forEach((vp:VariablePresentation) => {
            if (db.variablepresentation[vp.id]) {
                this._variablePresentations[vp.id] = db.variablepresentation[vp.id];
            } else if (!this._loading[vp.id]) {
                this._loading[vp.id] = true;
                store.dispatch(ModelCatalogApi.myCatalog.variablePresentation.get(vp.id)).then((variablePresentation:VariablePresentation) => {
                    this._loading[variablePresentation.id] = false;
                    this._variablePresentations[variablePresentation.id] = variablePresentation;
                    this.requestUpdate();
                });
            }
        })
    }
}
