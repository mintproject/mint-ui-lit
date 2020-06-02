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
            <wl-textfield id="index-label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textarea id="index-desc" label="Description" required
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
        if (label && desc) {
            let jsonRes = {
                type: ["NumericalIndex"],
                label: [label],
                description: [desc],
            };
            return NumericalIndexFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
            if (!desc) (<any>inputDesc).onBlur();
        }
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.numericalIndexes;
    }
}
