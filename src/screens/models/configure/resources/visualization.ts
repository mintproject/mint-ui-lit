import { ModelCatalogResource } from './resource';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { visualizationGet, visualizationsGet, visualizationPost, visualizationPut, visualizationDelete } from 'model-catalog/actions';
import { Visualization, VisualizationFromJSON } from '@mintproject/modelcatalog_client';
import { IdMap } from "app/reducers";

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('model-catalog-visualization')
export class ModelCatalogVisualization extends connect(store)(ModelCatalogResource)<Visualization> {
    protected classes : string = "resource visualization";
    protected name : string = "visualization";
    protected pname : string = "visualizations";
    protected resourcesGet = visualizationsGet;
    protected resourceGet = visualizationGet;
    protected resourcePost = visualizationPost;
    protected resourcePut = visualizationPut;
    protected resourceDelete = visualizationDelete;

    public pageMax : number = 10

    protected _renderForm () {
        let edResource = this._getEditingResource();
        console.log(edResource);
        return html`
        <form>
            <wl-textfield id="viz-label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textarea id="viz-desc" label="Description"
                value=${edResource && edResource.description ? edResource.description[0] : ''}>
            </wl-textarea>
            <wl-textfield id="viz-value" label="Value (URL)" required
                value=${edResource && edResource.value ? edResource.value[0] : ''}>
            </wl-textfield>
            <wl-textfield id="viz-source" label="Source (URL)" 
                value=${edResource && edResource.hadPrimarySource ? edResource.hadPrimarySource[0]["id"] : ''}>
            </wl-textfield>
        </form>`;
    }

/* export interface Visualization {
    id?: string;
    label?: Array<string> | null;
    type?: Array<string> | null;
    description?: Array<string> | null;

    hasFormat?: Array<string> | null;
    hadPrimarySource?: Array<object> | null;
    wasDerivedFromSoftware?: Array<Software> | null;
    value?: Array<object> | null;
}*/

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('viz-label') as Textfield;
        let inputDesc : Textarea = this.shadowRoot.getElementById('viz-desc') as Textarea;
        let inputValue : Textfield = this.shadowRoot.getElementById('viz-value') as Textfield;
        let inputSource : Textfield = this.shadowRoot.getElementById('viz-source') as Textfield;

        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let desc : string = inputDesc ? inputDesc.value : '';
        let value : string = inputValue ? inputValue.value : '';
        let source : string = inputSource ? inputSource.value : '';

        if (label && value) {
            let jsonRes = {
                type: ["Visualization"],
                label: [label],
                value: [value],
            };
            if (desc) jsonRes["description"] = [desc];
            if (source) jsonRes["hadPrimarySource"] = [{id: source, type: "Thing"}];

            return VisualizationFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
            if (!value) (<any>inputValue).onBlur();
        }
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.visualizations;
    }
}
