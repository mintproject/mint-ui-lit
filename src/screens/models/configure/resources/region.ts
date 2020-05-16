import { ModelCatalogResource } from './resource';
import { Region, RegionFromJSON } from '@mintproject/modelcatalog_client';
import { property, html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { regionGet, regionsGet, regionPost, regionPut, regionDelete } from 'model-catalog/actions';
import { isSubregion } from 'model-catalog/util';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('model-catalog-region')
export class ModelCatalogRegion extends connect(store)(ModelCatalogResource)<Region> {
    static get styles() {
        return [ExplorerStyles, SharedStyles, this.getBasicStyles(), css`
        .two-inputs > wl-textfield, 
        .two-inputs > wl-select {
            display: inline-block;
            width: 50%;
        }`];
    }

    @property({type: String}) private _topRegionUri : string = "";
    @property({type: Boolean}) protected _creationEnabled : boolean = false;
    @property({type: Boolean}) protected _editionEnabled : boolean = false;
    @property({type: Boolean}) protected _deleteEnabled : boolean = false;

    protected classes : string = "resource region";
    protected name : string = "region";
    protected pname : string = "regions";
    protected resourcesGet = regionsGet;
    protected resourceGet = regionGet;
    protected resourcePut = regionPut;
    protected resourcePost = regionPost;
    protected resourceDelete = regionDelete;

    constructor () {
        super();
        this._filters.push(
            (r:Region) => !this._topRegionUri || isSubregion(this._topRegionUri, r)
        );
    }


    /*protected _renderResource (r:Region) {
        return html`
            <div class="one-line" style="text-decoration:underline; color:black;">
                ${getLabel(r)}
            </div>
            <div class="one-line" style="display: flex; justify-content: space-between;">
                <span style="margin-right: 10px;">
                    <span style="font-size:12px">Spatial res:</span>
                    <span class="monospaced" style="color:black">
                        ${r.hasSpatialResolution && r.hasSpatialResolution.length > 0 ? r.hasSpatialResolution[0] : '-'}
                    </span>
                </span>
                <span style="margin-right: 10px;">
                    <span style="font-size:12px">Dimensions:</span>
                    <span class="number" style="color:black">
                        ${r.hasDimension && r.hasDimension.length > 0 ? r.hasDimension[0] : '-'}
                    </span>
                </span>
                <span style="margin-right: 10px;" class="one-line">
                    <span style="font-size:12px">Shape:</span>
                    <span class="monospaced" style="color:black">
                        ${r.hasShape && r.hasShape.length > 0 ? r.hasShape[0] : '-'}
                    </span>
                </span>
            </div>
        `;
    }

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <form>
            <wl-textfield id="region-name" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textarea id="region-desc" label="Description" required
                value=${edResource && edResource.description ? edResource.description[0] : ''}>
            </wl-textarea>
            <wl-textfield id="region-spatial-res" label="Spatial resolution"
                value=${edResource && edResource.hasSpatialResolution ? edResource.hasSpatialResolution[0] : ''}>
            </wl-textfield>
            <div class="two-inputs">
                <wl-select id="region-dim" label="Dimension"
                    value=${edResource && edResource.hasDimension ? edResource.hasDimension[0] : ''}>
                    <option value selected>None</option>
                    <option value="0D">0D</option>
                    <option value="1D">1D</option>
                    <option value="2D">2D</option>
                    <option value="3D">3D</option>
                </wl-select>
                <wl-select id="region-shape" label="Shape"
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
        let inputLabel : Textfield  = this.shadowRoot.getElementById('region-name') as Textfield;
        let inputDesc  : Textarea   = this.shadowRoot.getElementById('region-desc') as Textarea;
        let inputSpRes : Textfield  = this.shadowRoot.getElementById('region-spatial-res') as Textfield;
        let inputDim   : Select     = this.shadowRoot.getElementById('region-dim') as Select;
        let inputShape : Select     = this.shadowRoot.getElementById('region-shape') as Select;
        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let desc : string = inputDesc ? inputDesc.value : '';
        let spRes : string = inputSpRes ? inputSpRes.value : '';
        let dim : string = inputDim ? inputDim.value : '';
        let shape : string = inputShape ? inputShape.value : '';
        if (label && desc) {
            let jsonRes = {
                type: ["Region"],
                label: [label],
                description: [desc],
            };
            if (spRes) jsonRes['hasSpatialResolution'] = [spRes];
            if (dim) jsonRes['hasDimension'] = [dim];
            if (shape) {
                jsonRes['hasShape'] = [shape];
                if (shape === 'Triangular' || shape === 'Block structure')
                    jsonRes.type.push("SpatiallyDistributedRegion");
                else if (shape === 'Point')
                    jsonRes.type.push("PointBasedRegion");
            }
            return RegionFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).refreshAttributes();
            if (!desc) (<any>inputDesc).refreshAttributes();
        }
    }*/

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.regions;
    }

    stateChanged(state: RootState) {
        if (state.ui && state.regions && state.regions.regions && state.ui.selected_top_regionid &&
            state.regions.regions[state.ui.selected_top_regionid] &&
            state.regions.regions[state.ui.selected_top_regionid].model_catalog_uri 
                != this._topRegionUri) {
            this._topRegionUri =
                    state.regions.regions[state.ui.selected_top_regionid].model_catalog_uri;
        }
    }
}
