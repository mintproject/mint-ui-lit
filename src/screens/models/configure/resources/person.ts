import { ModelCatalogResource } from './resource';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { Person, PersonFromJSON } from '@mintproject/modelcatalog_client';
import { IdMap } from "app/reducers";

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

import { BaseAPI } from '@mintproject/modelcatalog_client';
import { DefaultReduxApi } from 'model-catalog-api/default-redux-api';
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';

@customElement('model-catalog-person')
export class ModelCatalogPerson extends connect(store)(ModelCatalogResource)<Person> {
    protected classes : string = "resource author";
    protected name : string = "person";
    protected pname : string = "persons";

    protected resourceApi : DefaultReduxApi<Person,BaseAPI> = ModelCatalogApi.myCatalog.person;

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <form>
            <wl-textfield id="person-label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textarea id="person-email" label="E-mail"
                value=${edResource && edResource.email ? edResource.email[0] : ''}>
            </wl-textarea>
            <wl-textfield id="person-web" label="Website"
                value=${edResource && edResource.website ? edResource.website[0] : ''}>
            </wl-textfield>
        </form>`;
    }

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('person-label') as Textfield;
        let inputEmail : Textarea  = this.shadowRoot.getElementById('person-email') as Textarea;
        let inputWeb   : Textfield = this.shadowRoot.getElementById('person-web') as Textfield;
        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let email : string = inputEmail ? inputEmail.value : '';
        let web : string = inputWeb ? inputWeb.value : '';
        if (label) {
            let jsonRes = {
                type: ["Person"],
                label: [label],
            };
            if (email) jsonRes['email'] = [email];
            if (web) jsonRes['website'] = [web];
            return PersonFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
        }
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.persons;
    }
}
