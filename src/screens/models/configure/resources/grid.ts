import { ModelCatalogResource } from './resource';
import { Grid, GridFromJSON } from '@mintproject/modelcatalog_client';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { gridGet, gridsGet, gridPost, gridPut, gridDelete } from 'model-catalog/actions';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('model-catalog-grid')
export class ModelCatalogGrid extends connect(store)(ModelCatalogResource)<Grid> {
    static get styles() {
        return [ExplorerStyles, SharedStyles, this.getBasicStyles(), css`
        .two-inputs > wl-textfield, 
        .two-inputs > wl-select {
            display: inline-block;
            width: 50%;
        }`];
    }

    protected classes : string = "resource grid";
    protected name : string = "grid";
    protected pname : string = "grids";
    protected resourcesGet = gridsGet;
    protected resourceGet = gridGet;
    protected resourcePut = gridPut;
    protected resourcePost = gridPost;
    protected resourceDelete = gridDelete;

    protected _renderResource (r:Grid) {
        let additionalTypes : string[] = (r.type || []).filter((s:string) => s != "Grid" && s != "https://w3id.org/okn/o/sdm#Grid");
        return html`
            <div class="one-line" style="display: flex; justify-content: space-between;">
                <span style="text-decoration:underline; color:black;"> ${getLabel(r)} </span>
                ${additionalTypes.length > 0 ? html`
                <span style="margin-left: 10px; font-style: oblique;">
                    ${additionalTypes.join(', ')}
                </span>
                ` : ''}
            </div>
            ${r.hasSpatialResolution || r.hasDimension || r.hasShape ? html`
            <div class="one-line" style="display: flex; justify-content: space-between;">
                ${r.hasSpatialResolution && r.hasSpatialResolution.length > 0 ? html`
                <span style="margin-right: 10px;">
                    <span style="font-size:12px">Spatial res:</span>
                    <span class="monospaced" style="color:black">
                        ${r.hasSpatialResolution[0]}
                    </span>
                </span>`: ''}

                ${r.hasDimension && r.hasDimension.length > 0 ? html`
                <span style="margin-right: 10px;">
                    <span style="font-size:12px">Dimensions:</span>
                    <span class="number" style="color:black">
                        ${r.hasDimension[0]}
                    </span>
                </span>`: ''}

                ${r.hasShape && r.hasShape.length > 0 ? html`
                <span class="one-line">
                    <span style="font-size:12px">Shape:</span>
                    <span class="monospaced" style="color:black">
                        ${r.hasShape[0]}
                    </span>
                </span>
                ` : ''}
            </div>
            ` : ''}
        `;
    }

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <form>
            <wl-textfield id="grid-name" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textarea id="grid-desc" label="Description" required
                value=${edResource && edResource.description ? edResource.description[0] : ''}>
            </wl-textarea>
            <wl-textfield id="grid-spatial-res" label="Spatial resolution"
                value=${edResource && edResource.hasSpatialResolution ? edResource.hasSpatialResolution[0] : ''}>
            </wl-textfield>
            <div class="two-inputs">
                <wl-select id="grid-dim" label="Dimension"
                    value=${edResource && edResource.hasDimension ? edResource.hasDimension[0] : ''}>
                    <option value selected>None</option>
                    <option value="0D">0D</option>
                    <option value="1D">1D</option>
                    <option value="2D">2D</option>
                    <option value="3D">3D</option>
                </wl-select>
                <wl-select id="grid-shape" label="Shape"
                    value=${edResource && edResource.hasShape ? edResource.hasShape[0] : ''}>
                    <option value selected>None</option>
                    <option value="Point">Point</option>
                    <option value="Triangular">Triangular</option>
                    <option value="Block structure">Block structure</option>
                </wl-select>
            </div>
        </form>`;
    }

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputLabel : Textfield  = this.shadowRoot.getElementById('grid-name') as Textfield;
        let inputDesc  : Textarea   = this.shadowRoot.getElementById('grid-desc') as Textarea;
        let inputSpRes : Textfield  = this.shadowRoot.getElementById('grid-spatial-res') as Textfield;
        let inputDim   : Select     = this.shadowRoot.getElementById('grid-dim') as Select;
        let inputShape : Select     = this.shadowRoot.getElementById('grid-shape') as Select;
        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let desc : string = inputDesc ? inputDesc.value : '';
        let spRes : string = inputSpRes ? inputSpRes.value : '';
        let dim : string = inputDim ? inputDim.value : '';
        let shape : string = inputShape ? inputShape.value : '';
        if (label && desc) {
            let jsonRes = {
                type: ["Grid"],
                label: [label],
                description: [desc],
            };
            if (spRes) jsonRes['hasSpatialResolution'] = [spRes];
            if (dim) jsonRes['hasDimension'] = [dim];
            if (shape) {
                jsonRes['hasShape'] = [shape];
                if (shape === 'Triangular' || shape === 'Block structure')
                    jsonRes.type.push("SpatiallyDistributedGrid");
                else if (shape === 'Point')
                    jsonRes.type.push("PointBasedGrid");
            }
            return GridFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).refreshAttributes();
            if (!desc) (<any>inputDesc).refreshAttributes();
        }
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.grids;
    }
}
