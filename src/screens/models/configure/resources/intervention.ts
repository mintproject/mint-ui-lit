import { ModelCatalogResource } from './resource';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { Intervention, InterventionFromJSON } from '@mintproject/modelcatalog_client';
import { IdMap } from "app/reducers";

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

import { BaseAPI } from '@mintproject/modelcatalog_client';
import { DefaultReduxApi } from 'model-catalog-api/default-redux-api';
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';

@customElement('model-catalog-intervention')
export class ModelCatalogIntervention extends connect(store)(ModelCatalogResource)<Intervention> {
    protected classes : string = "resource intervention";
    protected name : string = "intervention";
    protected pname : string = "interventions";

    protected resourceApi : DefaultReduxApi<Intervention,BaseAPI> = ModelCatalogApi.myCatalog.intervention;

    protected _renderResource (r:Intervention) {
        return html`
            <b>${getLabel(r)}</b>
            ${r.description ? html`<div>${r.description[0]}</div>` : ''}
        `;
    }

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <form>
            <wl-textfield id="i-label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textfield id="i-desc" label="Description"
                value=${edResource && edResource.description ? edResource.description[0] : ''}>
            </wl-textfield>
        </form>`;
    }

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('i-label') as Textfield;
        let inputDesc : Textfield = this.shadowRoot.getElementById('i-desc') as Textfield;
        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let desc : string = inputDesc ? inputDesc.value : '';

        if (label) {
            let jsonRes = {
                type: ["Intervention"],
                label: [label],
                description: desc ? [desc] : [],
            };

            return InterventionFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
        }
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.interventions;
    }
}
