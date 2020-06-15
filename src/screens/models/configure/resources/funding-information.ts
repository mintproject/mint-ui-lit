import { ModelCatalogResource } from './resource';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { fundingInformationGet, fundingInformationsGet, fundingInformationPost, fundingInformationPut, fundingInformationDelete } from 'model-catalog/actions';
import { FundingInformation, FundingInformationFromJSON } from '@mintproject/modelcatalog_client';
import { IdMap } from "app/reducers";

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('model-catalog-funding-information')
export class ModelCatalogFundingInformation extends connect(store)(ModelCatalogResource)<FundingInformation> {
    protected classes : string = "resource funding-information";
    protected name : string = "funding information";
    protected pname : string = "funding information";
    protected resourcesGet = fundingInformationsGet;
    protected resourceGet = fundingInformationGet;
    protected resourcePost = fundingInformationPost;
    protected resourcePut = fundingInformationPut;
    protected resourceDelete = fundingInformationDelete;

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <form>
            <wl-textfield id="f-label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textarea id="f-desc" label="Description"
                value=${edResource && edResource.description ? edResource.description[0] : ''}>
            </wl-textarea>
            <wl-textarea id="f-grant" label="Grant"
                value=${edResource && edResource.fundingGrant ? edResource.fundingGrant[0] : ''}>
            </wl-textarea>
        </form>`;
    }

/* export interface FundingInformation {
    description?: Array<string> | null;
    label?: Array<string> | null;
    type?: Array<string> | null;
    fundingGrant?: Array<string> | null;

    fundingSource?: Array<Organization> | null;
}*/

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('f-label') as Textfield;
        let inputDesc : Textarea = this.shadowRoot.getElementById('f-desc') as Textarea;
        let inputGrant : Textarea = this.shadowRoot.getElementById('f-grant') as Textarea;

        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let desc : string = inputDesc ? inputDesc.value : '';
        let grant : string = inputGrant ? inputGrant.value : '';

        if (label) {
            let jsonRes = {
                type: ["FundingInformation"],
                label: [label],
            };
            if (desc) jsonRes["description"] = [desc];
            if (grant) jsonRes["fundingGrant"] = [grant];

            return FundingInformationFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
        }
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.fundingInformations;
    }
}
