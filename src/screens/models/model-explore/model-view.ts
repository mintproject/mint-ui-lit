import { html, property, customElement, css } from 'lit-element';

import { PageViewElement } from 'components/page-view-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';

// FIXME
import { FetchedModel, IODetail, VersionDetail, ConfigDetail, CalibrationDetail, CompIODetail,
         ExplanationDiagramDetail } from "../../../util/api-interfaces";
import { fetchCompatibleSoftwareForConfig, fetchParametersForConfig, fetchVersionsForModel, 
        fetchIOAndVarsSNForConfig, fetchVarsSNAndUnitsForIO, fetchDiagramsForModelConfig,  fetchSampleVisForModelConfig,
        fetchMetadataForModelConfig, fetchMetadataNoioForModelConfig, fetchScreenshotsForModelConfig,
        fetchAuthorsForModelConfig, fetchDescriptionForVar } from '../../../util/model-catalog-actions';
//
import { Model, SoftwareVersion, ModelConfiguration, ModelConfigurationSetup, Person, Organization, Region, FundingInformation, 
         Image, Grid, TimeInterval, Process } from '@mintproject/modelcatalog_client';
import { modelGet, versionGet, versionsGet, modelConfigurationGet, modelConfigurationsGet, modelConfigurationSetupsGet,
         modelConfigurationSetupGet, imageGet, personGet, regionsGet, organizationGet, fundingInformationGet,
         timeIntervalGet, gridGet, processGet, setupGetAll } from 'model-catalog/actions';
import { capitalizeFirstLetter, getId, getLabel, getURL, isEmpty } from 'model-catalog/util';

import { explorerSetMode } from './ui-actions';
import { SharedStyles } from '../../../styles/shared-styles';
import { ExplorerStyles } from './explorer-styles'
import marked from 'marked';

import { showDialog, hideDialog } from 'util/ui_functions';

import { goToPage } from '../../../app/actions';
import "weightless/expansion";
import "weightless/tab";
import "weightless/tab-group";
import "weightless/card";
import "weightless/icon";
import "weightless/progress-spinner";
import "weightless/progress-bar";
import "weightless/select";
import '../../../components/image-gallery'
import '../../../components/loading-dots'

import { Select } from "weightless/select";


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

    // Direct data for this model
    @property({type: Object}) private _model! : Model;
    @property({type: Object}) private _version! : SoftwareVersion | null = null;
    @property({type: Object}) private _config! : ModelConfiguration | null = null;
    @property({type: Object}) private _setup! : ModelConfigurationSetup | null = null;
    @property({type: Object}) private _logo! : Image;
    @property({type: Object}) private _authors : IdMap<Person> = {} as IdMap<Person>;
    @property({type: Object}) private _funding : IdMap<Funding> = {} as IdMap<Funding>;
    @property({type: Object}) private _organizations : IdMap<Organization> = {} as IdMap<Organization>;
    @property({type: Object}) private _timeIntervals : IdMap<TimeInterval> = {} as IdMap<TimeInterval>;
    @property({type: Object}) private _grids : IdMap<Grid> = {} as IdMap<Grid>;
    @property({type: Object}) private _processes : IdMap<Process> = {} as IdMap<Process>;

    // Computed data
    @property({type: Array}) private _modelRegions : string[] | null = null;

    // Booleans
    @property({type: Object}) private _loading : IdMap<boolean> = {} as IdMap<boolean>;
    @property({type: Boolean}) private _shouldUpdateConfigs : boolean = false;
    @property({type: Boolean}) private _shouldUpdateSetups : boolean = false;
    @property({type: Boolean}) private _loadingGlobals : boolean = false;
    @property({type: Boolean}) private _loadingRegions : boolean = false;

    /***********/
    @property({type: Number})
    private _count : number = 0;

    @property({type: Object})
    private _configMetadata: any = null;

    @property({type: Object})
    private _indices: any = null;

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

    /*@property({type: Object})
    private _version : VersionDetail | null = null;

    @property({type: Object})
    private _config : ConfigDetail | null = null;
*/
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
    private _tab : 'overview'|'io'|'variables'|'tech'|'example' = 'overview';

    private _emulators = {
        'https://w3id.org/okn/i/mint/CYCLES' : '/emulators/cycles',
        'https://w3id.org/okn/i/mint/TOPOFLOW': '/emulators/topoflow',
        'https://w3id.org/okn/i/mint/PIHM' : '/emulators/pihm',
        'https://w3id.org/okn/i/mint/HAND' : '/emulators/hand'
    }

    static get styles() {
        return [SharedStyles, ExplorerStyles,
            css `
                .config-selector {
                    display: grid;
                    grid-template-columns: 50px auto 114px;
                    align-items: center;
                    height: 50px;
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
                }

                a[disabled] {
                    cursor: not-allowed;
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
                `
        ];
    }


    _renderCLIDialog () {
        return html`
        <wl-dialog class="larger" id="CLIDialog" fixed backdrop blockscrolling>
            <h3 slot="header">Execute on Desktop</h3>
            <div slot="content">
                <wl-text> You can run this model with the following command: </wl-text>
                <div class="monospaced code-example">
                    <div style="font-size: 14px">
                        <span style="color: darkgray;">$</span> mint run ${getId(this._model)}
                    </div>
                    <div>
                        <wl-button inverted flat>
                            <wl-icon>link</wl-icon>
                        </wl-button>
                    </div>
                </div>
                <wl-text> 
                    Visit the
                    <a target="_blank" href="https://mint-cli.readthedocs.io/en/latest/">
                        MINT CLI website
                    </a>
                    for documentation and installation instructions.
                </wl-text>
            </div>
            <div slot="footer">
                <wl-button @click="${() => hideDialog("CLIDialog", this.shadowRoot)}" style="margin-right: 5px;" inverted flat>Close</wl-button>
            </div>
        </wl-dialog>`
    }

    _openCLIDialog () {
        showDialog("CLIDialog", this.shadowRoot);
    }

    _addConfig () {
        if (this._model && this._version && this._config) {
            let url = 'models/configure/' + this._model.uri.split('/').pop() + '/' + this._version.uri.split('/').pop() + '/'
                    + this._config.uri.split('/').pop() + '/new';
            goToPage(url)
        }
    }

    _setEditMode () {
        //TODO: this is work in progress!
        store.dispatch(explorerSetMode('edit')); 
    }

    _updateConfigSelector () {
        let configSelectorWl : Select = this.shadowRoot!.getElementById('config-selector');
        let configSelector : HTMLSelectElement | null = configSelectorWl? configSelectorWl.getElementsByTagName('select')[0] : null;
        if (configSelectorWl && configSelector) {
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
                            .map((cfg:Configuration) => this._configs[cfg.id] ? this._configs[cfg.id] : cfg)
                            .forEach((cfg:Configuration) => {
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
            configSelectorWl.refreshAttributes();
        } else {
            /* FIXME: Sometimes, when versions data load faster than the wl-selector renders, we could end here.
             * The selectors will appear empty, but any update fixes it. */
            console.warn('selector not found');
            setTimeout(() => {
                this._updateConfigSelector();
            }, 400);
        }
    }

    _onConfigChange () {
        let configSelectorWl : Select = this.shadowRoot!.getElementById('config-selector');
        let configSelector : HTMLSelectElement | null = configSelectorWl? configSelectorWl.getElementsByTagName('select')[0] : null;
        if (configSelectorWl && configSelector) {
            let cfgURL : string = configSelector.value;
            let ver = Object.values(this._versions).filter((ver:SoftwareVersion) => 
                (ver.hasConfiguration||[]).some((cfg:ModelConfiguration) => cfg.id === cfgURL)
            ).pop();
            goToPage(this.PREFIX + getURL(this._model, ver, cfgURL));
        }
    }

    _updateSetupSelector () {
        let setupSelectorWl : Select = this.shadowRoot!.getElementById('setup-selector');
        let setupSelector : HTMLSelectElement | null = setupSelectorWl? setupSelectorWl.getElementsByTagName('select')[0] : null;
        if (setupSelectorWl && setupSelector && this._config) {
            console.log('Updating Setup Selector', this._config);
            this._shouldUpdateSetups = false;
            while (setupSelector.options.length > 0) 
                setupSelector.remove(setupSelector.options.length - 1);

            let unselect = document.createElement('option');
            unselect.text = '\xA0\xA0No setup selected'
            unselect.value = '';
            setupSelector.add(unselect, null);
            (this._config.hasSetup || [])
                    .map((setup:ModelConfigurationSetup) => this._setups[setup.id] ? this._setups[setup.id] : setup)
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
            setupSelectorWl.refreshAttributes();
        } else {
            console.warn('Setup selector not found!');
        }
    }

    _onSetupChange () {
        let setupSelectorWl : Select = this.shadowRoot!.getElementById('setup-selector');
        let setupSelector : HTMLSelectElement | null = setupSelectorWl? setupSelectorWl.getElementsByTagName('select')[0] : null;
        if (setupSelectorWl && setupSelector) {
            let setupURL : string = setupSelector.value;

            let ver = Object.values(this._versions).filter((ver:SoftwareVersion) => 
                (ver.hasConfiguration||[]).some((cfg:ModelConfiguration) => cfg.id === this._config.id)
            ).pop();
            goToPage(this.PREFIX + getURL(this._model, ver, this._config, setupURL));
        }
    }

    _renderSelectors () {
        if (!this._model.hasVersion) {
            return html`<div class="info-center">- No version available -</div>`;
        }
        let hasVersions = (this._model.hasVersion.length > 0);
        return html`
            <div class="config-selector">
                <span style="text-align: center;">
                    <wl-button flat inverted @click="">
                        <span class="rdf-icon">
                    </wl-button>
                </span>
                <span>
                    <wl-select label="Select a configuration" id="config-selector" @input="${this._onConfigChange}">
                    </wl-select>
                </span>
                <span>
                    <wl-button flat inverted @click="">
                        <wl-icon>edit</wl-icon>
                    </wl-button>
                    <wl-button flat inverted @click=${this._openCLIDialog}>
                        <wl-icon>code</wl-icon>
                    </wl-button>
                    <span tip="A model configuration is a unique way of running a model, exposing concrete inputs and outputs" 
                         class="tooltip" style="top: 4px;">
                        <wl-icon style="--icon-size: 24px;">help_outline</wl-icon>
                    </span>
                </span>
            </div>

            <div class="config-selector 
                ${this._selectedConfig && this._config && this._config.hasSetup && this._config.hasSetup.length > 0? '' : 'hidden'}">
                <span style="text-align: center;">
                    <wl-button flat inverted @click="">
                        <span class="rdf-icon">
                    </wl-button>
                </span>
                <span>
                    <wl-select label="Select a configuration setup" id="setup-selector" @input="${this._onSetupChange}">
                    </wl-select>
                </span>
                <span>
                    <wl-button flat inverted @click="">
                        <wl-icon>edit</wl-icon>
                    </wl-button>
                    <wl-button flat inverted @click=${this._openCLIDialog}>
                        <wl-icon>code</wl-icon>
                    </wl-button>
                    <span tip="A model configuration setup represents a model with parameters that have been adjusted (manually or automatically) to be run in a specific region" 
                         class="tooltip" style="top: 4px;">
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

        let modelType : string[] = this._model.type ?
                this._model.type.map((t:string) => t.replace('Model', '')).filter(t => !!t)
                : [];

        return html`
            <div class="wrapper">
                <div class="col-title">
                    <wl-title level="2">
                        <a target="_blank" href="${this._model.id}" class="rdf-icon"></a>
                        ${this._model.label}
                        <a style="display:none" @click="${this._setEditMode}"><wl-icon id="edit-model-icon">edit</wl-icon></a>
                    </wl-title>
                </div>
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
                      html`<div><b>Creation date:</b> ${this._model.dateCreated}</div>`
                      :''}
                    ${this._model.hasModelCategory ?
                      html`<div><b>Category:</b> ${this._model.hasModelCategory.join(', ')}</div>`
                      :''}
                    ${modelType.length > 0 ? html`<div><b>Model type:</b> ${modelType.join(', ')}</div>`:''}
                </div>
                <div class="col-desc">
                    <wl-divider style="margin-bottom: .5em;"></wl-divider>
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
                        ${this._model.citation?
                          html`<wl-text><b>• Preferred citation:</b> <i>${ this._model.citation }<i></wl-text>` 
                          :''}
                        ${this._model.hasDocumentation?
                          html`<wl-text>
                            <b>• Documentation:</b>
                            <a target="_blank" href="${this._model.hasDocumentation[0]}">
                                ${this._model.hasDocumentation[0].split('/').pop() || this._model.hasDocumentation}
                            </a>
                        </wl-text>` :''}
                        ${!this._modelRegions || this._modelRegions.length > 0 ? html`<wl-text><b>• Regions:</b>
                            ${!this._modelRegions ? 
                                html`<loading-dots style="--width: 20px"></loading-dots>` 
                                : this._modelRegions.map((rid:string) => this._regions[rid]).map((region:Region) =>
                                html`<span class="resource region">${getLabel(region)}
                                </span>`)}
                        </wl-text>` :''}

                        ${this._model.keywords? html`<wl-text><b>• Keywords:</b>
                            ${ this._model.keywords.map((kws:string) => kws.split(/ *; */).map(capitalizeFirstLetter).join(', ') ).join(', ') }
                        </wl-text>` :''}
                    </div>
                    ${this._renderSelectors()}
                </div>

                <div class="row-tab-header">
                    <wl-tab-group>
                        <wl-tab id="tab-overview" ?checked=${this._tab=='overview'} @click="${() => {this._tab = 'overview'}}"
                            >Overview</wl-tab>
                        <wl-tab id="tab-io" ?checked=${this._tab=='io'} @click="${() => {this._tab = 'io'}}"
                            >Parameters and Files</wl-tab>
                        <wl-tab id="tab-variable" ?checked=${this._tab=='variables'} @click="${() => {this._tab = 'variables'}}"
                            >Variables</wl-tab>

                        ${this._model.example? html`
                        <wl-tab id="tab-example" @click="${() => {this._tab = 'example'}}">
                            Example
                        </wl-tab>` : ''}

                        <wl-tab id="tab-overview" ?checked=${this._tab=='tech'} @click="${() => {this._tab = 'tech'}}"
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
            ${this._renderCLIDialog()} `
    }

    /* TODO: needs SourceCodeApi */
    _renderTabTechnical () {
        return html`
            <wl-title level="3"> Technical Information: </wl-title>
            ${this._model ? html`
            <table class="pure-table pure-table-striped">
                <thead>
                    <tr><th colspan="2">MODEL: 
                        <span style="margin-left: 6px; font-size: 16px; font-weight: bold; color: black;">${this._model.label}</span>
                    </th></tr>
                </thead>
                <tbody>
                ${this._model.operatingSystems && this._model.operatingSystems.length > 0 ? html`
                    <tr>
                        <td><b>Operating systems:</b></td>
                        <td>${this._model.operatingSystems[0].split(';').join(', ')}</td>
                    </tr>
                ` : ''}
                </tbody>
            </table>` : ''}
        `
    }

    _renderTabTechnical2 () {
        let showModel = this._model.os || this._model.pl || this._model.memReq || this._model.procReq || this._model.softwareReq ||
                        this._model.downloadURL || this._model.sourceC || this._model.doc || this._model.installInstr;
        return html`
            ${showModel ? html`
            <wl-title level="3"> Technical Information: </wl-title>
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
                        <td>
                            <a target="_blank"
                               href="https://hub.docker.com/r/${this._configMetadata[0].dImg.split(':')[0]}/tags">
                                <code>${this._configMetadata[0].dImg}</code>
                            </a>
                        </td>
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
                        <td>
                            <a target="_blank"
                               href="https://hub.docker.com/r/${this._configMetadata[0].dImg.split(':')[0]}/tags">
                                <code>${this._calibrationMetadata[0].dImg}</code>
                            </a>
                        </td>
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
            ${this._model.hasPurpose && this._model.hasPurpose.length > 0 ? html`
            <wl-title level="2" style="font-size: 16px;">Model purpose:</wl-title>
            <ul style="margin-top: 5px">
                ${this._model.hasPurpose.map((p:string) => html`<li>${capitalizeFirstLetter(p)}.</li>`)}
            </ul>`:''}

            ${this._model.hasAssumption && this._model.hasAssumption.length > 0 ? html`
            <wl-title level="2" style="font-size: 16px;">Assumptions:</wl-title>
            <ul style="margin-top: 5px">
                ${this._model.hasAssumption.map((a:string) => a.split('.').map((txt:string) => 
                html`<li>${txt}.</li>`
                ))}
            </ul>`
            :''}
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

            ${this._config ? this._renderConfigResume() : ''}
            ${this._renderRelatedModels()}
            ${this._renderGallery()}`
    }
    /* HTML description are not working 
                    <details>
                        <summary>${this._indices[0].label}</summary>
                        <div id="indice-description"></div>
                    </details>
                    */

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
                ${this._setup? this._renderSetupResume() : ''}
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
                            <span class="tooltip nm" style="text-align: center;"
                                tip="${paramFixed} parameters have been pre-selected in this setup">
                            ${ (paramLen - paramFixed) + '/' + paramLen }
                            </span>
                        </div>
                    </div>
                    <div class="button-preview" @click=${() => this._changeTab('io')}>
                        <div>Input files</div>
                        <div>
                            <span class="tooltip nm" style="text-align: center;"
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
                            ${this._renderAuthors(this._setup.author, true)}
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
            ${(this._parameters)? this._renderParametersTable() : html``}
            ${(!this._inputs || this._inputs.length > 0 || !this._outputs || this._outputs.length > 0) ? html`
            <wl-title level="3"> Files: </wl-title> 
            <wl-text style="font-style: italic; padding-left: 20px;">
                Look at the Variables tab to see more information about the contents of the inputs and outputs.
            </wl-text>
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
                        <td><span class="monospaced"> 
                            ${io.label}
                        </span></td>
                        <td>${io.desc}</td>
                        ${this._calibration? html`
                        <td style="text-align: right;">${io.fixedValueURL ? 
                            io.fixedValueURL.split(/ *, */).map((url, i) => (i != 0) ? html`
                            <br/>
                            <a target="_blank" href="${url}">${url.split('/').pop()}</a>
                            ` : html`
                            <a target="_blank" href="${url}">${url.split('/').pop()}</a>
                            `)
                            : html`<span style="color:#999999;">-</span>`}</td>
                        ` : html``}
                        <td style="text-align: right;" class="number">${io.format}</td>
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
                        <td><span class="monospaced">
                            ${io.label}
                        </span></td>
                        <td colspan="${this._calibration? 2 : 1}">${io.desc}</td>
                        <td style="text-align: right;" class="number">${io.format}</td>
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
                <wl-title level="3"> Parameters: </wl-title> 
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
                            <span class="tooltip" tip="If a value is not set up in this field configuration default value will be used.">
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

    _renderTabExample () {
        return html`<div id="mk-example"></div>`
    }

    _renderTabVariables () {
        return html`<div id="hack">${this._count}</div>
            ${(this._inputs && this._inputs.length > 0) ? html`
            <wl-title level="3">Inputs:</wl-title>
            ${this._inputs.map(input => html`
            <wl-expansion id="${input.label}" name="groupInput" @click="${()=>{this.expandIO(input.uri)}}" style="overflow-y: hidden;">
                <span slot="title">
                    ${input.label}
                </span>
                <span slot="description">
                    ${input.desc}
                </span>
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
                                <td style="word-wrap: break-word;">
                                    <a class="monospaced link" target="_blank" href="${v.snURI}">${v.sn}</a>
                                </td>
                                <td style="min-width: 80px;">${v.unit}</td>
                            </tr>`)}
                        </tbody>
                    </table>`
                    : html`
                    <div class="text-centered"><h4>
                        There is no description available for the variables in this file.
                    </h4></div>
                    `
                }`
                : html`<div class="text-centered"><wl-progress-spinner></wl-progress-spinner></div>`}
            </wl-expansion>`)}`
            : html``}

            ${(this._outputs && this._outputs.length > 0) ? html`
            <wl-title level="3">Outputs:</wl-title>
            ${this._outputs.map(output => html`
            <wl-expansion id="${output.label}" name="groupOutput" @click="${()=>{this.expandIO(output.uri)}}" style="overflow-y: hidden;">
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
                                <td style="word-wrap: break-word;">
                                    <a class="monospaced link" target="_blank" href="${v.snURI}">${v.sn}</a>
                                </td>
                                <td style="min-width: 80px;">${v.unit}</td>
                            </tr>`)}
                        </tbody>
                    </table>`
                    : html`
                    <div class="text-centered"><h4>
                        There is no description available for the variables in this file.
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

    _renderRelatedModels () {
        return html`
        ${(this._compModels && this._compModels.length > 0)? html`
        <wl-title level="2" style="font-size: 16px;">Related models:</wl-title>
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
        </table>`:''}`
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
                if (sv.source) newItem['source'] = {label: sv.source.split('/').pop(), url: sv.source};
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
                <wl-title level="2" style="font-size: 16px;">Gallery:</wl-title>
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

    updated (a) {
        if (this._shouldUpdateConfigs) this._updateConfigSelector();
        if (this._shouldUpdateSetups) this._updateSetupSelector();
        /*if (this._model) {
            if (this._versions) {
                this._updateConfigSelector();
                //this._updateCalibrationSelector();
            }
            /*if (this._tab == 'example' && this._model.example) {
                let example = this.shadowRoot.getElementById('mk-example');
                if (example) {
                    example.innerHTML = marked(this._model.example);
                }
            }*
        }
        /* HTML description are not working
        if (this._tab == 'overview' && this._model && this._model.indices && this._indices && this._indices.length > 0) {
            let indiceDesc = this.shadowRoot.getElementById('indice-description');
            if (indiceDesc) {
                indiceDesc.innerHTML = this._indices[0].description;
            }
        }*/
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

    _clear () {
        this._loading = {} as IdMap<boolean>;
        this._logo! = null;
        this._authors = {} as IdMap<Person>;
        this._regions = {} as IdMap<Region>;
        this._funding = {} as IdMap<Funding>;
        this._organizations = {} as IdMap<Organization>;
        this._modelRegions = null;
    }

    firstUpdated() {
        this._loadingGlobals = true;
        this._loadingRegions = true;
        let rVer = store.dispatch(versionsGet());
        let rCfg = store.dispatch(modelConfigurationsGet());
        let rSet = store.dispatch(modelConfigurationSetupsGet());
        let rReg = store.dispatch(regionsGet());
        rVer.then((versions:SoftwareVersion[]) => this._shouldUpdateConfigs = true);
        rCfg.then((cfg:ModelConfiguration[]) => this._shouldUpdateConfigs = true);
        rSet.then((cfg:ModelConfigurationSetup[]) => this._shouldUpdateSetups = true);
        rReg.then((region:Region[]) => this._loadingRegions = false);

        Promise.all([rVer, rCfg, rSet, rReg]).then(() => {
            this._loadingGlobals = false;
            this.stateChanged(store.getState());
        });
    }

    stateChanged(state: RootState) {
        super.setRegion(state);
        let ui = state.explorerUI;
        let db = state.modelCatalog;

        // check whats changed
        let modelChanged : boolean = ui && (ui.selectedModel !== this._selectedModel);
        let versionChanged : boolean = ui && (modelChanged || ui.selectedVersion !== this._selectedVersion);
        let configChanged : boolean = ui && (versionChanged || ui.selectedConfig !== this._selectedConfig);
        let setupChanged : boolean = ui && (ui.selectedCalibration !== this._selectedSetup);
        /*console.log('models', modelChanged,[ui.selectedModel, this._selectedModel]);
        console.log('version', versionChanged, [ui.selectedVersion, this._selectedVersion]);
        console.log('config', configChanged, [ui.selectedConfig, this._selectedConfig]);
        console.log('setup', setupChanged, [ui.selectedCalibration, this._selectedSetup]);*/
        if (db) {
            this._versions = db.versions;
            this._configs = db.configurations;
            this._setups = db.setups;
            this._regions = db.regions;

            if (modelChanged) {
                this._selectedModel = ui.selectedModel;
                this._model = null;
                if (!this._selectedModel) {
                    this._clear();
                    return;
                }
                this._loading[this._selectedModel] = true;
                store.dispatch(modelGet(this._selectedModel)).then((model:Model) => {
                    this._loading[this._selectedModel] = false;
                    this._model = model;
                    this._modelRegions = null;

                    // Logo
                    this._logo = null;
                    if (this._model.logo && this._model.logo.length > 0) {
                        let logoId = (this._model.logo[0] as Image).id;
                        if (db.images[logoId]) {
                            this._logo = db.images[logoId];
                        } else {
                            this._loading[logoId] = true;
                            store.dispatch(imageGet(logoId)).then((logo: Image) => {
                                this._loading[logoId] = false;
                                this._logo = logo;
                            });
                        }
                    }

                    // Authors
                    this._loadAuthors(this._model.author, db);
                    //Funding and all its organizations
                    this._loadFundings(this._model.hasFunding, db);
                });
            }

            if (versionChanged) {
                this._version = null;
                if (ui.selectedVersion) {
                    if (db.versions[ui.selectedVersion]) {
                        this._selectedVersion = ui.selectedVersion;
                        this._version = db.versions[ui.selectedVersion];
                    }
                } else {
                    this._selectedVersion = ui.selectedVersion;
                }
            }

            if (configChanged) {
                this._config = null;
                if (ui.selectedConfig) {
                    if (db.configurations[ui.selectedConfig]) {
                        this._selectedConfig = ui.selectedConfig;
                        this._config = db.configurations[this._selectedConfig];
                        this._shouldUpdateConfigs = true;
                        //--
                        this._loadAuthors(this._config.author, db);
                        this._loadFundings(this._config.hasFunding, db);
                        this._loadTimeIntervals(this._config.hasOutputTimeInterval, db);
                        this._loadGrids(this._config.hasGrid, db);
                        this._loadProcesses(this._config.hasProcess, db);
                    } 
                } else {
                    this._selectedConfig = ui.selectedConfig;
                }
            }

            if (setupChanged) {
                //This part uses setupGetAll
                this._setup = null;
                this._selectedSetup = ui.selectedCalibration;
                if (this._selectedSetup) {
                    this._loading[this._selectedSetup];
                    setupGetAll(this._selectedSetup).then((setup:ModelConfigurationSetup) => {
                        // Save authors 
                        (setup.author || []).forEach((author:Person|Organization) => {
                            if (author.type === "Person") {
                                this._authors[author.id] = author;
                            } else if (author.type === "Organization") {
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
                        this._setup = setup;
                        console.log('all', setup);
                    })
                }

                /*if (ui.selectedCalibration) {
                    if (db.setups[ui.selectedCalibration]) {
                        this._selectedSetup = ui.selectedCalibration;
                        this._setup = db.setups[this._selectedSetup];
                        this._shouldUpdateSetups = true;
                        //--
                        this._loadAuthors(this._setup.author, db);
                        this._loadFundings(this._setup.hasFunding, db);
                        this._loadTimeIntervals(this._setup.hasOutputTimeInterval, db);
                        this._loadGrids(this._setup.hasGrid, db);
                        this._loadProcesses(this._setup.hasProcess, db);
                    }
                } else {
                    this._selectedSetup = ui.selectedCalibration;
                }*/
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
                                    .map((region:Region) => db.regions[region.id])
                                    .forEach((region:Region) => regions.add(region.id));
                                (cfg.hasSetup || [])
                                    .map((setup:ModelConfigurationSetup) => this._setups[setup.id])
                                    .forEach((setup:ModelConfigurationSetup) => {
                                        (setup.hasRegion || [])
                                            .map((region:Region) => db.regions[region.id])
                                            .forEach((region:Region) => regions.add(region.id));
                                    });
                            });
                    });
                this._modelRegions = Array.from(regions);
            }
        }
    }

    private _loadAuthors (authorArr: (Person|Organization)[], db: any) {
        (authorArr || []).forEach((author:Person|Organization) => {
            if (author.type === "Person") {
                if (db.persons[author.id]) {
                    this._authors[author.id] = db.persons[author.id];
                } else {
                    this._loading[author.id] = true;
                    store.dispatch(personGet(author.id)).then((person:Person) => {
                        this._loading[author.id] = false;
                        this._authors[author.id] = person;
                        this.requestUpdate();
                    });
                }
            } else if (author.type === "Organization") {
                if (db.organizations[author.id]) {
                    this._organizations[author.id] = db.organizations[author.id];
                } else {
                    this._loading[author.id] = true;
                    store.dispatch(organizationGet(author.id)).then((organization:Organization) => {
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
        return (authorArray || []).map((author:Person|Organization) => {
            if (this._loading[author.id]) {
                return html`${getId(author)} <loading-dots style="--width: 20px"></loading-dots>&nbsp;`
            } else {
                if (author.type === "Person") {
                    return html`<span class="resource author">${getLabel(this._authors[author.id])}</span>`
                } else if (author.type === "Organization") {
                    return html`<span class="resource organization">${getLabel(this._organizations[author.id])}</span>`
                } else {
                    return html`<span class="resource">${getId(author)}</span>`
                }
            }
        });
    }

    private _loadFundings (fundArray: FundingInformation[], db: any) {
        if (fundArray && fundArray.length > 0) {
            Promise.all(
                fundArray.map((fund:FundingInformation) => {
                    if (db.fundingInformations[fund.id]) {
                        this._funding[fund.id] = db.fundingInformations[fund.id];
                        (this._funding[fund.id].fundingSource || []).forEach((org:Organization) => {
                            this._loading[org.id] = true;
                        });
                        return Promise.resolve(this._funding[fund.id]);
                    } else {
                        this._loading[fund.id] = true;
                        let req = store.dispatch(fundingInformationGet(fund.id));
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
                        if (db.organizations[org.id]) {
                            this._organizations[org.id] = db.organizations[org.id];
                            this._loading[org.id] = false;
                        } else {
                            store.dispatch(organizationGet(org.id)).then((organization:Organization) => {
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
            : (this._funding[fund.id].fundingSource || []).map((org:Organization) => 
                this._loading[org.id] ? 
                html`${getId(org)} <loading-dots style="--width: 20px"></loading-dots>&nbsp;`
                : html`<span class="resource organization">
                    ${getLabel(this._organizations[org.id])}
                </span>`)
            );
    }

    private _loadTimeIntervals (tiArr: TimeInterval[], db: any) {
        (tiArr || []).forEach((ti:TimeInterval) => {
            if (db.timeIntervals[ti.id]) {
                this._timeIntervals[ti.id] = db.timeIntervals[ti.id];
            } else {
                this._loading[ti.id] = true;
                store.dispatch(timeIntervalGet(ti.id)).then((ti:TimeInterval) => {
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
                <div style="display: flex; justify-content: space-between;">
                    <span style="text-decoration: underline;">${getLabel(this._timeIntervals[ti.id])}</span>
                    <span style="margin-left:20px;">
                        ${this._timeIntervals[ti.id].intervalValue}
                        ${this._timeIntervals[ti.id].intervalUnit && this._timeIntervals[ti.id].intervalUnit.length > 0 ? 
                            getLabel(this._timeIntervals[ti.id].intervalUnit[0]) : ''}
                    </span>
                </div>
                <div style="font-style: oblique; color: gray;">${this._timeIntervals[ti.id].description}</div>
            </span>`
    }

    private _loadGrids (gridArr: Grid[], db: any) {
        (gridArr || []).forEach((grid:Grid) => {
            if (db.grids[grid.id]) {
                this._grids[grid.id] = db.grids[grid.id];
            } else {
                this._loading[grid.id] = true;
                store.dispatch(gridGet(grid.id)).then((grid:Grid) => {
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
                    <span style="text-decoration: underline;">${getLabel(this._grids[grid.id])}</span>
                    <span style="margin-left:20px; font-style: oblique; color: gray;">
                        ${this._grids[grid.id].type.filter(t => t != 'Grid')}
                    </span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>
                        <span>Spatial resolution:</span>
                        <span class="monospaced">
                            ${this._grids[grid.id].hasSpatialResolution && this._grids[grid.id].hasSpatialResolution.length > 0 ?
                                this._grids[grid.id].hasSpatialResolution[0] : '-'}
                        </span>
                    </span>
                        <span>Dimensions:</span>
                        <span class="number">
                            ${this._grids[grid.id].hasDimension && this._grids[grid.id].hasDimension.length > 0 ?
                                this._grids[grid.id].hasDimension[0] : '-'}
                        </span>
                    <span>
                    </span>
                    <span>
                        <span>Shape:</span>
                        <span class="monospaced">
                            ${this._grids[grid.id].hasShape && this._grids[grid.id].hasShape.length > 0 ?
                                this._grids[grid.id].hasShape[0] : '-'}
                        </span>
                    </span>
                </div>
            </span>`
    }

    private _loadProcesses (processArr: Process[], db: any) {
        (processArr || []).forEach((process:Process) => {
            if (db.processes[process.id]) {
                this._processes[process.id] = db.processes[process.id];
            } else {
                this._loading[process.id] = true;
                store.dispatch(processGet(process.id)).then((process:Process) => {
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

}
