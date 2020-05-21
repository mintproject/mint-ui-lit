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
         modelConfigurationPost, versionGet, versionPut,
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
import './resources/person';
import './resources/software-image';
import './resources/grid';
import './resources/process';
import './resources/parameter';
import './resources/dataset-specification';
import './resources/region';

import { ModelCatalogTimeInterval } from './resources/time-interval';
import { ModelCatalogPerson } from './resources/person';
import { ModelCatalogProcess } from './resources/process';
import { ModelCatalogSoftwareImage } from './resources/software-image';
import { ModelCatalogGrid } from './resources/grid';
import { ModelCatalogParameter } from './resources/parameter';
import { ModelCatalogDatasetSpecification } from './resources/dataset-specification';
import { ModelCatalogRegion } from './resources/region';

import { ModelsConfigureGrid } from './grid';
import { ModelsConfigureTimeInterval } from './time-interval';
import { ModelsConfigurePerson } from './person';
import { ModelsConfigureProcess } from './process';
import { ModelsConfigureParameter } from './parameter';
import { ModelsConfigureDatasetSpecification } from './dataset-specification';
import { ModelConfiguration, ModelConfigurationFromJSON } from '@mintproject/modelcatalog_client';

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('models-new-config')
export class ModelsNewConfig extends connect(store)(PageViewElement) {
    @property({type: Boolean})
    private _loading : boolean = false;

    @property({type: Object})
    private _config : ModelConfiguration;

    @property({type: Boolean})
    private _editing : boolean = false;

    private _inputTimeInterval : ModelCatalogTimeInterval;
    private _inputPerson : ModelCatalogPerson;
    private _inputProcess : ModelCatalogProcess;
    private _inputSoftwareImage : ModelCatalogSoftwareImage;
    private _inputGrid : ModelCatalogGrid;
    private _inputParameter : ModelCatalogParameter;
    private _inputDSInput : ModelCatalogDatasetSpecification;
    private _inputDSOutput : ModelCatalogDatasetSpecification;
    private _inputRegion : ModelCatalogRegion;

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
            <div>
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
                <td colspan="2" style="padding: 5px 20px;">
                    <wl-textfield id="form-config-name" label="Configuration name" 
                                  value="${this._config ? getLabel(this._config) : ''}" required></wl-textfield>
                </td>
            </tr>

            <tr>
                <td>Category</td>
                <td>
                    <wl-select id="form-config-category" name="Category" required 
                            value="${this._config && this._config.hasModelCategory ? this._config.hasModelCategory[0] : ''}">
                        <option value="">None</option>
                        <option value="Agriculture">Agriculture</option>
                        <option value="Hydrology">Hydrology</option>
                        <option value="Economy">Economy</option>
                        <option value="Weather">Weather</option>
                        <option value="Land Use">Land Use</option>
                    </wl-select>
                </td>
            </tr>

            <tr>
                <td>Full description:</td>
                <td>
                    <textarea id="form-config-desc" name="Description" rows="5">${
                        this._config && this._config.description ? this._config.description[0] : ''
                    }</textarea>
                </td>
            </tr>


            <tr>
                <td>Sort description:</td>
                <td>
                    <textarea id="form-config-short-desc" name="Short description" rows="3">${
                        this._config && this._config.shortDescription ? this._config.shortDescription[0] : ''
                    }</textarea>
                </td>
            </tr>

            <tr>
                <td>Installation instructions:</td>
                <td>
                    <textarea id="form-config-installation" name="Installation instructions" rows="5">${
                        this._config && this._config.hasInstallationInstructions? this._config.hasInstallationInstructions[0] : ''
                    }</textarea>
                </td>
            </tr>

            <tr>
                <td>Keywords:</td>
                <td>
                    <input id="form-config-keywords" type="text" value="${keywords}"/>
                </td>
            </tr>

            <tr>
                <td>Assumptions:</td>
                <td>
                    <textarea id="form-config-assumption" name="Assumptions" rows="3">${
                        this._config && this._config.hasAssumption? this._config.hasAssumption[0] : ''
                    }</textarea>
                </td>
            </tr>

            <tr>
                <td>Website:</td>
                <td>
                    <wl-textfield id="form-config-website" name="Website"
                        value="${this._config && this._config.website ? this._config.website[0] : ''}"></wl-textfield>
                </td>
            </tr>

            <tr>
                <td>Configuration creator:</td>
                <td>
                    <model-catalog-person id="mcperson"></model-catalog-person>
                </td>
            </tr>

            <tr>
                <td>Region</td>
                <td>
                    <model-catalog-region id="mcregion"></model-catalog-region>
                </td>
            </tr>

            <tr>
                <td>Software Image:</td>
                <td>
                    <model-catalog-software-image id="mcswimg"></model-catalog-software-image>
                </td>
            </tr>

            <tr>
                <td>Component Location:</td>
                <td>
                    <textarea id="form-config-comp-loc">${this._config && this._config.hasComponentLocation ? 
                            this._config.hasComponentLocation : ''}</textarea>
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

            <tr>
                <td>Processes</td>
                <td>
                    <model-catalog-process id="mcprocess"></model-catalog-process>
                </td>
            </tr>
        </table>
        <wl-title level="4" style="margin-top:1em">
            Parameters:
        </wl-title>
        <model-catalog-parameter id="mcparameter" .inline="${false}"></model-catalog-parameter>

        <wl-title level="4" style="margin-top:1em">
            Input files:
        </wl-title>
        <model-catalog-dataset-specification id="mcinput" .inline=${false}></model-catalog-dataset-specification>

        <wl-title level="4" style="margin-top:1em">
            Output files:
        </wl-title>
        <model-catalog-dataset-specification id="mcoutput" .inline=${false}></model-catalog-dataset-specification>

        <div style="float:right; margin-top: 1em;">
            <wl-button @click="${this._onSaveButtonClicked}">
                <wl-icon>save</wl-icon>&ensp;Save
            </wl-button>
        </div>` 
    }

    protected firstUpdated () {
        this._inputTimeInterval =  this.shadowRoot.getElementById('mcti') as ModelCatalogTimeInterval;
        this._inputPerson =  this.shadowRoot.getElementById('mcperson') as ModelCatalogPerson;
        this._inputProcess =  this.shadowRoot.getElementById('mcprocess') as ModelCatalogProcess;
        this._inputSoftwareImage =  this.shadowRoot.getElementById('mcswimg') as ModelCatalogSoftwareImage;
        this._inputParameter =  this.shadowRoot.getElementById('mcparameter') as ModelCatalogParameter;
        this._inputDSInput =  this.shadowRoot.getElementById('mcinput') as ModelCatalogDatasetSpecification;
        this._inputDSOutput =  this.shadowRoot.getElementById('mcoutput') as ModelCatalogDatasetSpecification;
        this._inputGrid = this.shadowRoot.getElementById('mcgrid') as ModelCatalogGrid;
        this._inputRegion = this.shadowRoot.getElementById('mcregion') as ModelCatalogRegion;
        this._setEditingInputs();
    }

    private _setEditingInputs () { //TODO types...
        this._inputTimeInterval.setActionSelect();
        this._inputPerson.setActionMultiselect();
        this._inputGrid.setActionSelect();
        this._inputProcess.setActionMultiselect();
        this._inputSoftwareImage.setActionSelect();
        this._inputParameter.setActionEditOrAdd();
        this._inputDSInput.setActionEditOrAdd();
        this._inputDSOutput.setActionEditOrAdd();
        this._inputRegion.setActionMultiselect();
        /*let inputs = [this._inputTimeInterval];
        inputs.forEach((input) => {
            input.setActionSelect();
        });*/
    }

    private _onSaveButtonClicked () {
        console.log('click!');
        let inputName : Textfield = this.shadowRoot.getElementById("form-config-name") as Textfield;
        let inputCategory : Select = this.shadowRoot.getElementById("form-config-category") as Select;
        let inputDesc : HTMLTextAreaElement = this.shadowRoot.getElementById("form-config-desc") as HTMLTextAreaElement;
        let inputShortDesc : HTMLTextAreaElement = this.shadowRoot.getElementById("form-config-short-desc") as HTMLTextAreaElement;
        let inputInstall : HTMLTextAreaElement = this.shadowRoot.getElementById("form-config-installation") as HTMLTextAreaElement;
        let inputKeywords : Textfield = this.shadowRoot.getElementById("form-config-keywords") as Textfield;
        let inputAssumptions : HTMLTextAreaElement = this.shadowRoot.getElementById("form-config-assumption") as HTMLTextAreaElement;
        let inputWebsite : Textfield = this.shadowRoot.getElementById("form-config-website") as Textfield;
        let inputCompLoc : HTMLTextAreaElement = this.shadowRoot.getElementById("form-config-comp-loc") as HTMLTextAreaElement;

        let name        : string = inputName        ? inputName        .value : ''; 
        let category    : string = inputCategory    ? inputCategory    .value : ''; 
        let desc        : string = inputDesc        ? inputDesc        .value : '';    
        let shortDesc   : string = inputShortDesc   ? inputShortDesc   .value : '';    
        let install     : string = inputInstall     ? inputInstall     .value : '';
        let keywords    : string = inputKeywords    ? inputKeywords    .value : '';
        let assumptions : string = inputAssumptions ? inputAssumptions .value : '';
        let website     : string = inputWebsite     ? inputWebsite     .value : '';
        let compLoc     : string = inputCompLoc     ? inputCompLoc     .value : '';   
        
        if (name && category && desc) {
            let jsonObj = {
                //type: ["ModelConfiguration"],
                label: [name],
                description: [desc],
                hasModelCategory: [category],
                hasOutputTimeInterval: this._inputTimeInterval.getResources(),
                author: this._inputPerson.getResources(),
                hasProcess: this._inputProcess.getResources(),
                hasSoftwareImage: this._inputSoftwareImage.getResources(),
                hasParameter: this._inputParameter.getResources(),
                hasInput: this._inputDSInput.getResources(),
                hasOutput: this._inputDSOutput.getResources(),
                hasGrid: this._inputGrid.getResources(),
                hasRegion: this._inputRegion.getResources(),
            };
            if (shortDesc) jsonObj['shortDescription'] = [shortDesc];
            if (install) jsonObj['hasInstallationInstructions'] = [install];
            if (keywords) jsonObj['keywords'] = [keywords];
            if (assumptions) jsonObj['hasAssumption'] = [assumptions];
            if (website) jsonObj['website'] = [website];
            if (compLoc) jsonObj['hasComponentLocation'] = [compLoc];

            let newConfig = ModelConfigurationFromJSON(jsonObj);
            store.dispatch(modelConfigurationPost(newConfig)).then((c:ModelConfiguration) => {
                store.dispatch(versionGet(this._selectedVersion)).then((sv) => {
                    console.log('sv', sv);
                    if (!sv.hasConfiguration) sv.hasConfiguration = [];
                    sv.hasConfiguration.push(c);
                    store.dispatch(versionPut(sv)).then((sv2)=>{
                        console.log('updated!');
                        this._scrollUp();
                        let url = getURL(this._selectedModel, this._selectedVersion, c.id);
                        goToPage('models/configure/' + url);
                    });
                });
            });

        } else {
            if (!name && inputName) (<any>inputName).onBlur();
            if (!category && inputCategory) (<any>inputCategory).onBlur();
            if (!desc && inputDesc) (<any>inputDesc).onBlur();
        }
    }

    stateChanged(state: RootState) {
        if (state.explorerUI) {
            let ui = state.explorerUI;
            this._selectedModel = ui.selectedModel;
            this._selectedVersion = ui.selectedVersion;
        }
    }
}
