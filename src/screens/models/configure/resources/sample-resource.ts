import { ModelCatalogResource } from './resource';
import { SampleResource, Unit, SampleResourceFromJSON } from '@mintproject/modelcatalog_client';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { sampleResourceGet, sampleResourcesGet, sampleResourcePost, sampleResourcePut, sampleResourceDelete } from 'model-catalog/actions';
import { IdMap } from "app/reducers";

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('model-catalog-sample-resource')
export class ModelCatalogSampleResource extends connect(store)(ModelCatalogResource)<SampleResource> {
    protected classes : string = "resource sample-resource";
    protected name : string = "sample resource";
    protected pname : string = "sample resources";
    protected resourcesGet = sampleResourcesGet;
    protected resourceGet = sampleResourceGet;
    protected resourcePost = sampleResourcePost;
    protected resourcePut = sampleResourcePut;
    protected resourceDelete = sampleResourceDelete;

/*export interface SampleResource {
    label?: Array<string> | null;
    description?: Array<string> | null;
    dataCatalogIdentifier?: Array<string> | null;
    value?: Array<object> | null;

    id?: string;
    type?: Array<string> | null;
}*/

    protected _renderResource (r:SampleResource) {
        return r.value ? html`<a target="_blank" href="${r.value}">${getLabel(r)}</a>` : html`${getLabel(r)}`;
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
            <wl-textfield id="dcid" label="Data catalog ID"
                value="${edResource && edResource.dataCatalogIdentifier ? edResource.dataCatalogIdentifier[0] : ''}" >
            </wl-textfield>
            <wl-textfield id="value" label="File URL"
                value="${edResource && edResource.value ? edResource.value[0] : ''}" >
            </wl-textfield>
        </form>`;
    }

    protected _getResourceFromForm () {
        let ed = this._getEditingResource();
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('label') as Textfield;
        let inputDesc : Textfield = this.shadowRoot.getElementById('desc') as Textfield;
        let inputDCID : Textfield = this.shadowRoot.getElementById('dcid') as Textfield;
        let inputValue : Textfield = this.shadowRoot.getElementById('value') as Textfield;
        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let desc : string = inputDesc ? inputDesc.value : '';
        let dcid : string = inputDCID ? inputDCID.value : '';
        let value : string = inputValue ? inputValue.value : '';

        if (label && desc && (dcid || value)) {
            let jsonRes = {
                type: ["SampleResource"],
                label: [label],
                description: [desc],
            };
            if (dcid)
                jsonRes["dataCatalogIdentifier"] = [dcid];
            else if (ed && ed.dataCatalogIdentifier && ed.dataCatalogIdentifier.length > 0)
                jsonRes["dataCatalogIdentifier"] = [];

            if (value)
                jsonRes["value"] = [value];
            else if (ed && ed.value && ed.value.length > 0)
                jsonRes["value"] = [];

            return SampleResourceFromJSON(jsonRes); 
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
            if (!desc) (<any>inputDesc).onBlur();
            //TODO show value as required
        }
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.sampleResources;
    }
}
