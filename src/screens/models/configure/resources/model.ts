import { ModelCatalogResource } from './resource';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { modelGet, modelsGet, modelPost, modelPut, modelDelete } from 'model-catalog/actions';
import { Model, ModelFromJSON } from '@mintproject/modelcatalog_client';
import { IdMap } from "app/reducers";
import { renderExternalLink } from 'util/ui_renders';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { ModelCatalogPerson } from './person';
import { ModelCatalogGrid } from './grid';
import { ModelCatalogNumericalIndex } from './numerical-index';
import { ModelCatalogFundingInformation } from './funding-information';
import { ModelCatalogVisualization } from './visualization';

import { goToPage } from 'app/actions';

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

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

    protected classes : string = "resource model";
    protected name : string = "model";
    protected pname : string = "Model";
    protected resourcesGet = modelsGet;
    protected resourceGet = modelGet;
    protected resourcePut = modelPut;
    protected resourceDelete = modelDelete;
    protected resourcePost = modelPost;

    public pageMax : number = 10

    private _inputAuthor : ModelCatalogPerson;
    private _inputGrid : ModelCatalogGrid;
    private _inputIndex : ModelCatalogNumericalIndex;
    private _inputFunding : ModelCatalogFundingInformation;
    private _inputVisualization : ModelCatalogVisualization;

    constructor () {
        super();
    }

    protected _initializeSingleMode () {
        this._inputAuthor = new ModelCatalogPerson();
        this._inputGrid = new ModelCatalogGrid();
        this._inputIndex = new ModelCatalogNumericalIndex();
        this._inputFunding = new ModelCatalogFundingInformation();
        this._inputVisualization = new ModelCatalogVisualization();
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
            }
        });
        return req;
    }

    protected _editResource (r:Model) {
        super._editResource(r);
        this._inputAuthor.setActionMultiselect();
        this._inputGrid.setActionSelect();
        this._inputIndex.setActionSelect();
        this._inputFunding.setActionMultiselect();
        this._inputVisualization.setActionMultiselect();
    }

    protected _clearStatus () {
        super._clearStatus();
        if (this._inputAuthor) this._inputAuthor.unsetAction();
        if (this._inputGrid) this._inputGrid.unsetAction();
        if (this._inputIndex) this._inputIndex.unsetAction();
        if (this._inputFunding) this._inputFunding.unsetAction();
        if (this._inputVisualization) this._inputVisualization.unsetAction();
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
        this._inputAuthor.setActionMultiselect();
        this._inputGrid.setActionSelect();
        this._inputIndex.setActionSelect();
        this._inputFunding.setActionMultiselect();
        this._inputVisualization.setActionMultiselect();
    }

    protected _renderFullResource (r:Model) {
        // Example, Type, operating system, versions?
        return html`
            <table class="details-table">
                <colgroup wir.="150px">
                <!--tr>
                    <td colspan="2" style="padding: 5px 20px;">
                        <wl-title level="3"> {getLabel(r)} </wl-title>
                    </td>
                </tr-->

                <tr>
                    <td>Category:</td>
                    <td>
                        ${r && r.hasModelCategory && r.hasModelCategory.length > 0 ? r.hasModelCategory[0] : ''}
                    </td>
                </tr>

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

                ${r.website ? html`
                <tr>
                    <td>Website URL</td>
                    <td>
                        <a href="${r.website[0]}">${r.website[0]}</a>
                    </td>
                </tr>` : ''}

                ${r.hasDocumentation ? html`
                <tr>
                    <td>Documentation URL</td>
                    <td>
                         <a href="${r.hasDocumentation[0]}">${r.hasDocumentation[0]}</a>
                    </td>
                </tr>` : ''}

                ${r.hasDownloadURL ? html`
                <tr>
                    <td>Download URL</td>
                    <td>
                        <a href="${r.hasDownloadURL[0]}">${r.hasDownloadURL[0]}</a>
                    </td>
                </tr>`: ''}

                ${r.hasInstallationInstructions? html`
                <tr>
                    <td>Installation instructions URL</td>
                    <td>
                        <a href="${r.hasInstallationInstructions[0]}">${r.hasInstallationInstructions[0]}</a>
                    </td>
                </tr>`:''}

                <tr>
                    <td>Purpose</td>
                    <td>
                        ${r.hasPurpose ? r.hasPurpose[0] : ''}
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
                    <td>Category:</td>
                    <td>
                        <wl-select id="i-category" name="Category" required
                            value="${edResource && edResource.hasModelCategory && edResource.hasModelCategory.length > 0
                            ? edResource.hasModelCategory[0] : ''}">
                            <option value="">None</option>
                            <option value="Agriculture">Agriculture</option>
                            <option value="Hydrology">Hydrology</option>
                            <option value="Economy">Economy</option>
                            <option value="Weather">Weather</option>
                            <option value="Decision Support">Decision Support</option>
                            <option value="Land Use">Land Use</option>
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
                    <td>Full Description:</td>
                    <td>
                        <textarea id="i-desc" name="Description" rows="5">${
                            edResource && edResource.description ? edResource.description[0] : ''
                        }</textarea>
                    </td>
                </tr>

                <tr>
                    <td>Author</td>
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
            </table>

            <details style="margin-top: 6px;">
              <summary>External URLs</summary>
                <table class="details-table">
                    <colgroup style="width: 220px">
                    <tr>
                        <td>Website URL</td>
                        <td>
                            <wl-textfield id="i-website" name="Website URL" type="url"
                                    value="${edResource && edResource.website ? edResource.website[0] : ''}"></wl-textfield>
                        </td>
                    </tr>

                    <tr>
                        <td>Documentation URL</td>
                        <td>
                            <wl-textfield id="i-documentation" name="Documentation URL" type="url"
                                    value="${edResource && edResource.hasDocumentation ? edResource.hasDocumentation[0] : ''}"></wl-textfield>
                        </td>
                    </tr>

                    <tr>
                        <td>Download URL</td>
                        <td>
                            <wl-textfield id="i-download" name="Download URL" type="url"
                                    value="${edResource && edResource.hasDownloadURL ? edResource.hasDownloadURL[0] : ''}"></wl-textfield>
                        </td>
                    </tr>

                    <tr>
                        <td>Installation instructions URL</td>
                        <td>
                            <wl-textfield id="i-install-instructions" name="Installation instructions URL" type="url"
                                    value="${edResource && edResource.hasInstallationInstructions ?
                                    edResource.hasInstallationInstructions[0] : ''}"></wl-textfield>
                        </td>
                    </tr>
                </table>
            </details>

        `;
    }

    protected _getResourceFromFullForm () {
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

        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : ''; 
        let category : string = inputCategory ? inputCategory.value : ''; 
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

        if (label && category && desc) {
            let jsonRes = {
                type: ["Model"],
                label: [label],
                hasModelCategory: [category],
                description: [desc],
                author: this._inputAuthor.getResources(),
                hasGrid: this._inputGrid.getResources(),
                hasFunding: this._inputFunding.getResources(),
                hasSampleVisualization: this._inputVisualization.getResources(),
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

            return ModelFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) {
                (<any>inputLabel).onBlur();
                this._notification.error("You must enter a name");
            }
            if (!category) {
                (<any>inputCategory).onBlur();
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
        if ( inputCategory )             inputCategory.value = '';
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
        return db.models;
    }
}
