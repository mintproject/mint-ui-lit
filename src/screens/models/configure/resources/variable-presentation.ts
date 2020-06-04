import { ModelCatalogResource } from './resource';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { variablePresentationGet, variablePresentationsGet, variablePresentationPost, variablePresentationPut, variablePresentationDelete } from 'model-catalog/actions';
import { VariablePresentation, VariablePresentationFromJSON } from '@mintproject/modelcatalog_client';
import { IdMap } from "app/reducers";

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('model-catalog-variable-presentation')
export class ModelCatalogVariablePresentation extends connect(store)(ModelCatalogResource)<VariablePresentation> {
    protected classes : string = "resource variable-presentation";
    protected name : string = "variable presentation";
    protected pname : string = "variable presentations";
    protected resourcesGet = variablePresentationsGet;
    protected resourceGet = variablePresentationGet;
    protected resourcePost = variablePresentationPost;
    protected resourcePut = variablePresentationPut;
    protected resourceDelete = variablePresentationDelete;

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <form>
            <wl-textfield id="var-label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
        </form>`;
    }

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('var-label') as Textfield;
        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        if (label) {
            let jsonRes = {
                type: ["VariablePresentation"],
                label: [label],
            };
            return VariablePresentationFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
        }
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.variablePresentations;
    }
}
