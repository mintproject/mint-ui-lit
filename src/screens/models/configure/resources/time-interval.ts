import { ModelCatalogResource } from './resource';
import { TimeInterval } from '@mintproject/modelcatalog_client';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { timeIntervalGet, timeIntervalsGet } from 'model-catalog/actions';

@customElement('model-catalog-time-interval')
export class ModelCatalogTimeInterval extends connect(store)(ModelCatalogResource)<TimeInterval> {
    protected classes : string = "resource time-interval";
    protected name : string = "time interval";
    protected pname : string = "time intervals";
    protected resourcesGet = timeIntervalsGet;
    protected resourceGet = timeIntervalGet;

    protected _renderResource (r:TimeInterval) {
        return html`
            <span style="line-height: 20px; display: flex; justify-content: space-between;">
                <span style="margin-right: 30px; text-decoration: underline;">
                    ${getLabel(r)}
                </span>
                <span> 
                    ${r.intervalValue}
                    ${r.intervalUnit ? getLabel(r.intervalUnit[0]) : ''}
                </span>
            </span>
            <span style="line-height: 20px; font-style: oblique; color: gray;">
                ${r.description} 
            </span>
        `;
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.timeIntervals;
    }
}
