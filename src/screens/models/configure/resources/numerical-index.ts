import { ModelCatalogResource } from './resource';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { NumericalIndex, NumericalIndexFromJSON } from '@mintproject/modelcatalog_client';
import { IdMap } from "app/reducers";
import { ModelCatalogStandardVariable } from './standard-variable';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';

import { BaseAPI } from '@mintproject/modelcatalog_client';
import { DefaultReduxApi } from 'model-catalog-api/default-redux-api';
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';

@customElement('model-catalog-numerical-index')
export class ModelCatalogNumericalIndex extends connect(store)(ModelCatalogResource)<NumericalIndex> {
    static get styles() {
        return [ExplorerStyles, SharedStyles, this.getBasicStyles(), css`
        #input-standard-variable {
            --list-height: 180px;
            --dialog-height: 100%;
        }`];
    }

    protected classes : string = "resource numerical-index";
    protected name : string = "numerical index";
    protected pname : string = "numerical indexes";

    protected resourceApi : DefaultReduxApi<NumericalIndex,BaseAPI> = ModelCatalogApi.myCatalog.numericalIndex;

    public uniqueLabel : boolean = true;

    private _inputStandardVariable : ModelCatalogStandardVariable;

    constructor () {
        super();
        this._inputStandardVariable = new ModelCatalogStandardVariable();
        this._inputStandardVariable.setActionSelect();
        this._inputStandardVariable.setAttribute('id', 'input-standard-variable');
    }

    protected _editResource (r:NumericalIndex) {
        super._editResource(r);
        let edResource = this._getEditingResource();
        this._inputStandardVariable.setResources( edResource.hasStandardVariable );
    }

    protected _createResource () {
        this._inputStandardVariable.setResources(null);
        super._createResource();
    }

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <p></p>
        <form>
            <wl-textfield id="index-label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textarea id="index-desc" label="Description" required
                value=${edResource && edResource.description ? edResource.description[0] : ''}>
            </wl-textarea>
            <p></p>
            <div style="padding: 10px 0px;">
                <div style="padding: 5px 0px; font-weight: bold;">Standard variable:</div>
                ${this._inputStandardVariable}
            </div>
        </form>
        <p></p>
        `;
    }

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('index-label') as Textfield;
        let inputDesc : Textarea = this.shadowRoot.getElementById('index-desc') as Textarea;
        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let desc : string = inputDesc ? inputDesc.value : '';
        if (label && desc) {
            let jsonRes = {
                type: ["NumericalIndex"],
                label: [label],
                description: [desc],
                hasStandardVariable: this._inputStandardVariable.getResources()
            };
            return NumericalIndexFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
            if (!desc) (<any>inputDesc).onBlur();
        }
    }
}
