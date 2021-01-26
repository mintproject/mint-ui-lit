import { ModelCatalogResource } from './resource';
import { property, html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { IdMap } from "app/reducers";

import { datasetSpecificationGet, datasetSpecificationsGet, datasetSpecificationPost, datasetSpecificationPut, datasetSpecificationDelete } from 'model-catalog/actions';
import { DatasetSpecification, VariablePresentation, DataTransformation, DatasetSpecificationFromJSON } from '@mintproject/modelcatalog_client';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { ModelCatalogVariablePresentation } from './variable-presentation';
import { ModelCatalogDataTransformation } from './data-transformation';
import { ModelCatalogSampleResource } from './sample-resource';
import { ModelCatalogSampleCollection } from './sample-collection';
import './variable-presentation';
import './data-transformation';

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('model-catalog-dataset-specification')
export class ModelCatalogDatasetSpecification extends connect(store)(ModelCatalogResource)<DatasetSpecification> {
    static get styles() {
        return [ExplorerStyles, SharedStyles, this.getBasicStyles(), css`
        #input-variable-presentation {
            --list-height: 180px;
            --dialog-height: 100%;
        }
        #input-data-transformation {
            --list-height: 180px;
            --dialog-height: 100%;
        }
        #input-sample-resource {
            --list-height: 180px;
            --dialog-height: 100%;
        }
        #input-sample-collection {
            --list-height: 200px;
            --dialog-height: 100%;
        }
        .two-inputs > wl-textfield, 
        .two-inputs > wl-select {
            display: inline-block;
            width: 50%;
        }`];
    }

    private _inputVariablePresentation : ModelCatalogVariablePresentation;
    private _inputDataTransformation : ModelCatalogDataTransformation;
    private _inputSampleResource : ModelCatalogSampleResource;
    private _inputSampleCollection : ModelCatalogSampleCollection;

    protected classes : string = "resource dataset-specification";
    protected name : string = "dataset specification";
    protected pname : string = "dataset specifications";
    protected resourcesGet = datasetSpecificationsGet;
    protected resourceGet = datasetSpecificationGet;
    protected resourcePost = datasetSpecificationPost;
    protected resourcePut = datasetSpecificationPut;
    protected resourceDelete = datasetSpecificationDelete;
    protected positionAttr : string = "position";
    public colspan = 3;

    public isSetup : boolean = false;
    private sampleResources : IdMap<ModelCatalogSampleResource> = {};
    private sampleCollections : IdMap<ModelCatalogSampleCollection> = {};
    private _vpDisplayer : IdMap<ModelCatalogVariablePresentation> = {};
    @property({type: String}) private _fileType : 'resource' | 'collection' = 'resource';

    public setAsSetup () {
        this.isSetup = true;
        this.colspan = 4;
    }

    constructor () {
        super();
        this._inputVariablePresentation = new ModelCatalogVariablePresentation();
        this._inputVariablePresentation.setActionMultiselect();
        this._inputVariablePresentation.setAttribute('id', 'input-variable-presentation');

        this._inputDataTransformation = new ModelCatalogDataTransformation();
        this._inputDataTransformation.setActionMultiselect();
        this._inputDataTransformation.setAttribute('id', 'input-data-transformation');

        this._inputSampleResource = new ModelCatalogSampleResource();
        this._inputSampleResource.setActionSelect();
        this._inputSampleResource.setAttribute('id', 'input-sample-resource');
        this._inputSampleResource.pageMax = 10;

        this._inputSampleCollection = new ModelCatalogSampleCollection();
        this._inputSampleCollection.setActionSelect();
        this._inputSampleCollection.setAttribute('id', 'input-sample-collection');
    }

    protected _editResource (r:DatasetSpecification) {
        super._editResource(r);
        let ed : DatasetSpecification = this._getEditingResource();
        this._inputVariablePresentation.setResources( ed.hasPresentation );
        this._inputDataTransformation.setResources( ed.hasDataTransformation );
        this._inputSampleCollection.setResources(null);
        this._inputSampleResource.setResources(null);
        if (ed.hasFixedResource && ed.hasFixedResource.length > 0) {
            if (ed.hasFixedResource[0].type.indexOf("SampleCollection") >= 0) {
                this._fileType = 'collection';
                this._inputSampleCollection.setResources(ed.hasFixedResource.filter((ds:DatasetSpecification) => {
                    return ds.type.indexOf("SampleCollection") >= 0;
                }));
            } else {
                this._fileType = 'resource';
                this._inputSampleResource.setResources(ed.hasFixedResource.filter((ds:DatasetSpecification) => {
                    return ds.type.indexOf("SampleCollection") < 0;
                }));
            }
        }
    }

    protected _createResource () {
        this._inputVariablePresentation.setResources(null);
        this._inputDataTransformation.setResources(null);
        this._inputSampleResource.setResources(null);
        this._inputSampleCollection.setResources(null);
        super._createResource();
    }

    protected _renderTableHeader () {
        return html`
            <th><b>Input name</b></th>
            <th><b>Description</b></th>
            <!--th><b>Data Transformations</b></th-->
            <th><b>Variables</b></th>
            ${this.isSetup ? html` <th><b>Selected File</b></th> ` : ''}
        `;
    }

    //TODO: fix this, Is not the same as modelm, config, setup, etc.
    private _setSubResources2 (r:DatasetSpecification) {
        if (r.hasFixedResource && r.hasFixedResource.length > 0) {
            if (r.hasFixedResource[0].type.indexOf("SampleCollection") >= 0) {
                if (!this.sampleCollections[r.id])
                    this.sampleCollections[r.id] = new ModelCatalogSampleCollection();
                this.sampleCollections[r.id].setResources(r.hasFixedResource);
            } else {
                if (!this.sampleResources[r.id])
                    this.sampleResources[r.id] = new ModelCatalogSampleResource();
                this.sampleResources[r.id].setResources(r.hasFixedResource);
            }
        }
        if (r.hasPresentation) {
            if (!this._vpDisplayer[r.id])
                this._vpDisplayer[r.id] = new ModelCatalogVariablePresentation();
            this._vpDisplayer[r.id].setResources( r.hasPresentation );
        }
    }

    protected _renderRow (r:DatasetSpecification) {
        this._setSubResources2(r);
        return html`
            <td>
                <code>${getLabel(r)}</code> 
                ${r.hasFormat && r.hasFormat.length === 1 ?  
                        html`<span class="monospaced" style="color: gray;">(.${r.hasFormat})<span>` : ''}
            </td>
            <td>
                <b>${r.description ? r.description[0] : ''}</b>
            </td>
            <!--td>
                {r.hasDataTransformation ? r.hasDataTransformation.map((dt:DataTransformation) =>
                html <span class="resource data-transformation">{getLabel(dt)}</span>) : ''}
            </td-->
            <td>
                ${this._vpDisplayer[r.id]}
            </td>
            ${this.isSetup ? html`
            <td>
                ${r.hasFixedResource ?
                    (this.sampleResources[r.id] ?
                        this.sampleResources[r.id]
                        : (this.sampleCollections[r.id] ? this.sampleCollections[r.id] : html`<b>${getLabel(r.hasFixedResource[0])}</b>`)
                    )
                : ''}
            </td>
            ` : ''}
        `;
    }

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <form>
            <wl-textfield id="ds-label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textarea id="ds-desc" label="Description" required rows="3"
                value=${edResource && edResource.description ? edResource.description[0] : ''}>
            </wl-textarea>
            <wl-textfield id="ds-format" label="Format" required
                value="${edResource && edResource.hasFormat ? edResource.hasFormat[0] : ''}" >
            </wl-textfield>
            <div style="min-height:50px; padding: 10px 0px;">
                <div style="padding: 5px 0px; font-weight: bold;">Variables:</div>
                ${this._inputVariablePresentation}
            </div>
            ${this.isSetup ? html`
            <div style="padding: 10px 0px;">
                <wl-select label="Number of files" @input="${this._onChangeFileType}" value="${this._fileType}">
                    <option value="resource">Single file</option>
                    <option value="collection">Multiple files</option>
                </wl-select>
                <div style="padding: 5px 0px; font-weight: bold;">Files:</div>
                ${this._fileType == 'resource' ? 
                        this._inputSampleResource : this._inputSampleCollection}
            </div>
            ` : html`
            <div style="padding: 10px 0px;">
                <div style="padding: 5px 0px; font-weight: bold;">Data transformations:</div>
                ${this._inputDataTransformation}
            </div>
            `}
        </form>`;
    }

    private _onChangeFileType (ev) {
        if (ev && ev.srcElement && ev.srcElement.value) {
            this._fileType = ev.srcElement.value;
        }
    }

    /*export interface DatasetSpecification {
        id?: string;
        type?: Array<string> | null;
        position?: Array<number> | null;
        label?: Array<string> | null;
        description?: Array<string> | null;
        hasDimensionality?: Array<number> | null;
        hasFormat?: Array<string> | null;

        hasFileStructure?: Array<object> | null;
        hasPresentation?: Array<VariablePresentation> | null;

        hasFixedResource?: Array<SampleResource> | null; //ONLY FOR SETUPS
    }*/

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('ds-label') as Textfield;
        let inputDesc : Textfield = this.shadowRoot.getElementById('ds-desc') as Textfield;
        let inputFormat : Textfield = this.shadowRoot.getElementById('ds-format') as Textfield;
        let inputDim : Textfield = this.shadowRoot.getElementById('ds-dim') as Textfield;
        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let desc : string = inputDesc ? inputDesc.value : '';
        let format : string = inputFormat ? inputFormat.value : '';
        let dim : string = inputDim ? inputDim.value : '';
        let presentation : VariablePresentation[] = this._inputVariablePresentation.getResources();

        if (label && desc && format) {
            let jsonRes = {
                type: ["DatasetSpecification"],
                label: [label],
                description: [desc],
                hasFormat: [format],
                position: [this._resources.length + 1],
                hasPresentation: presentation,
                hasDimensionality: [0],
            };
            if (this.isSetup) {
                console.log('here');
                jsonRes["hasFixedResource"] = this._fileType == "resource" ?
                        this._inputSampleResource.getResources() : this._inputSampleCollection.getResources();
            } else {
                console.log('or here!');
                jsonRes["hasDataTransformation"] = this._inputDataTransformation.getResources();
            }
            if (presentation.length > 0 || confirm("If no variables are associated with an input, we will not be able to search dataset candidates in the MINT data catalog when using this model")) {
                return DatasetSpecificationFromJSON(jsonRes); 
            }
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
            if (!desc) (<any>inputDesc).onBlur();
            if (!format) (<any>inputFormat).onBlur();
            if (presentation.length == 0) console.log('You must select at least a presentation!');
        }
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.datasetSpecifications;
    }
}
