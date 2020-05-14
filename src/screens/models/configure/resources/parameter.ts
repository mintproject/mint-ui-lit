import { ModelCatalogResource } from './resource';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { IdMap } from "app/reducers";

import { parameterGet, parametersGet, parameterPost, parameterPut, parameterDelete } from 'model-catalog/actions';
import { Parameter, ParameterFromJSON } from '@mintproject/modelcatalog_client';

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('model-catalog-parameter')
export class ModelCatalogParameter extends connect(store)(ModelCatalogResource)<Parameter> {
    protected classes : string = "resource parameter";
    protected name : string = "parameter";
    protected pname : string = "parameters";
    protected resourcesGet = parametersGet;
    protected resourceGet = parameterGet;
    protected resourcePost = parameterPost;
    protected resourcePut = parameterPut;
    protected resourceDelete = parameterDelete;

    /*protected _renderResource (r:Parameter) {
        console.log(r);
        let label : string = getLabel(r);
        let sp : string[] = label.split(':');
        let url : string = (sp.length > 0) ? 
                "https://hub.docker.com/r/" + sp[0] + "/tags" : '#';
        return html`<a target="_blank" href="${url}">${getLabel(r)}</a>`;
    }

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <form>
            <wl-textfield id="time-interval-label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
        </form>`;
    }

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('time-interval-label') as Textfield;
        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        if (label) {
            let jsonRes = {
                type: ["Parameter"],
                label: [label],
            };
            return ParameterFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
        }
    }*/

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.parameters;
    }
}
