import { ModelCatalogResource } from './resource';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { IdMap } from "app/reducers";

import { datasetSpecificationGet, datasetSpecificationsGet, datasetSpecificationPost, datasetSpecificationPut, datasetSpecificationDelete } from 'model-catalog/actions';
import { DatasetSpecification, DatasetSpecificationFromJSON } from '@mintproject/modelcatalog_client';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('model-catalog-dataset-specification')
export class ModelCatalogDatasetSpecification extends connect(store)(ModelCatalogResource)<DatasetSpecification> {
    static get styles() {
        return [ExplorerStyles, SharedStyles, this.getBasicStyles(), css`
        .two-inputs > wl-textfield, 
        .two-inputs > wl-select {
            display: inline-block;
            width: 50%;
        }`];
    }

    protected classes : string = "resource dataset-specification";
    protected name : string = "dataset specification";
    protected pname : string = "dataset specifications";
    protected resourcesGet = datasetSpecificationsGet;
    protected resourceGet = datasetSpecificationGet;
    protected resourcePost = datasetSpecificationPost;
    protected resourcePut = datasetSpecificationPut;
    protected resourceDelete = datasetSpecificationDelete;
    protected positionAttr : string = "position";

    protected _renderTableHeader () {
        return html`
            <th><b>Input name</b></th>
            <th><b>Description</b></th>
        `;
    }

    protected _renderRow (r:DatasetSpecification) {
        return html`
            <td>
                <code>${getLabel(r)}</code> 
                ${r.hasFormat && r.hasFormat.length === 1 ?  
                        html`<span class="monospaced" style="color: gray;">(.${r.hasFormat})<span>` : ''}
            </td>
            <td>
                <b>${r.description ? r.description[0] : ''}</b>
            </td>
        `;
    }

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <form>
            <wl-textfield id="ds-label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textarea id="ds-desc" label="Description" required
                value=${edResource && edResource.description ? edResource.description[0] : ''}>
            </wl-textarea>
            <div class="two-inputs">
                <wl-textfield id="ds-format" label="Format" required
                    value="${edResource && edResource.hasFormat ? edResource.hasFormat[0] : ''}" >
                </wl-textfield>
                <wl-textfield type="number" id="ds-dim" label="Dimensionality"
                    value="${edResource && edResource.hasDimensionality ? edResource.hasDimensionality[0] : ''}">
                </wl-textfield>
            </div>
        </form>`;
    }

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('ds-label') as Textfield;
        let inputDesc : Textfield = this.shadowRoot.getElementById('ds-desc') as Textfield;
        let inputFormat : Textfield = this.shadowRoot.getElementById('ds-format') as Textfield;
        let inputDim : Textfield = this.shadowRoot.getElementById('ds-dim') as Textfield;
        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let desc : string = inputDesc ? inputDesc.value : '';
        let format : string = inputFormat ? inputFormat.value : '';
        let dim : string = inputDim ? inputDim.value : '';
        if (label && desc &&  format) {
            let jsonRes = {
                type: ["DatasetSpecification"],
                label: [label],
                description: [desc],
                hasFormat: [format],
                position: [this._resources.length + 1]
            };
            if (dim != '') {
                jsonRes["hasDimensionality"] = [dim];
            }
            return DatasetSpecificationFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
            if (!desc) (<any>inputDesc).onBlur();
            if (!format) (<any>inputFormat).onBlur();
        }
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.datasetSpecifications;
    }
}
