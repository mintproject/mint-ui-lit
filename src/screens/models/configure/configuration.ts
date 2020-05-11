import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../model-explore/explorer-styles'

import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';

import { renderNotifications } from "util/ui_renders";
import { showNotification, showDialog, hideDialog } from 'util/ui_functions';

import { personGet, personPost, modelConfigurationPut, modelConfigurationGet,
         parameterGet, datasetSpecificationGet, gridGet,
         timeIntervalGet, processGet, softwareImageGet, } from 'model-catalog/actions';
import { getURL, getLabel } from 'model-catalog/util';
import { renderExternalLink } from 'util/ui_renders';

import "weightless/progress-spinner";
import 'components/loading-dots'

import './grid';
import './time-interval';
import './person';
import './process';
import './parameter';
import './dataset-specification';

import './resources/time-interval';
import './resources/grid';

import { ModelCatalogTimeInterval } from './resources/time-interval';
import { ModelCatalogGrid } from './resources/grid';

import { ModelsConfigureGrid } from './grid';
import { ModelsConfigureTimeInterval } from './time-interval';
import { ModelsConfigurePerson } from './person';
import { ModelsConfigureProcess } from './process';
import { ModelsConfigureParameter } from './parameter';
import { ModelsConfigureDatasetSpecification } from './dataset-specification';
import { ModelConfiguration } from '@mintproject/modelcatalog_client';

@customElement('models-configure-configuration')
export class ModelsConfigureConfiguration extends connect(store)(PageViewElement) {
    @property({type: Boolean})
    private _loading : boolean = false;

    @property({type: Object})
    private _config : ModelConfiguration;

    @property({type: Boolean})
    private _editing : boolean = false;

    private _inputTimeInterval : ModelCatalogTimeInterval;
    private _inputGrid : ModelCatalogGrid;

    private _rendered : boolean = false;

    private _selectedModel : string = '';
    private _selectedVersion : string = '';
    private _selectedConfig : string = '';

    static get styles() {
        return [ExplorerStyles, SharedStyles, css`
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

        `];
    }

    protected render() {
        return html`
            <span id="dummy-head"/>
            ${this._loading ?
                    html`<div style="text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`
                    : ""}
            <div style="visibility: ${this._loading ? 'hidden' : 'visible'}">
                ${this._renderForm()}
            </div>
        `;
    }

    private _scrollUp () {
        let head = this.shadowRoot.getElementById('dummy-head');
        if (head) head.scrollIntoView({behavior: "smooth", block: "start"})
    }

    private _renderForm () {
        let keywords : string = "";
        if (this._config && this._config.keywords) {
            keywords = this._config.keywords[0].split(/ *; */).join(', ');
        }

        return html`
        <table class="details-table">
            <colgroup width="150px">
            <tr>
                ${this._editing ? html`
                <td colspan="2" style="padding: 5px 20px;">
                    <wl-textfield id="form-config-name" label="Configuration name" 
                                  value="${this._config ? getLabel(this._config) : ''}" required></wl-textfield>
                </td>` : ''}
            </tr>

            <tr>
                <td>Description:</td>
                <td>
                    ${this._editing ? html`
                    <textarea id="form-config-desc" name="description" rows="5">${this._config ? this._config.description[0] : ''}</textarea>`
                    : (this._config ? this._config.description[0] : '')}
                </td>
            </tr>

            <tr>
                <td>Keywords:</td>
                <td>
                    ${this._editing ? html`
                    <input id="form-config-keywords" type="text" value="${keywords}"/>
                    ` : keywords}
                </td>
            </tr>

            <tr>
                <td>Configuration creator:</td>
                <td>
                    TODO
                </td>
            </tr>

            <tr>
                <td>Software Image:</td>
                <td>
                    TODO
                </td>
            </tr>

            <tr>
                <td>Component Location:</td>
                <td>
                    ${this._editing ? html`
                    <textarea id="form-config-comp-loc">${this._config ? this._config.hasComponentLocation : ''}</textarea>`
                    : (this._config ? renderExternalLink(this._config.hasComponentLocation) : '')}
                </td>
            </tr>

            <tr>
                <td>Grid:</td>
                <td>
                    <model-catalog-grid id="mcgrid"></model-catalog-grid>
                </td>
            </tr>

            <tr>
                <td>Time interval:</td>
                <td>
                    <model-catalog-time-interval id="mcti"></model-catalog-time-interval>
                </td>
            </tr>
        </table>

        ${this._editing? html`
        <div style="float:right; margin-top: 1em;">
            <wl-button @click="${this._onCancelButtonClicked}" style="margin-right: 1em;" flat inverted>
                <wl-icon>cancel</wl-icon>&ensp;Discard changes
            </wl-button>
            <wl-button @click="">
                <wl-icon>save</wl-icon>&ensp;Save
            </wl-button>
        </div>` 
        :html`
        <div style="float:right; margin-top: 1em;">
            <wl-button @click="${this._onEditButtonClicked}">
                <wl-icon>edit</wl-icon>&ensp;Edit
            </wl-button>
        </div>`}
        `
    }

    private _onEditButtonClicked () {
        this._scrollUp();
        let url = getURL(this._selectedModel, this._selectedVersion, this._selectedConfig);
        goToPage('models/configure/' + url + '/edit');
    }

    private _onCancelButtonClicked () {
        this._scrollUp();
        let url = getURL(this._selectedModel, this._selectedVersion, this._selectedConfig);
        goToPage('models/configure/' + url);
    }

    protected firstUpdated () {
        this._inputTimeInterval =  this.shadowRoot.getElementById('mcti') as ModelCatalogTimeInterval;
        this._inputGrid = this.shadowRoot.getElementById('mcgrid') as ModelCatalogGrid;
        this._rendered = true;
        if (this._config) {
            this._initializeForm();
        }
        if (this._editing) {
            this._setEditingInputs();
        }
    }

    private _initializeForm () {
        console.log('initializing form...', this._config);
        if (this._config.hasOutputTimeInterval) this._inputTimeInterval.setResources( this._config.hasOutputTimeInterval );
    }

    private _setEditingInputs () { //TODO types...
        this._inputTimeInterval.setActionSelect();
        this._inputGrid.setActionMultiselect();
        /*let inputs = [this._inputTimeInterval];
        inputs.forEach((input) => {
            input.setActionSelect();
        });*/
    }

    private _unsetEditingInputs () {
        let inputs = [this._inputTimeInterval, this._inputGrid];
        inputs.forEach((input) => {
            input.unsetAction();
        });
    }

    stateChanged(state: RootState) {
        if (state.explorerUI && state.modelCatalog) {
            let ui = state.explorerUI;
            let db = state.modelCatalog;

            // Set edit mode
            let newEditState : boolean = (ui.mode === 'edit');
            if (newEditState != this._editing) {
                this._editing = newEditState;
                if (this._rendered) {
                    if (this._editing) this._setEditingInputs();
                    else this._unsetEditingInputs();
                }
            }

            // Load config
            if (ui.selectedConfig != this._selectedConfig) {
                console.log('selected config has changed');
                this._selectedModel = ui.selectedModel;
                this._selectedVersion = ui.selectedVersion;
                this._selectedConfig = ui.selectedConfig;
                if (this._selectedConfig) {
                    //LOAD new data
                    if (db.configurations[this._selectedConfig]) {
                        this._config = db.configurations[this._selectedConfig];
                        if (this._rendered) this._initializeForm();
                    } else {
                        this._loading = true;
                        store.dispatch(modelConfigurationGet(this._selectedConfig)).then((config:ModelConfiguration) => {
                            this._loading = false;
                            this._config = config;
                            if (this._rendered) this._initializeForm();
                        });
                    }
                }
            }
        }
    }
}
