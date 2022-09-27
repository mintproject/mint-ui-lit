import { ModelCatalogResource } from './resource';
import { SampleCollection, SampleResource, SampleCollectionFromJSON } from '@mintproject/modelcatalog_client';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store } from 'app/store';
import { getLabel } from 'model-catalog-api/util';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { Textfield } from 'weightless/textfield';

import { BaseAPI } from '@mintproject/modelcatalog_client';
import { DefaultReduxApi } from 'model-catalog-api/default-redux-api';
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';

import { ModelCatalogSampleResource } from './sample-resource';

@customElement('model-catalog-sample-collection')
export class ModelCatalogSampleCollection extends connect(store)(ModelCatalogResource)<SampleCollection> {
    static get styles() {
        return [ExplorerStyles, SharedStyles, this.getBasicStyles(), css`
        #input-sample-resource {
            --list-height: 180px;
            --dialog-height: 100%;
        }`
        ];
    }

    protected classes : string = "resource sample-collection";
    protected name : string = "sample collection";
    protected pname : string = "sample collection";

    protected resourceApi : DefaultReduxApi<SampleCollection,BaseAPI> = ModelCatalogApi.myCatalog.sampleCollection;

    private _inputSampleResources : ModelCatalogSampleResource;

    constructor () {
        super();
        this._inputSampleResources = new ModelCatalogSampleResource();
        this._inputSampleResources.setActionMultiselect();
        this._inputSampleResources.setAttribute('id', 'input-sample-resource');
        this._inputSampleResources.pageMax = 10;
        this._inputSampleResources.inlineMax = 4;
    }

/*
export interface SampleCollection {
    dataCatalogIdentifier?: Array<string> | null;
    hasPart?: Array<SampleCollection> | null;
    description?: Array<string> | null;
    id?: string;
    label?: Array<string> | null;
    type?: Array<string> | null;
    value?: Array<string> | null;
}*/

    protected _editResource (r:SampleCollection) {
        super._editResource(r);
        this._inputSampleResources.setResources( r.hasPart );
    }

    protected _renderResource (r:SampleCollection) {
        return html`
            <div style="display: flex; min-width: 200px; justify-content: space-between;">
                <b>${getLabel(r)}</b>
                <span class="monospaced">
                    ${r.hasPart ? r.hasPart.length + ' file' + (r.hasPart.length > 1 ? 's' : '') : ''}
                </span> 
            </div>
            <span style="font-style: oblique; color: gray;">
                ${r.description ? r.description[0] : ''}
                <!--a>See files.</a-->
            </span>
        `
    }

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <form>
            <wl-textfield id="label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textarea id="desc" label="Description" required rows="3"
                value=${edResource && edResource.description ? edResource.description[0] : ''}>
            </wl-textarea>
            <div style="padding: 10px 0px; min-height:100px">
                <div style="padding: 5px 0px; font-weight: bold;">Files:</div>
                ${this._inputSampleResources}
            </div>
        </form>`;
    }

    protected _getResourceFromForm () {
        let ed = this._getEditingResource();
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('label') as Textfield;
        let inputDesc : Textfield = this.shadowRoot.getElementById('desc') as Textfield;
        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let desc : string = inputDesc ? inputDesc.value : '';
        let sampleResources : SampleResource[] = this._inputSampleResources.getResources();

        if (label && desc) {
            let jsonRes = {
                type: ["SampleResource"],
                label: [label],
                hasPart: sampleResources,
            };
            return SampleCollectionFromJSON(jsonRes); 
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
            if (!desc) (<any>inputDesc).onBlur();
        }
    }

    protected _createResource () {
        //TODO: This should be general
        this._inputSampleResources.setResources(null);
        super._createResource();
    }
}
