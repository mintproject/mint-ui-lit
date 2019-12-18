import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from '../../app/actions';
import { renderNotifications } from "../../util/ui_renders";
import { showNotification } from "../../util/ui_functions";
import { ExplorerStyles } from './model-explore/explorer-styles'

import './configure/configuration';
import './configure/setup';
import './configure/new-setup';
import './configure/parameter';
import './models-tree'

import { fetchIOAndVarsSNForConfig, fetchAuthorsForModelConfig, fetchParametersForConfig,
         fetchMetadataNoioForModelConfig, addParameters, addCalibration, addMetadata,
         addInputs, addAuthor } from '../../util/model-catalog-actions';
import { parameterGet, processesGet, regionsGet } from 'model-catalog/actions';

import { showDialog, hideDialog } from 'util/ui_functions';

import "weightless/slider";
import "weightless/progress-spinner";
import "weightless/tab";
import "weightless/tab-group";
import '../../components/loading-dots'

const sortByPosition = (a,b) => {
    let intA = Number(a.position);
    let intB = Number(b.position);
    return (intA < intB) ? -1 : (intA > intB? 1 : 0);
}

@customElement('models-configure')
export class ModelsConfigure extends connect(store)(PageViewElement) {
    @property({type: Boolean})
    private _hideModels : boolean = false;

    @property({type: Boolean})
    private _editing : boolean = false;

    @property({type: Boolean})
    private _creating : boolean = false;

    @property({type: Object})
    private _regions : any = null;

    @property({type: Object})
    private _models : any = null;

    @property({type: Object})
    private _versions : any = null;

    @property({type: Object})
    private _configs : any = null;

    @property({type: Object})
    private _model: any = null;

    @property({type: Object})
    private _version: any = null;

    @property({type: Object})
    private _config: any = null;

    @property({type: Object})
    private _setup: any = null;

    @property({type: Object})
    private _configParameters : any = {};

    @property({type: Object})
    private _setupParameters : any = null;

    @property({type: Object})
    private _configMetadata : any = null;

    @property({type: Object})
    private _setupMetadata : any = null;

    @property({type: Object})
    private _configAuthors : any = null;

    @property({type: Object})
    private _setupAuthors : any = null;

    @property({type: Object})
    private _configInputs : any = null;

    @property({type: Object})
    private _setupInputs : any = null;

    private _url : string = '';
    private _selectedModel : string = '';
    private _selectedVersion : string = '';
    private _selectedConfig : string = '';
    private _selectedSetup : string = '';

    static get styles() {
        return [ExplorerStyles,
            css `
            .cltrow wl-button {
                padding: 2px;
            }

            .card2 {
                margin: 0px;
                left: 0px;
                right: 0px;
                padding: 10px;
                padding-top: 5px;
                height: calc(100% - 40px);
                background: #FFFFFF;
            }

            .twocolumns {
                position: absolute;
                top: 120px;
                bottom: 25px;
                left: 25px;
                right: 25px;
                display: flex;
                border: 1px solid #F0F0F0;
            }

            .left {
                width: 30%;
                padding-top: 0px;
                border-right: 1px solid #F0F0F0;
                padding-right: 5px;
                overflow: auto;
                height: 100%;
            }

            .left_closed {
                width: 0px;
                overflow: hidden;
            }

            .right, .right_full {
                width: 70%;
                padding-top: 0px;
                overflow: auto;
                height: 100%;
            }

            .right_full {
                width: 100%;
            }

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

            .inline-new-button {
                line-height: 1.2em;
                font-size: 1.2em;
            }

            .inline-new-button > wl-icon {
                --icon-size: 1.2em;
                vertical-align: top;
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

            .custom-button {
                line-height: 20px;
                cursor: pointer;
                margin-right: 5px;
                border: 1px solid green;
                padding: 1px 3px;
                border-radius: 4px;
            }

            .custom-button:hover {
                background-color: rgb(224, 224, 224);
            }
            `,
            SharedStyles
        ];
    }

    protected render() {
        return html`
        <div class="twocolumns">
            <div class="${this._hideModels ? 'left_closed' : 'left'}">
                <div class="clt">
                    <wl-title level="4" style="margin: 4px; padding: 10px;">Models:</wl-title>
                    <models-tree active></models-tree>
                </div>
            </div>

            <div class="${this._hideModels ? 'right_full' : 'right'}">
                <div class="card2">
                    <wl-icon @click="${() => this._hideModels = !this._hideModels}"
                        class="actionIcon bigActionIcon" style="float:right">
                        ${!this._hideModels ? "fullscreen" : "fullscreen_exit"}
                    </wl-icon>
                    ${this._selectedConfig && !this._creating ? html`
                    <span style="float:right;" class="custom-button" @click="${this._goToCatalog}">See on catalog</span>
                    `: ''}
                    <div class="cltrow_padded">
                        <div class="cltmain">
                            <wl-title level="3" style="margin: 0px">
                                ${this._creating ? 'Creating a new ' + (this._config ? 'setup' : 'configuration') + ' for ' 
                                : (this._editing ? 'Editing ': '')}
                                ${this._setup ? 
                                    this._setup.label 
                                    : (this._config ? 
                                        this._config.label 
                                        : (this._version ? this._version.label : 'Select a model configuration or setup on the left panel.')
                                )}
                            </wl-title>
                            ${!this._version ? html`
                            <wl-text>
                                You can create custom configurations of a model, by fixing parameter 
                                values or input datasets or by constraining the ranges that parameters can take.
                            </wl-text>
                            <wl-title level="4">
                                Select a model from the left panel, and edit the parameters and files accordingly.
                            </wl-title>
                            ` :''}
                        </div>
                    </div>

                    ${this._config || this._setup ? html`<div style="font-size: 13px; padding: 0px 10px;">
                        <p>
                            Model configurations are customizations of the model that use a subset of all the processes
                            and functions that are possible with the general model software.
                            Model set ups are manual configurations of a model for a specific geographical area or region,
                            where some of the input data or parameters are constrained or fixed.
                        </p>
                        <p>
                            You can create a new model set up or do further customization of an existing one by editing
                            the parameters to constrain their values further or to set defaults, fix input data files 
                            by providing a URL to them, and edit the descriptions of the model configuration to reflect the changes.
                        </p>
                    </div>` : ''}
                    <div style="padding: 0px 10px;">
                        <models-configure-configuration class="page" ?active="${this._selectedConfig && !this._selectedSetup && !this._creating}"></models-configure-configuration>
                        <models-configure-setup class="page" ?active="${this._selectedSetup && !this._creating}"></models-configure-setup>
                        <models-new-setup class="page" ?active="${this._selectedConfig && this._creating}"></models-new-setup>
                    </div>
                </div>
            </div>
        </div>
        ${renderNotifications()}
        `
    }

    private _goToCatalog () {
        let url = 'models/explore/' 
                + this._selectedModel.split('/').pop() + '/' 
                + this._selectedVersion.split('/').pop() + '/' 
                + this._selectedConfig.split('/').pop();
        if (this._selectedSetup) url += '/' + this._selectedSetup.split('/').pop();
        goToPage(url)
    }

    private _configParametersLoading : Set<string> = new Set();

    firstUpdated () {
        store.dispatch(processesGet());
        store.dispatch(regionsGet());
    }

    stateChanged(state: RootState) {
        if (state.explorerUI) {
            let ui = state.explorerUI;
            // check whats changed
            let modelChanged : boolean = (ui.selectedModel !== this._selectedModel);
            let versionChanged : boolean = (modelChanged || ui.selectedVersion !== this._selectedVersion)
            let configChanged : boolean = (versionChanged || ui.selectedConfig !== this._selectedConfig);
            let calibrationChanged : boolean = (configChanged || ui.selectedCalibration !== this._selectedSetup);
            this._editing = (ui.mode === 'edit');
            this._creating = (ui.mode === 'new');

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
                this._configMetadata = null;
                this._configAuthors = null;
                this._configParameters = {};
                this._configParametersLoading = new Set();
                this._configInputs = null;
            }
            if (calibrationChanged) {
                this._selectedSetup = ui.selectedCalibration;
                this._setup = null;
                this._setupMetadata = null;
                this._setupAuthors = null;
                this._setupParameters = null;
                this._setupInputs = null;
            }

            if (state.modelCatalog) {
                let db = state.modelCatalog;
                this._models = db.models;
                this._versions = db.versions;
                this._configs = db.configurations;
                this._regions = db.regions;

                // Set selected resource
                if (!this._model && db.models && this._selectedModel && db.models[this._selectedModel]) {
                    this._model = db.models[this._selectedModel];
                }
                if (!this._version && db.versions && this._selectedVersion && db.versions[this._selectedVersion]) {
                    this._version = db.versions[this._selectedVersion];
                }
                if (db.configurations) {
                    if (!this._config && this._selectedConfig && db.configurations[this._selectedConfig]) {
                        this._config = db.configurations[this._selectedConfig];
                    }
                    if (!this._setup && this._selectedSetup && db.configurations[this._selectedSetup]) {
                        this._setup = db.configurations[this._selectedSetup];
                    }
                }
            }
        }
    }
}
