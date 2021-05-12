import { ModelCatalogResource } from './resource';
import { property, html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel, getModelTypeNames } from 'model-catalog/util';
import { Model, ModelFromJSON, CoupledModel, CoupledModelFromJSON } from '@mintproject/modelcatalog_client';
import { IdMap } from "app/reducers";
import { renderExternalLink } from 'util/ui_renders';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { ModelCatalogPerson } from './person';
import { ModelCatalogGrid } from './grid';
import { ModelCatalogSourceCode } from './source-code';
import { ModelCatalogNumericalIndex } from './numerical-index';
import { ModelCatalogFundingInformation } from './funding-information';
import { ModelCatalogVisualization } from './visualization';
import { ModelCatalogCategory } from './model-category';
import { ModelCatalogImage } from './image';
import { ModelCatalogProcess } from './process';
import { ModelCatalogVariablePresentation } from './variable-presentation';

import { goToPage } from 'app/actions';

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

import { BaseAPI } from '@mintproject/modelcatalog_client';
import { DefaultReduxApi } from 'model-catalog-api/default-redux-api';
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';

@customElement('model-catalog-model')
export class ModelCatalogModel extends connect(store)(ModelCatalogResource)<Model> {
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

    private COUPLED_MODEL_TYPE = "https://w3id.org/okn/o/sdm#CoupledModel";

    protected classes : string = "resource model";
    protected name : string = "model";
    protected pname : string = "Model";

    protected resourcesGet = ModelCatalogApi.myCatalog.model.getAll;
    protected resourceGet = ModelCatalogApi.myCatalog.model.get;
    protected resourcePut = ModelCatalogApi.myCatalog.model.put;
    protected resourceDelete = ModelCatalogApi.myCatalog.model.delete;
    protected resourcePost = ModelCatalogApi.myCatalog.model.post;

    protected resourceApi : DefaultReduxApi<Model,BaseAPI> = ModelCatalogApi.myCatalog.model;

    public pageMax : number = 10

    private _inputAuthor : ModelCatalogPerson;
    private _inputGrid : ModelCatalogGrid;
    private _inputIndex : ModelCatalogNumericalIndex;
    private _inputFunding : ModelCatalogFundingInformation;
    private _inputVisualization : ModelCatalogVisualization;
    private _inputCategory : ModelCatalogCategory;
    private _inputLogo : ModelCatalogImage;
    private _inputSourceCode : ModelCatalogSourceCode;
    private _inputProcess : ModelCatalogProcess;
    private _inputVariableInput : ModelCatalogVariablePresentation;
    private _inputVariableOutput : ModelCatalogVariablePresentation;
    
    @property({type: Boolean}) private _isCoupledModel : boolean = false;
    @property({type: String}) private _modelType : string = "";
    private _inputModel : ModelCatalogModel;

    constructor () {
        super();
    }

    protected _initializeSingleMode () {
        this._inputSourceCode = new ModelCatalogSourceCode();
        this._inputProcess = new ModelCatalogProcess();
        this._inputVariableInput = new ModelCatalogVariablePresentation();
        this._inputVariableOutput = new ModelCatalogVariablePresentation();
        this._inputAuthor = new ModelCatalogPerson();
        this._inputGrid = new ModelCatalogGrid();
        this._inputIndex = new ModelCatalogNumericalIndex();
        this._inputFunding = new ModelCatalogFundingInformation();
        this._inputVisualization = new ModelCatalogVisualization();
        this._inputCategory = new ModelCatalogCategory();
        this._inputLogo = new ModelCatalogImage();
        this._inputModel = new ModelCatalogModel();
        this._inputModel.disableCreation();
        this._inputModel.disableEdition();
        this._inputModel.disableDeletion();
    }

    public setResource (r:Model) {
        let req = super.setResource(r);
        req.then((m:Model) => {
            if (m) {
                this._inputAuthor.setResources(m.author);
                this._inputGrid.setResources(m.hasGrid);
                this._inputIndex.setResources(m.usefulForCalculatingIndex);
                this._inputFunding.setResources(m.hasFunding);
                this._inputVisualization.setResources(m.hasSampleVisualization);
                this._inputCategory.setResources(m.hasModelCategory);
                this._inputLogo.setResources(m.logo);
                this._inputSourceCode.setResources(m.hasSourceCode);
                this._inputProcess.setResources(m.hasProcess);
                this._inputVariableInput.setResources(m.hasInputVariable);
                this._inputVariableOutput.setResources(m.hasOutputVariable);
                this._modelType = this._getAdditionalType(m);
                this._isCoupledModel = this._isCoupled(m);
                if (this._isCoupledModel) {
                    this._inputModel.setResources((m as CoupledModel).usesModel);
                }
            }
        });
        return req;
    }

    protected _editResource (r:Model) {
        super._editResource(r);
        this._inputAuthor.setActionMultiselect();
        this._inputGrid.setActionSelect();
        this._inputIndex.setActionMultiselect();
        this._inputFunding.setActionMultiselect();
        this._inputVisualization.setActionMultiselect();
        this._inputCategory.setActionMultiselect();
        this._inputLogo.setActionSelect();
        this._inputSourceCode.setActionSelect();
        this._inputModel.setActionMultiselect();
        this._inputProcess.setActionMultiselect();
        this._inputVariableInput.setActionMultiselect();
        this._inputVariableOutput.setActionMultiselect();
    }

    protected _clearStatus () {
        super._clearStatus();
        if (this._inputAuthor) this._inputAuthor.unsetAction();
        if (this._inputGrid) this._inputGrid.unsetAction();
        if (this._inputIndex) this._inputIndex.unsetAction();
        if (this._inputFunding) this._inputFunding.unsetAction();
        if (this._inputVisualization) this._inputVisualization.unsetAction();
        if (this._inputCategory) this._inputCategory.unsetAction();
        if (this._inputLogo) this._inputLogo.unsetAction();
        if (this._inputSourceCode) this._inputSourceCode.unsetAction();
        if (this._inputModel) this._inputModel.unsetAction();
        if (this._inputProcess) this._inputProcess.unsetAction();
        if (this._inputVariableInput) this._inputVariableInput.unsetAction();
        if (this._inputVariableOutput) this._inputVariableOutput.unsetAction();
        this.scrollUp();
        this.clearForm();
    }

    public enableSingleResourceCreation () {
        super.enableSingleResourceCreation();
        this._inputAuthor.setResources(null);
        this._inputGrid.setResources(null);
        this._inputIndex.setResources(null);
        this._inputFunding.setResources(null);
        this._inputVisualization.setResources(null);
        this._inputCategory.setResources(null);
        this._inputLogo.setResources(null);
        this._inputSourceCode.setResources(null);
        this._inputVariableInput.setResources(null);
        this._inputVariableOutput.setResources(null);
        this._inputProcess.setResources(null);
        this._inputModel.setResources(null);
        this._inputAuthor.setActionMultiselect();
        this._inputGrid.setActionSelect();
        this._inputIndex.setActionMultiselect();
        this._inputFunding.setActionMultiselect();
        this._inputCategory.setActionMultiselect();
        this._inputLogo.setActionSelect();
        this._inputSourceCode.setActionSelect();
        this._inputProcess.setActionMultiselect();
        this._inputVariableInput.setActionMultiselect();
        this._inputVariableOutput.setActionMultiselect();
        this._inputModel.setActionMultiselect();
    }

    protected _renderFullResource (r:Model) {
        // Example, Type, operating system, versions?
        let types : string = (r.type)? getModelTypeNames(r.type).join(', ') : '';
        return html`
            <table class="details-table">
                <colgroup wir.="150px">
                <tr>
                    <td>Category:</td>
                    <td>
                        ${this._inputCategory}
                    </td>
                </tr>

                ${types ? html`
                <tr>
                    <td>Model type:</td>
                    <td>
                        ${types}
                    </td>
                </tr>
                ` : ''}

                <tr>
                    <td>Keywords</td>
                    <td>
                        ${r.keywords ? r.keywords[0] : ''}
                    </td>
                </tr>

                ${r.shortDescription ? html`
                <tr>
                    <td>Short description:</td>
                    <td>
                        ${r.shortDescription[0]}
                    </td>
                </tr>` : '' }

                <tr>
                    <td>Full description:</td>
                    <td>
                        ${r.description ? r.description[0] : ''}
                    </td>
                </tr>

                <tr>
                    <td>Logo:</td>
                    <td>
                        ${this._inputLogo}
                    </td>
                </tr>

                <tr>
                    <td>Author</td>
                    <td>
                        ${this._inputAuthor}
                    </td>
                </tr>

                <tr>
                    <td>License:</td>
                    <td>
                        ${r && r.license ? r.license[0] : ''}
                    </td>
                </tr>

                <tr>
                    <td>Citation:</td>
                    <td>
                        ${r && r.citation ? r.citation[0] : ''}
                    </td>
                </tr>

                <tr>
                    <td>Funding:</td>
                    <td>
                        ${this._inputFunding}
                    </td>
                </tr>

                ${r.theoreticalBasis ? html`
                <tr>
                    <td>Theoretical Basis:</td>
                    <td>
                        ${r.theoreticalBasis ? r.theoreticalBasis[0] : ''}
                    </td>
                </tr>` : ''}

                <tr>
                    <td>Source Code:</td>
                    <td>
                        ${this._inputSourceCode}
                    </td>
                </tr>

                ${r.runtimeEstimation ? html`
                <tr>
                    <td>Runtime Estimation:</td>
                    <td>
                        ${r.runtimeEstimation ? r.runtimeEstimation[0] : ''}
                    </td>
                </tr>` : ''}

                ${r.parameterization ? html`
                <tr>
                    <td>Parameterization:</td>
                    <td>
                        ${r.parameterization ? r.parameterization[0] : ''}
                    </td>
                </tr>` : ''}

                ${r.limitations ? html`
                <tr>
                    <td>Limitations:</td>
                    <td>
                        ${r.limitations ? r.limitations[0] : ''}
                    </td>
                </tr>` : ''}

                ${r.website ? html`
                <tr>
                    <td>Website URL:</td>
                    <td>
                        <a href="${r.website[0]}">${r.website[0]}</a>
                    </td>
                </tr>` : ''}

                ${r.hasDocumentation ? html`
                <tr>
                    <td>Documentation URL:</td>
                    <td>
                         <a href="${r.hasDocumentation[0]}">${r.hasDocumentation[0]}</a>
                    </td>
                </tr>` : ''}

                ${r.hasDownloadURL ? html`
                <tr>
                    <td>Download URL:</td>
                    <td>
                        <a href="${r.hasDownloadURL[0]}">${r.hasDownloadURL[0]}</a>
                    </td>
                </tr>`: ''}

                ${r.hasInstallationInstructions? html`
                <tr>
                    <td>Installation instructions URL:</td>
                    <td>
                        <a href="${r.hasInstallationInstructions[0]}">${r.hasInstallationInstructions[0]}</a>
                    </td>
                </tr>`:''}

                <tr>
                    <td>Purpose:</td>
                    <td>
                        ${r.hasPurpose ? r.hasPurpose[0] : ''}
                    </td>
                </tr>

                <tr>
                    <td>Process:</td>
                    <td>
                        ${this._inputProcess}
                    </td>
                </tr>

                <tr>
                    <td>Input Variable:</td>
                    <td>
                        ${this._inputVariableInput}
                    </td>
                </tr>

                <tr>
                    <td>Output Variable:</td>
                    <td>
                        ${this._inputVariableOutput}
                    </td>
                </tr>

                <tr>
                    <td>Usage notes:</td>
                    <td>
                        ${r.hasUsageNotes ? r.hasUsageNotes[0] : ''}
                    </td>
                </tr>

                <tr>
                    <td>Grid:</td>
                    <td>
                        ${this._inputGrid}
                    </td>
                </tr>

                <tr>
                    <td>Visualizations:</td>
                    <td>
                        ${this._inputVisualization}
                    </td>
                </tr>

                <tr>
                    <td>Useful for calculating index:</td>
                    <td>
                        ${this._inputIndex}
                    </td>
                </tr>
            </table>`
    }

    public scrollUp () {
        let head = this.shadowRoot.getElementById('page-top');
        if (head) 
            head.scrollIntoView({behavior: "smooth", block: "start"})
    }

    protected _isCoupled (m:Model) {
        return m.type.some((t:string) => t === "https://w3id.org/okn/o/sdm#CoupledModel" || t === "CoupledModel");
    }

    protected _getAdditionalType (m:Model) {
        let atype : string = "";
        if (m && m.type.length >= 2) {
            let ts : string[] = m.type.filter((t:string) => 
                    t != "https://w3id.org/okn/o/sdm#Model" && t != "Model" &&
                    t != "https://w3id.org/okn/o/sdm#CoupledModel" && t != "CoupledModel");
            if (ts.length > 0) {
                atype = ts[0];
                switch (atype) {
                    case "EmpiricalModel":
                        atype = "https://w3id.org/okn/o/sdm#EmpiricalModel";
                        break;
                    case "Theory-GuidedModel":
                        atype = "https://w3id.org/okn/o/sdm#Theory-GuidedModel";
                        break;
                    case "OtherModel":
                        atype = "https://w3id.org/okn/o/sdm#OtherModel";
                        break;
                    case "TheoryGuidedEmpiricalModel":
                        atype = "https://w3id.org/okn/o/sdm#TheoryGuidedEmpiricalModel"
                        break;
                    case "DataAssimilation":
                        atype = "https://w3id.org/okn/o/sdm#DataAssimilation"
                        break;
                    case "TheoryAndEmpiricalModel":
                        atype = "https://w3id.org/okn/o/sdm#TheoryAndEmpiricalModel"
                        break;
                    case "TheoryBasedModel":
                        atype = "https://w3id.org/okn/o/sdm#TheoryBasedModel"
                        break;
                    default:
                        break;
                }
            }
        }
        return atype;
    }


    private _onTypeChange (e) {
        let inputType : Select = this.shadowRoot.getElementById("i-type") as Select;
        let atype : string = inputType ? inputType.value : '';
        if (this._modelType != atype)
            this._modelType = atype;
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
                                      value="${edResource ? getLabel(edResource) : ''}" required></wl-textfield>
                    </td>
                </tr>

                <tr>
                    <td>Category*:</td>
                    <td>
                        ${this._inputCategory}
                    </td>
                </tr>

                <tr>
                    <td>Has Coupled Models:</td>
                    <td>
                        <wl-icon class="custom-radio"
                            @click=${() => {this._isCoupledModel = !this._isCoupledModel}}>
                            ${this._isCoupledModel ? 'check_box' : 'check_box_outline_blank'}
                        </wl-icon>
                    </td>
                </tr>
                
                ${this._isCoupledModel ?  html`
                <tr>
                    <td>Coupled Models:</td>
                    <td>
                        ${this._inputModel}
                    </td>
                </tr>` : '' }

                <tr>
                    <td>Model type:</td>
                    <td>
                        <wl-select id="i-type"
                                   value="${this._modelType}"
                                   @change=${this._onTypeChange}
                                   label="Model type"
                                   placeholder="Select a parameter assignament method">
                            <option value="">None</option>
                            <option value="https://w3id.org/okn/o/sdm#EmpiricalModel">Empirical Model</option>
                            <option value="https://w3id.org/okn/o/sdm#TheoryGuidedEmpiricalModel">Theory-guided empirical models</option>
                            <option value="https://w3id.org/okn/o/sdm#DataAssimilation">Data assimilation</option>
                            <option value="https://w3id.org/okn/o/sdm#TheoryAndEmpiricalModel">Theory and empirical models</option>
                            <option value="https://w3id.org/okn/o/sdm#TheoryBasedModel">Theory-based model</option>
                            <!--option value="https://w3id.org/okn/o/sdm#Theory-GuidedModel">Theory Guided Model</option-->
                            <option value="https://w3id.org/okn/o/sdm#OtherModel">Other</option>
                        </wl-select>
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
                    <td>Short description:</td>
                    <td>
                        <textarea id="i-short-desc" name="Short description" rows="3">${
                            edResource && edResource.shortDescription ? edResource.shortDescription[0] : ''
                        }</textarea>
                    </td>
                </tr>

                <tr>
                    <td>Full Description*:</td>
                    <td>
                        <textarea id="i-desc" name="Description" rows="5">${
                            edResource && edResource.description ? edResource.description[0] : ''
                        }</textarea>
                    </td>
                </tr>

                <tr>
                    <td>Logo:</td>
                    <td>
                        ${this._inputLogo}
                    </td>
                </tr>

                <tr>
                    <td>Author:</td>
                    <td>
                        ${this._inputAuthor}
                    </td>
                </tr>

                <tr>
                    <td>Funding:</td>
                    <td>
                        ${this._inputFunding}
                    </td>
                </tr>

                <tr>
                    <td>Theoretical Basis:</td>
                    <td>
                        <wl-textfield id="i-theoretical" name="Theoretical Basis"
                                value="${edResource && edResource.theoreticalBasis ? edResource.theoreticalBasis[0] : ''}"></wl-textfield>
                    </td>
                </tr>

                <tr>
                    <td>Source Code:</td>
                    <td>
                        ${this._inputSourceCode}
                    </td>
                </tr>

                <tr>
                    <td>Runtime Estimation:</td>
                    <td>
                        <wl-textfield id="i-runtime" name="Runtime Estimation"
                                value="${edResource && edResource.runtimeEstimation? edResource.runtimeEstimation[0] : ''}"></wl-textfield>
                    </td>
                </tr>

                <tr>
                    <td>Parameterization:</td>
                    <td>
                        <wl-textfield id="i-parameterization" name="Parameterization"
                                value="${edResource && edResource.parameterization ? edResource.parameterization[0] : ''}"></wl-textfield>
                    </td>
                </tr>

                <tr>
                    <td>Limitations:</td>
                    <td>
                        <wl-textfield id="i-limitations" name="Limitations"
                                value="${edResource && edResource.limitations ? edResource.limitations[0] : ''}"></wl-textfield>
                    </td>
                </tr>

                <tr>
                    <td>License:</td>
                    <td>
                        <textarea id="i-license" name="License" rows="2">${edResource && edResource.license ? edResource.license[0] : ''}</textarea>
                    </td>
                </tr>

                <tr>
                    <td>Citation:</td>
                    <td>
                        <textarea id="i-citation" name="Citation" rows="2">${edResource && edResource.citation ? edResource.citation[0] : ''}</textarea>
                    </td>
                </tr>

                <tr>
                    <td>Purpose:</td>
                    <td>
                        <textarea id="i-purpose" rows="3">${
                            edResource && edResource.hasPurpose ?  edResource.hasPurpose[0] : ''
                        }</textarea>
                    </td>
                </tr>

                <tr>
                    <td>Example:</td>
                    <td>
                        <textarea id="i-example" name="Example" rows="4">${
                            edResource && edResource.hasExample ? edResource.hasExample[0] : ''
                        }</textarea>
                    </td>
                </tr>

                <tr>
                    <td>Usage notes:</td>
                    <td>
                        <textarea id="i-usage-notes" rows="6">${
                            edResource && edResource.hasUsageNotes ?  edResource.hasUsageNotes[0] : ''
                        }</textarea>
                    </td>
                </tr>

                <tr>
                    <td>Grid:</td>
                    <td>
                        ${this._inputGrid}
                    </td>
                </tr>

                <tr>
                    <td>Visualizations:</td>
                    <td>
                        ${this._inputVisualization}
                    </td>
                </tr>

                <tr>
                    <td>Useful for calculating index:</td>
                    <td>
                        ${this._inputIndex}
                    </td>
                </tr>

                <tr>
                    <td>Process:</td>
                    <td>
                        ${this._inputProcess}
                    </td>
                </tr>

                <tr>
                    <td>Input Variable:</td>
                    <td>
                        ${this._inputVariableInput}
                    </td>
                </tr>

                <tr>
                    <td>Output Variable:</td>
                    <td>
                        ${this._inputVariableOutput}
                    </td>
                </tr>

                <tr>
                    <td>Operating systems:</td>
                    <td>
                        <wl-textfield id="i-so" name="Operating systems"
                                value="${edResource && edResource.operatingSystems ? edResource.operatingSystems[0] : ''}"></wl-textfield>
                    </td>
                </tr>

                <tr>
                    <td>Website URL:</td>
                    <td>
                        <wl-textfield id="i-website" name="Website URL" type="url"
                                value="${edResource && edResource.website ? edResource.website[0] : ''}"></wl-textfield>
                    </td>
                </tr>

                <tr>
                    <td>Documentation URL:</td>
                    <td>
                        <wl-textfield id="i-documentation" name="Documentation URL" type="url"
                                value="${edResource && edResource.hasDocumentation ? edResource.hasDocumentation[0] : ''}"></wl-textfield>
                    </td>
                </tr>

                <tr>
                    <td>Download URL:</td>
                    <td>
                        <wl-textfield id="i-download" name="Download URL" type="url"
                                value="${edResource && edResource.hasDownloadURL ? edResource.hasDownloadURL[0] : ''}"></wl-textfield>
                    </td>
                </tr>

                <tr>
                    <td>Installation instructions URL:</td>
                    <td>
                        <wl-textfield id="i-install-instructions" name="Installation instructions URL" type="url"
                                value="${edResource && edResource.hasInstallationInstructions ?
                                edResource.hasInstallationInstructions[0] : ''}"></wl-textfield>
                    </td>
                </tr>
            </table>

            <!--details style="margin-top: 6px;">
              <summary>External URLs</summary>
                <table class="details-table">
                    <colgroup style="width: 220px">
                </table>
            </details-->
        `;
    }

    protected _getResourceFromFullForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById("i-label") as Textfield;
        let inputSO : Textfield = this.shadowRoot.getElementById("i-so") as Textfield;
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
        let inputType : Select = this.shadowRoot.getElementById("i-type") as Select;

        let inputTheoretical : Textfield = this.shadowRoot.getElementById("i-theoretical") as Textfield;
        let inputRuntime : Textfield = this.shadowRoot.getElementById("i-runtime") as Textfield;
        let inputParameterization : Textfield = this.shadowRoot.getElementById("i-parameterization") as Textfield;
        let inputLimitations : Textfield = this.shadowRoot.getElementById("i-limitations") as Textfield;

        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : ''; 
        let so : string = inputSO ? inputSO.value : ''; 
        let atype : string = inputType ? inputType.value : '';
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

        let theoretical : string = inputTheoretical ? inputTheoretical.value : ''; 
        let runtime : string = inputRuntime ? inputRuntime.value : ''; 
        let parameterization : string = inputParameterization ? inputParameterization.value : ''; 
        let limitations : string = inputLimitations ? inputLimitations.value : ''; 

        let categories = this._inputCategory.getResources();

        if (label && desc && categories != null && categories.length > 0) {
            let jsonRes = {
                type: ["Model"],
                label: [label],
                hasModelCategory: categories,
                description: [desc],
                author: this._inputAuthor.getResources(),
                hasGrid: this._inputGrid.getResources(),
                hasFunding: this._inputFunding.getResources(),
                hasSampleVisualization: this._inputVisualization.getResources(),
                usefulForCalculatingIndex: this._inputIndex.getResources(),
                logo: this._inputLogo.getResources(),
                hasSourceCode: this._inputSourceCode.getResources(),
                hasProcess: this._inputProcess.getResources(),
                hasInputVariable: this._inputVariableInput.getResources(),
                hasOutputVariable: this._inputVariableOutput.getResources(),
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
            if (so) jsonRes["operatingSystems"] = [so];
            if (atype) jsonRes["type"].push(atype);

            if (theoretical) jsonRes["theoreticalBasis"] = [theoretical];
            if (runtime) jsonRes["runtimeEstimation"] = [runtime];
            if (parameterization) jsonRes["parameterization"] = [parameterization];
            if (limitations) jsonRes["limitations"] = [limitations];

            if (this._isCoupledModel) {
                jsonRes["type"].push(this.COUPLED_MODEL_TYPE);
                jsonRes["usesModel"] = this._inputModel.getResources();
                return CoupledModelFromJSON(jsonRes);
            } else {
                jsonRes["usesModel"] = [];
                return ModelFromJSON(jsonRes);
            }
        } else {
            // Show errors
            if (!label) {
                (<any>inputLabel).onBlur();
                this._notification.error("You must enter a name");
            }
            if (categories == null || categories.length === 0) {
                this._notification.error("You must enter a category");
                this.scrollUp();
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
        let inputTheoretical : Textfield = this.shadowRoot.getElementById("i-theoretical") as Textfield;
        let inputRuntime : Textfield = this.shadowRoot.getElementById("i-runtime") as Textfield;
        let inputParameterization : Textfield = this.shadowRoot.getElementById("i-parameterization") as Textfield;
        let inputLimitations : Textfield = this.shadowRoot.getElementById("i-limitations") as Textfield;

        if ( inputLabel )                inputLabel.value = '';
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
        if ( inputTheoretical )          inputTheoretical.value = '';
        if ( inputRuntime )              inputRuntime.value = '';
        if ( inputParameterization )     inputParameterization.value = '';
        if ( inputLimitations )          inputLimitations.value = '';
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.model;
    }
}
