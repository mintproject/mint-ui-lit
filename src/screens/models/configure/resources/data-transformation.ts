import { ModelCatalogResource } from './resource';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { dataTransformationGet, dataTransformationsGet, dataTransformationPost, dataTransformationPut, dataTransformationDelete } from 'model-catalog/actions';
import { DataTransformation, DataTransformationFromJSON } from '@mintproject/modelcatalog_client';
import { IdMap } from "app/reducers";

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('model-catalog-data-transformation')
export class ModelCatalogDataTransformation extends connect(store)(ModelCatalogResource)<DataTransformation> {
    protected classes : string = "resource data-transformation";
    protected name : string = "data transformation";
    protected pname : string = "data transformations";
    protected resourcesGet = dataTransformationsGet;
    protected resourceGet = dataTransformationGet;
    protected resourcePost = dataTransformationPost;
    protected resourcePut = dataTransformationPut;
    protected resourceDelete = dataTransformationDelete;

    public pageMax : number = 10

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
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
        }
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.dataTransformations;
    }
}
