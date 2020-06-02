import { ModelCatalogResource } from './resource';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { numericalIndexGet, numericalIndexsGet, numericalIndexPost, numericalIndexPut, numericalIndexDelete } from 'model-catalog/actions';
import { NumericalIndex, NumericalIndexFromJSON } from '@mintproject/modelcatalog_client';
import { IdMap } from "app/reducers";

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('model-catalog-numerical-index')
export class ModelCatalogNumericalIndex extends connect(store)(ModelCatalogResource)<NumericalIndex> {
    protected classes : string = "resource numerical-index";
    protected name : string = "numerical index";
    protected pname : string = "numerical indexes";
    protected resourcesGet = numericalIndexsGet;
    protected resourceGet = numericalIndexGet;
    protected resourcePost = numericalIndexPost;
    protected resourcePut = numericalIndexPut;
    protected resourceDelete = numericalIndexDelete;

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <form>
            <wl-textfield id="numericalIndex-label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
        </form>`;
    }

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('numericalIndex-label') as Textfield;
        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        if (label) {
            let jsonRes = {
                type: ["NumericalIndex"],
                label: [label],
            };
            return NumericalIndexFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
        }
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.numericalIndexes;
    }
}
