import { ModelCatalogResource } from './resource';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { DataTransformation, DataTransformationFromJSON } from '@mintproject/modelcatalog_client';
import { IdMap } from "app/reducers";
import { renderExternalLink } from 'util/ui_renders';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { ModelCatalogSoftwareImage } from './software-image';
import { ModelCatalogParameter } from './parameter';
import { ModelCatalogPerson } from './person';
import { ModelCatalogDatasetSpecification } from './dataset-specification';

import { BaseAPI } from '@mintproject/modelcatalog_client';
import { DefaultReduxApi } from 'model-catalog-api/default-redux-api';
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('model-catalog-data-transformation')
export class ModelCatalogDataTransformation extends connect(store)(ModelCatalogResource)<DataTransformation> {
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

    protected classes : string = "resource data-transformation";
    protected name : string = "data transformation";
    protected pname : string = "data transformations";
    protected resourceApi : DefaultReduxApi<DataTransformation,BaseAPI> = ModelCatalogApi.myCatalog.dataTransformation;

    public pageMax : number = 10

    private _inputSI : ModelCatalogSoftwareImage;
    private _inputParameters : ModelCatalogParameter;
    private _inputOutputs : ModelCatalogDatasetSpecification;
    private _inputPerson : ModelCatalogPerson;

    constructor () {
        super();
    }

    protected _initializeSingleMode () {
        this._inputSI = new ModelCatalogSoftwareImage();
        this._inputParameters = new ModelCatalogParameter();
        this._inputOutputs = new ModelCatalogDatasetSpecification();
        this._inputPerson = new ModelCatalogPerson();
        this._inputParameters.inline = false;
        this._inputOutputs.inline = false;
    }

    public setResource (r:DataTransformation) {
        let req = super.setResource(r);
        req.then((dt:DataTransformation) => {
            this._inputSI.setResources(dt.hasSoftwareImage);
            this._inputParameters.setResources(dt.hasParameter);
            this._inputOutputs.setResources(dt.hasOutput);
            this._inputPerson.setResources(dt.author);
        });
        return req;
    }

    protected _editResource (r:DataTransformation) {
        super._editResource(r);
        this._inputSI.setActionSelect();
        this._inputParameters.setActionEditOrAdd();
        this._inputOutputs.setActionEditOrAdd();
        this._inputPerson.setActionSelect();
    }

    protected _clearStatus () {
        super._clearStatus();
        let inputs = [this._inputSI, this._inputPerson, this._inputParameters, this._inputOutputs];
        inputs.forEach((input) => {
            input.unsetAction();
        });
    }

    /*protected _renderResource (r:DataTransformation) {
    //TODO: ADD outputs;
        return html`<div>
            ${getLabel(r)}
            <div style="margin-top: 5px;">
                <b>Outputs:</b>
                ${r.hasOutput ? r.hasOutput.map((out) => getLabel(out)).join(', ') : 'No specified'}
            </div>
        <div>`;
    }*/

    protected _renderFullResource (r:DataTransformation) {
        console.log(r);
        return html`
            <table class="details-table">
                <colgroup wir.="150px">
                <tr>
                    <td colspan="2" style="padding: 5px 20px;">
                        <wl-title level="3"> ${getLabel(r)} </wl-title>
                    </td>
                </tr>

                <tr>
                    <td>Description:</td>
                    <td>
                        ${r.description ? r.description[0] : ''}
                    </td>
                </tr>

                <tr>
                    <td>Author</td>
                    <td>
                        ${this._inputPerson}
                    </td>
                </tr>

                <tr>
                    <td>Component Location:</td>
                    <td>
                        ${r.hasComponentLocation ? renderExternalLink(r.hasComponentLocation[0]) : ''}
                    </td>
                </tr>

                <tr>
                    <td>Usage notes:</td>
                    <td>
                        ${r.hasUsageNotes ? r.hasUsageNotes[0] : ''}
                    </td>
                </tr>
            </table>

            <wl-title level="4" style="margin-top:1em"> Parameters: </wl-title>
            ${this._inputParameters}

            <wl-title level="4" style="margin-top:1em"> Output files: </wl-title>
            ${this._inputOutputs}`;
    }

    protected _renderFullForm () {
        let edResource = this._getEditingResource();
        return html`
            <table class="details-table">
                <colgroup width="150px">
                <tr>
                    <td colspan="2" style="padding: 5px 20px;">
                        <wl-textfield id="dt-label" label="Data transformation name" 
                                      value="${edResource ? getLabel(edResource) : ''}" required></wl-textfield>
                    </td>
                </tr>

                <tr>
                    <td>Description:</td>
                    <td>
                        <textarea id="dt-desc" name="Description" rows="5">${
                            edResource && edResource.description ? edResource.description[0] : ''
                        }</textarea>
                    </td>
                </tr>

                <tr>
                    <td>Author</td>
                    <td>
                        ${this._inputPerson}
                    </td>
                </tr>

                <tr>
                    <td>Software Image:</td>
                    <td>
                        ${this._inputSI}
                    </td>
                </tr>

                <tr>
                    <td>Component Location:</td>
                    <td>
                        <textarea id="dt-comp-loc">${
                            edResource && edResource.hasComponentLocation ? edResource.hasComponentLocation : ''
                        }</textarea>
                    </td>
                </tr>

                <tr>
                    <td>Usage notes:</td>
                    <td>
                        <textarea id="dt-usage-notes" rows="6">${
                            edResource && edResource.hasUsageNotes ?  edResource.hasUsageNotes[0] : ''
                        }</textarea>
                    </td>
                </tr>
            </table>

            <wl-title level="4" style="margin-top:1em"> Parameters: </wl-title>
            ${this._inputParameters}

            <wl-title level="4" style="margin-top:1em"> Output files: </wl-title>
            ${this._inputOutputs}
        `;
    }

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <form>
            <wl-textfield id="var-label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textarea id="var-desc" label="Description"
                value=${edResource && edResource.description ? edResource.description[0] : ''}>
            </wl-textarea>
            <wl-textarea id="var-comp-loc" label="Component location"
                value=${edResource && edResource.hasComponentLocation ? edResource.hasComponentLocation[0] : ''}>
            </wl-textarea>
        </form>`;
    }

    protected _getResourceFromForm () {
        console.log("normal");
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('var-label') as Textfield;
        let inputDesc : Textarea = this.shadowRoot.getElementById('var-desc') as Textarea;
        let inputCompLoc : Textarea = this.shadowRoot.getElementById('var-comp-loc') as Textarea;

        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let desc : string = inputDesc ? inputDesc.value : '';

        if (label) {
            let jsonRes = {
                type: ["DataTransformation"],
                label: [label],
            };
            if (desc) jsonRes["description"] = [desc];
            return DataTransformationFromJSON(jsonRes);
        } else {
            if (!label) (<any>inputLabel).onBlur();
        }
    }

    protected _getResourceFromFullForm () {
        // GET ELEMENTS
        console.log('asdasd');
        let inputLabel : Textfield = this.shadowRoot.getElementById('dt-label') as Textfield;
        let inputDesc : Textarea = this.shadowRoot.getElementById('dt-desc') as Textarea;
        let inputCompLoc : Textarea = this.shadowRoot.getElementById('dt-comp-loc') as Textarea;
        let inputNotes : Textarea = this.shadowRoot.getElementById('dt-usage-notes') as Textarea;

        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let desc : string = inputDesc ? inputDesc.value : '';
        let compLoc : string = inputCompLoc ? inputCompLoc.value : '';
        let notes : string = inputNotes ? inputNotes.value : '';

        if (label) {
            let jsonRes = {
                type: ["DataTransformation"],
                label: [label],
                hasSoftwareImage: this._inputSI.getResources(),
                hasParameter: this._inputParameters.getResources(),
                hasOutput: this._inputOutputs.getResources(),
                author: this._inputPerson.getResources(),
            };
            if (desc) jsonRes["description"] = [desc];
            if (compLoc) jsonRes["hasComponentLocation"] = [compLoc];
            if (notes) jsonRes["hasUsageNotes"] = [notes];
            return DataTransformationFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
        }
    }
}
