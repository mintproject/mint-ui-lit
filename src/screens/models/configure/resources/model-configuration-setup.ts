import { ModelCatalogResource } from './resource';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { modelConfigurationSetupGet, modelConfigurationSetupsGet, modelConfigurationSetupPost, modelConfigurationSetupPut, modelConfigurationSetupDelete } from 'model-catalog/actions';
import { ModelConfiguration, ModelConfigurationSetup, ModelConfigurationSetupFromJSON } from '@mintproject/modelcatalog_client';
import { IdMap } from "app/reducers";
import { renderExternalLink } from 'util/ui_renders';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { ModelCatalogPerson } from './person';
import { ModelCatalogGrid } from './grid';
import { ModelCatalogNumericalIndex } from './numerical-index';
import { ModelCatalogCategory } from './category';
import { ModelCatalogSoftwareImage } from './software-image';
import { ModelCatalogTimeInterval } from './time-interval';
import { ModelCatalogRegion } from './region';
import { ModelCatalogProcess } from './process';

import { ModelCatalogParameter } from './parameter';
import { ModelCatalogDatasetSpecification } from './dataset-specification';

import { goToPage } from 'app/actions';

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('model-catalog-model-configuration-setup')
export class ModelCatalogModelConfigurationSetup extends connect(store)(ModelCatalogResource)<ModelConfigurationSetup> {
    static get styles() {
        return [ExplorerStyles, SharedStyles, this.getBasicStyles(), css`
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

    protected classes : string = "resource setup";
    protected name : string = "setup";
    protected pname : string = "setups";
    protected resourcesGet = modelConfigurationSetupsGet;
    protected resourceGet = modelConfigurationSetupGet;
    protected resourcePut = modelConfigurationSetupPut;
    protected resourceDelete = modelConfigurationSetupDelete;
    protected resourcePost = modelConfigurationSetupPost;

    public pageMax : number = 10

    private _parentConfig : ModelConfigurationSetup;

    private _inputAuthor : ModelCatalogPerson;
    private _inputGrid : ModelCatalogGrid;
    private _inputTimeInterval : ModelCatalogTimeInterval;
    private _inputIndex : ModelCatalogNumericalIndex;
    private _inputCategory : ModelCatalogCategory;
    private _inputRegion : ModelCatalogRegion;
    private _inputProcesses : ModelCatalogProcess;
    private _inputSoftwareImage : ModelCatalogSoftwareImage;

    private _inputParameter : ModelCatalogParameter;
    private _inputDSInput : ModelCatalogDatasetSpecification;

    constructor () {
        super();
    }

    protected _initializeSingleMode () {
        this._inputAuthor = new ModelCatalogPerson();
        this._inputGrid = new ModelCatalogGrid();
        this._inputTimeInterval = new ModelCatalogTimeInterval();
        this._inputIndex = new ModelCatalogNumericalIndex();
        this._inputCategory = new ModelCatalogCategory();
        this._inputRegion = new ModelCatalogRegion();
        this._inputProcesses = new ModelCatalogProcess();
        this._inputSoftwareImage = new ModelCatalogSoftwareImage();

        this._inputParameter = new ModelCatalogParameter();
        this._inputParameter.inline = false;
        this._inputDSInput = new ModelCatalogDatasetSpecification();
        this._inputDSInput.inline = false;

    }

    public setResource (r:ModelConfigurationSetup) {
        let req = super.setResource(r);
        req.then((m:ModelConfigurationSetup) => {
            if (m) {
                this._inputAuthor.setResources(m.author);
                this._inputGrid.setResources(m.hasGrid);
                this._inputTimeInterval.setResources(m.hasOutputTimeInterval);
                this._inputIndex.setResources(m.usefulForCalculatingIndex);
                this._inputCategory.setResources(m.hasModelCategory);
                this._inputRegion.setResources(m.hasRegion);
                this._inputProcesses.setResources(m.hasProcess);
                this._inputSoftwareImage.setResources(m.hasSoftwareImage);

                this._inputParameter.setResources( m.hasParameter );
                this._inputDSInput.setResources( m.hasInput );
            }
        });
        return req;
    }

    protected _editResource (r:ModelConfigurationSetup) {
        super._editResource(r);
        this._setEditingActions();
    }

    private _setEditingActions () {
        this._inputAuthor.setActionMultiselect();
        this._inputGrid.setActionSelect();
        this._inputIndex.setActionMultiselect();
        this._inputCategory.setActionMultiselect();

        this._inputTimeInterval.setActionSelect();
        this._inputRegion.setActionMultiselect();
        this._inputProcesses.setActionMultiselect();
        this._inputSoftwareImage.setActionSelect();

        this._inputParameter.setActionEditOrAdd();
        this._inputDSInput.setActionEditOrAdd();
    }

    protected _clearStatus () {
        super._clearStatus();
        if (this._inputAuthor) this._inputAuthor.unsetAction();
        if (this._inputGrid) this._inputGrid.unsetAction();
        if (this._inputIndex) this._inputIndex.unsetAction();
        if (this._inputCategory) this._inputCategory.unsetAction();
        if (this._inputTimeInterval) this._inputTimeInterval.unsetAction();
        if (this._inputRegion) this._inputRegion.unsetAction();
        if (this._inputProcesses) this._inputProcesses.unsetAction();
        if (this._inputSoftwareImage) this._inputSoftwareImage.unsetAction();

        if (this._inputParameter) this._inputParameter.unsetAction();
        if (this._inputDSInput) this._inputDSInput.unsetAction();
        this.scrollUp();
        this.clearForm();
    }

    public enableSingleResourceCreation (parentConfig:ModelConfiguration) {
        super.enableSingleResourceCreation();

        this._parentConfig = parentConfig;
        if (this._parentConfig) {
            let m = this._parentConfig;
            this._inputAuthor.setResources(m.author);
            this._inputGrid.setResources(m.hasGrid);
            this._inputTimeInterval.setResources(m.hasOutputTimeInterval);
            this._inputIndex.setResources(m.usefulForCalculatingIndex);
            this._inputCategory.setResources(m.hasModelCategory);
            this._inputRegion.setResources(m.hasRegion);
            this._inputProcesses.setResources(m.hasProcess);
            this._inputSoftwareImage.setResources(m.hasSoftwareImage);

            this._inputParameter.setResources( m.hasParameter );
            this._inputDSInput.setResources( m.hasInput );
        }
        this._setEditingActions();
    }

    protected _renderFullResource (r:ModelConfigurationSetup) {
        // Example, Type, operating system, versions?
        return html`
            <table class="details-table">
                <colgroup wir.="150px">
                <!--tr>
                    <td colspan="2" style="padding: 5px 20px;">
                        <wl-title level="3"> {getLabel(r)} </wl-title>
                    </td>
                </tr>

                <tr>
                    <td>Category:</td>
                    <td>
                        {this._inputCategory}
                    </td>
                </tr-->

                ${r.shortDescription ? html`
                <tr>
                    <td>Short description:</td>
                    <td>
                        ${r.shortDescription[0]}
                    </td>
                </tr>` : '' }

                <tr>
                    <td>Description:</td>
                    <td>
                        ${r.description ? r.description[0] : ''}
                    </td>
                </tr>

                <tr>
                    <td>Keywords:</td>
                    <td>
                        ${r.keywords ? r.keywords[0] : ''}
                    </td>
                </tr>

                <tr>
                    <td>Region:</td>
                    <td>
                        ${this._inputRegion}
                    </td>
                </tr>

                <tr>
                    <td>Setup Creator:</td>
                    <td>
                        ${this._inputAuthor}
                    </td>
                </tr>

                <tr>
                    <td>Parameter assignment method:</td>
                    <td>
                        <div style="display: grid; grid-template-columns: auto 36px;">
                            <span style="vertical-align: middle; line-height: 40px; font-size: 16px;">${r.parameterAssignmentMethod}</span>
                            <span tip="Calibrated: The model was calibrated (either manually or automatically) against baseline data.&#10;Expert configured: A modeler did an expert guess of the parameters based on available data." 
                                  id="pam" class="tooltip" style="top: 8px;">
                                <wl-icon style="--icon-size: 24px;">help_outline</wl-icon>
                            </span>
                        </div>
                    </td>
                </tr>

                <tr>
                    <td>SoftwareImage:</td>
                    <td>
                        ${this._inputSoftwareImage}
                    </td>
                </tr>

                <tr>
                    <td>Component Location:</td>
                    <td>
                        ${r && r.hasComponentLocation ? renderExternalLink(r.hasComponentLocation) : ''}
                    </td>
                </tr>

                <tr>
                    <td>Grid:</td>
                    <td>
                        ${this._inputGrid}
                    </td>
                </tr>

                <tr>
                    <td>Time interval:</td>
                    <td>
                        ${this._inputTimeInterval}
                    </td>
                </tr>

                <tr>
                    <td>Processes:</td>
                    <td>
                        ${this._inputProcesses}
                    </td>
                </tr>

                <tr>
                    <td>Useful for calculating index:</td>
                    <td>
                        ${this._inputIndex}
                    </td>
                </tr>

                <tr>
                    <td>Usage notes:</td>
                    <td>
                        ${ r && r.hasUsageNotes ?  r.hasUsageNotes[0] : '' }
                    </td>
                </tr>
            </table>

        <wl-title level="4" style="margin-top:1em">
            Parameters:
        </wl-title>
        ${this._inputParameter}

        <wl-title level="4" style="margin-top:1em">
            Input files:
        </wl-title>
        ${this._inputDSInput}
        `
    }

    public scrollUp () {
        let head = this.shadowRoot.getElementById('page-top');
        if (head) 
            head.scrollIntoView({behavior: "smooth", block: "start"})
    }

    protected _renderFullForm () {
        let edResource = this._getEditingResource();
        return html`
            <div id="page-top"></div>
            <table class="details-table">
                <colgroup width="150px">
                <tr>
                    <td colspan="2" style="padding: 5px 20px;">
                        <wl-textfield id="i-label" label="Model name" 
                                      value="${edResource && edResource.label ? edResource.label[0] : ''}" required></wl-textfield>
                    </td>
                </tr>

                <tr>
                    <td>Category:</td>
                    <td>
                        ${this._inputCategory}
                    </td>
                </tr>

                <tr>
                    <td>Description:</td>
                    <td>
                        <textarea id="i-desc" name="Description" rows="5">${
                            edResource && edResource.description ? edResource.description[0] : ''
                        }</textarea>
                    </td>
                </tr>

                <tr>
                    <td>Keywords:</td>
                    <td>
                        <wl-textfield id="i-keywords" name="Keywords"
                                value="${edResource && edResource.keywords ? edResource.keywords[0] : ''}"></wl-textfield>
                    </td>
                </tr>

                <tr>
                    <td>Region:</td>
                    <td>
                        ${this._inputRegion}
                    </td>
                </tr>

                <tr>
                    <td>Setup Creator:</td>
                    <td>
                        ${this._inputAuthor}
                    </td>
                </tr>

                <tr>
                    <td>Parameter assignment method:</td>
                    <td>
                        <div style="display: grid; grid-template-columns: auto 36px;">
                            <wl-select id="edit-setup-assign-method" label="Parameter assignment method" placeholder="Select a parameter assignament method" required>
                                <option value="" disabled selected>Please select a parameter assignment method</option>
                                <option value="Calibration">Calibration</option>
                                <option value="Expert-configured">Expert tuned</option>
                            </wl-select>
                            <span tip="Calibrated: The model was calibrated (either manually or automatically) against baseline data.&#10;Expert configured: A modeler did an expert guess of the parameters based on available data." 
                                  id="pam" class="tooltip" style="top: 8px;">
                                <wl-icon style="--icon-size: 24px;">help_outline</wl-icon>
                            </span>
                        </div>
                    </td>
                </tr>

                <tr>
                    <td>SoftwareImage:</td>
                    <td>
                        ${this._inputSoftwareImage}
                    </td>
                </tr>

                <tr>
                    <td>Component Location:</td>
                    <td>
                        <textarea id="i-usage-notes" rows="2">${edResource && edResource.hasComponentLocation ?  edResource.hasComponentLocation[0] : ''}</textarea>
                    </td>
                </tr>

                <tr>
                    <td>Grid:</td>
                    <td>
                        ${this._inputGrid}
                    </td>
                </tr>

                <tr>
                    <td>Time interval:</td>
                    <td>
                        ${this._inputTimeInterval}
                    </td>
                </tr>

                <tr>
                    <td>Processes:</td>
                    <td>
                        ${this._inputProcesses}
                    </td>
                </tr>

                <tr>
                    <td>Useful for calculating index:</td>
                    <td>
                        ${this._inputIndex}
                    </td>
                </tr>

                <tr>
                    <td>Usage notes:</td>
                    <td>
                        <textarea id="i-usage-notes" rows="6">${edResource && edResource.hasUsageNotes ?  edResource.hasUsageNotes[0] : ''}</textarea>
                    </td>
                </tr>

            </table>

        <wl-title level="4" style="margin-top:1em">
            Parameters:
        </wl-title>
        ${this._inputParameter}

        <wl-title level="4" style="margin-top:1em">
            Input files:
        </wl-title>
        ${this._inputDSInput}
        `;
    }

    protected _getResourceFromFullForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById("i-label") as Textfield;
        //let inputCategory : Select = this.shadowRoot.getElementById("i-category") as Select;
        let inputKeywords : Textfield = this.shadowRoot.getElementById("i-keywords") as Textfield;
        let inputShortDesc : Textarea = this.shadowRoot.getElementById("i-short-desc") as Textarea;
        let inputDesc : Textarea = this.shadowRoot.getElementById("i-desc") as Textarea;
        let inputLicense : Textarea = this.shadowRoot.getElementById("i-license") as Textarea;
        let inputCitation : Textarea = this.shadowRoot.getElementById("i-citation") as Textarea;
        let inputPurpose : Textarea = this.shadowRoot.getElementById("i-purpose") as Textarea;
        let inputExample : Textarea = this.shadowRoot.getElementById("i-example") as Textarea;
        let inputUsageNotes : Textarea = this.shadowRoot.getElementById("i-usage-notes") as Textarea;
        let inputWebsite : Textfield = this.shadowRoot.getElementById("i-website") as Textfield;
        let inputDocumentation : Textfield = this.shadowRoot.getElementById("i-documentation") as Textfield;
        let inputDownload : Textfield = this.shadowRoot.getElementById("i-download") as Textfield;
        let inputInstallInstructions : Textfield = this.shadowRoot.getElementById("i-install-instructions") as Textfield;

        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : ''; 
        //let category : string = inputCategory ? inputCategory.value : ''; 
        let keywords : string = inputKeywords ? inputKeywords.value : ''; 
        let shortDesc : string = inputShortDesc ? inputShortDesc.value : ''; 
        let desc : string = inputDesc ? inputDesc.value : ''; 
        let license : string = inputLicense ? inputLicense.value : ''; 
        let citation : string = inputCitation ? inputCitation.value : ''; 
        let purpose : string = inputPurpose ? inputPurpose.value : ''; 
        let example : string = inputExample ? inputExample.value : ''; 
        let usageNotes : string = inputUsageNotes ? inputUsageNotes.value : ''; 
        let website : string = inputWebsite ? inputWebsite.value : ''; 
        let documentation : string = inputDocumentation ? inputDocumentation.value : ''; 
        let download : string = inputDownload ? inputDownload.value : ''; 
        let installInstructions : string = inputInstallInstructions ? inputInstallInstructions.value : ''; 
        let categories = this._inputCategory.getResources();

        if (label && desc && categories != null && categories.length > 0) {
            let jsonRes = {
                type: ["Model"],
                label: [label],
                hasModelCategory: categories,
                description: [desc],
                author: this._inputAuthor.getResources(),
                hasGrid: this._inputGrid.getResources(),
                usefulForCalculatingIndex: this._inputIndex.getResources(),
            };
            if (keywords) jsonRes["keywords"] = [keywords];
            if (shortDesc) jsonRes["shortDescription"] = [shortDesc];
            if (license) jsonRes["license"] = [license];
            if (citation) jsonRes["citation"] = [citation];
            if (purpose) jsonRes["hasPurpose"] = [purpose];
            if (example) jsonRes["hasExample"] = [example];
            if (usageNotes) jsonRes["hasUsageNotes"] = [usageNotes];
            if (website) jsonRes["website"] = [website];
            if (documentation) jsonRes["hasDocumentation"] = [documentation];
            if (download) jsonRes["hasDownloadURL"] = [download];
            if (installInstructions) jsonRes["hasInstallationInstructions"] = [installInstructions];

            return ModelConfigurationSetupFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) {
                (<any>inputLabel).onBlur();
                this._notification.error("You must enter a name");
            }
            if (categories == null || categories.length > 0) {
                this._notification.error("You must enter a category");
            }
            if (!desc) {
                this._notification.error("You must enter a full description");
            }
        }
    }

    public clearForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById("i-label") as Textfield;
        let inputCategory : Select = this.shadowRoot.getElementById("i-category") as Select;
        let inputKeywords : Textfield = this.shadowRoot.getElementById("i-keywords") as Textfield;
        let inputShortDesc : Textarea = this.shadowRoot.getElementById("i-short-desc") as Textarea;
        let inputDesc : Textarea = this.shadowRoot.getElementById("i-desc") as Textarea;
        let inputLicense : Textarea = this.shadowRoot.getElementById("i-license") as Textarea;
        let inputCitation : Textarea = this.shadowRoot.getElementById("i-citation") as Textarea;
        let inputPurpose : Textarea = this.shadowRoot.getElementById("i-purpose") as Textarea;
        let inputExample : Textarea = this.shadowRoot.getElementById("i-example") as Textarea;
        let inputUsageNotes : Textarea = this.shadowRoot.getElementById("i-usage-notes") as Textarea;
        let inputWebsite : Textfield = this.shadowRoot.getElementById("i-website") as Textfield;
        let inputDocumentation : Textfield = this.shadowRoot.getElementById("i-documentation") as Textfield;
        let inputDownload : Textfield = this.shadowRoot.getElementById("i-download") as Textfield;
        let inputInstallInstructions : Textfield = this.shadowRoot.getElementById("i-install-instructions") as Textfield;

        if ( inputLabel )                inputLabel.value = '';
        //if ( inputCategory )             inputCategory.value = '';
        if ( inputKeywords )             inputKeywords.value = '';
        if ( inputShortDesc )            inputShortDesc.value = '';
        if ( inputDesc )                 inputDesc.value = '';
        if ( inputLicense )              inputLicense.value = '';
        if ( inputCitation )             inputCitation.value = '';
        if ( inputPurpose )              inputPurpose.value = '';
        if ( inputExample )              inputExample.value = '';
        if ( inputUsageNotes )           inputUsageNotes.value = '';
        if ( inputWebsite )              inputWebsite.value = '';
        if ( inputDocumentation )        inputDocumentation.value = '';
        if ( inputDownload )             inputDownload.value = '';
        if ( inputInstallInstructions )  inputInstallInstructions.value = '';
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.setups;
    }
}
