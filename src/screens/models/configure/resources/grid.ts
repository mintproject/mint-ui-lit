import { ModelCatalogResource } from './resource';
import { Grid } from '@mintproject/modelcatalog_client';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { gridGet, gridsGet } from 'model-catalog/actions';

@customElement('model-catalog-grid')
export class ModelCatalogGrid extends connect(store)(ModelCatalogResource)<Grid> {
    protected classes : string = "resource grid";
    protected name : string = "grid";
    protected pname : string = "grids";
    protected resourcesGet = gridsGet;
    protected resourceGet = gridGet;

    protected _renderResource (r:Grid) {
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

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.grids;
    }
}
