import { ModelCatalogResource } from './resource';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog-api/util';
import { Unit, UnitFromJSON } from '@mintproject/modelcatalog_client';
import { IdMap } from "app/reducers";

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

import { BaseAPI } from '@mintproject/modelcatalog_client';
import { DefaultReduxApi } from 'model-catalog-api/default-redux-api';
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';

@customElement('model-catalog-unit')
export class ModelCatalogUnit extends connect(store)(ModelCatalogResource)<Unit> {
    protected classes : string = "resource unit";
    protected name : string = "unit";
    protected pname : string = "units";

    protected resourceApi : DefaultReduxApi<Unit,BaseAPI> = ModelCatalogApi.myCatalog.unit;

    public pageMax : number = 10

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <form>
            <wl-textfield id="label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textarea id="desc" label="Description"
                value=${edResource && edResource.description ? edResource.description[0] : ''}>
            </wl-textarea>
        </form>`;
    }

/* export interface Unit {
    id?: string;
    label?: Array<string> | null;
    type?: Array<string> | null;
    description?: Array<string> | null;
}*/

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('label') as Textfield;
        let inputDesc : Textarea = this.shadowRoot.getElementById('desc') as Textarea;

        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let desc : string = inputDesc ? inputDesc.value : '';

        if (label) {
            let jsonRes = {
                type: ["Unit"],
                label: [label],
            };
            if (desc) jsonRes["description"] = [desc];

            return UnitFromJSON(jsonRes);
        } else {
            if (!label) (<any>inputLabel).onBlur();
        }
    }
}
