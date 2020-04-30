import { ModelCatalogResource } from './resource';
import { TimeInterval } from '@mintproject/modelcatalog_client';
import { property, html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getId, getLabel } from 'model-catalog/util';
import { timeIntervalGet } from 'model-catalog/actions';

@customElement('model-catalog-time-interval')
export class ModelCatalogTimeInterval extends connect(store)(ModelCatalogResource)<TimeInterval> {
    @property({type: Boolean}) public updateOnce : boolean = false;

    protected _renderEmpty () {
        return 'No time interval';
    }

    protected _renderResource (r:TimeInterval) {
        return html`
            <span class="resource time-interval" style="line-height: 20px;">
                <span style="display: flex; justify-content: space-between;">
                    <span style="margin-right: 30px; text-decoration: underline;">
                        ${getLabel(r)}
                    </span>
                    <span> 
                        ${r.intervalValue}
                        ${r.intervalUnit ? getLabel(r.intervalUnit[0]) : ''}
                    </span>
                </span>
                <span style="font-style: oblique; color: gray;">
                    ${r.description} 
                </span>
            </span>
        `;
    }

    public setResources (r:TimeInterval[]) {
        let resources : TimeInterval[] = [...r];
        let shouldLoad : string[] = resources
                .map((r:TimeInterval) => r.id)
                .filter((id:string) => !this._loading[id] || !this._loadedResources[id]);

        if (shouldLoad.length > 0) {
            let db = (store.getState() as RootState).modelCatalog;
            Promise.all(
                shouldLoad.map((id:string) => {
                    if (db.timeIntervals[id])  {
                        this._loadedResources[id] = db.timeIntervals[id];
                        return null;
                    } else {
                        this._loading[id] = true;
                        let req = store.dispatch(timeIntervalGet(id));
                        req.then((ti:TimeInterval) => {
                            this._loading[id] = false;
                            this._loadedResources[id] = ti;
                            if (!this.updateOnce) this.requestUpdate();
                        });
                        return req;
                    }
                })
            ).then((tis:TimeInterval[]) => {
                if (this.updateOnce) this.requestUpdate();
            });
        }

        this._resources = resources;
    }
}
