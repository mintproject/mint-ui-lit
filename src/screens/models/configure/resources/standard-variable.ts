import { ModelCatalogResource } from './resource';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { standardVariableGet, standardVariablesGet, standardVariablePost, standardVariablePut, standardVariableDelete } from 'model-catalog/actions';
import { StandardVariable, StandardVariableFromJSON } from '@mintproject/modelcatalog_client';
import { IdMap } from "app/reducers";

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';

@customElement('model-catalog-standard-variable')
export class ModelCatalogStandardVariable extends connect(store)(ModelCatalogResource)<StandardVariable> {
    protected classes : string = "resource standard-variable";
    protected name : string = "standard variable";
    protected pname : string = "standard variables";
    protected resourcesGet = standardVariablesGet;
    protected resourceGet = standardVariableGet;
    protected resourcePost = standardVariablePost;
    protected resourcePut = standardVariablePut;
    protected resourceDelete = standardVariableDelete;
    public uniqueLabel : boolean = true;

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <form>
            <wl-textfield id="index-label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textarea id="index-desc" label="Description"
                value=${edResource && edResource.description ? edResource.description[0] : ''}>
            </wl-textarea>
        </form>`;
    }

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('index-label') as Textfield;
        let inputDesc : Textarea = this.shadowRoot.getElementById('index-desc') as Textarea;
        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let desc : string = inputDesc ? inputDesc.value : '';
        if (label) {
            let jsonRes = {
                type: ["StandardVariable"],
                label: [label],
            };
            if (desc) jsonRes['description'] = [desc];
            return StandardVariableFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
        }
    }

    protected _renderResource (r:StandardVariable) {
        if (!r) return html`---`;
        return html`<span style="font-family: monospace;">
            ${getLabel(r)}
        </span>`;
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.standardVariables;
    }
}
