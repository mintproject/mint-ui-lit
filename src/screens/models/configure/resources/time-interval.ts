import { ModelCatalogResource } from './resource';
import { TimeInterval, Unit, TimeIntervalFromJSON } from '@mintproject/modelcatalog_client';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { timeIntervalGet, timeIntervalsGet, timeIntervalPost, timeIntervalPut, timeIntervalDelete } from 'model-catalog/actions';
import { IdMap } from "app/reducers";

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('model-catalog-time-interval')
export class ModelCatalogTimeInterval extends connect(store)(ModelCatalogResource)<TimeInterval> {
    static get styles() {
        return [ExplorerStyles, SharedStyles, this.getBasicStyles(), css`
        .two-inputs > wl-textfield, 
        .two-inputs > wl-select {
            display: inline-block;
            width: 50%;
        }`];
    }

    protected classes : string = "resource time-interval";
    protected name : string = "time interval";
    protected pname : string = "time intervals";
    protected resourcesGet = timeIntervalsGet;
    protected resourceGet = timeIntervalGet;
    protected resourcePost = timeIntervalPost;
    protected resourcePut = timeIntervalPut;
    protected resourceDelete = timeIntervalDelete;

    private _units : IdMap<Unit> = {
        'https://w3id.org/okn/i/mint/dayT':
            { id: 'https://w3id.org/okn/i/mint/dayT', label: ['day']},
        'https://w3id.org/okn/i/mint/hourT':
            { id: 'https://w3id.org/okn/i/mint/hourT', label: ['hour']},
        'https://w3id.org/okn/i/mint/yearT':
            { id: 'https://w3id.org/okn/i/mint/yearT', label: ['year']},
        'https://w3id.org/okn/i/mint/minT':
            { id: 'https://w3id.org/okn/i/mint/minT', label: ['min']},
        'https://w3id.org/okn/i/mint/variable':
            { id: 'https://w3id.org/okn/i/mint/variable', label: ['variable']}
    } as IdMap<Unit>;

    protected _renderResource (r:TimeInterval) {
        return html`
            <span style="line-height: 20px; display: flex; justify-content: space-between;">
                <span style="margin-right: 30px; text-decoration: underline;">
                    ${getLabel(r)}
                </span>
                <span class="monospaced"> 
                    ${r.intervalValue}
                    ${r.intervalUnit ? 
                        getLabel(this._units[r.intervalUnit[0].id] ? this._units[r.intervalUnit[0].id] : r.intervalUnit[0])
                        : ''}
                </span>
            </span>
            <span style="line-height: 20px; font-style: oblique; color: gray;">
                ${r.description} 
            </span>
        `;
    }

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <form>
            <wl-textfield id="time-interval-label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textarea id="time-interval-desc" label="Description" required
                value=${edResource && edResource.description ? edResource.description[0] : ''}>
            </wl-textarea>
            <div class="two-inputs">
                <wl-textfield id="time-interval-value" label="Interval value"
                    value="${edResource && edResource.intervalValue ? edResource.intervalValue[0] : ''}" >
                </wl-textfield>
                <wl-select id="time-interval-unit" label="Interval unit"
                    value="${edResource && edResource.intervalUnit ? edResource.intervalUnit[0].id:''}">
                    <option value="">None</option>
                    ${Object.values(this._units).map((unit:Unit) => html`
                        <option value="${unit.id}">${unit.label}</option>
                    `)}
                </wl-select>
            </div>
        </form>`;
    }

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('time-interval-label') as Textfield;
        let inputDesc : Textarea = this.shadowRoot.getElementById('time-interval-desc') as Textarea;
        let inputValue : Textfield = this.shadowRoot.getElementById('time-interval-value') as Textfield;
        let inputUnit : Select = this.shadowRoot.getElementById('time-interval-unit') as Select;
        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let desc : string = inputDesc ? inputDesc.value : '';
        let value : string = inputValue ? inputValue.value : '';
        let unit : string = inputUnit ? inputUnit.value : '';
        if (label && desc) {
            let jsonRes = {
                type: ["TimeInterval"],
                label: [label],
                description: [desc],
            };
            if (value) jsonRes['intervalUnit'] = [{id: unit}];
            if (value) jsonRes['intervalValue'] = [value];
            return TimeIntervalFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
            if (!desc) (<any>inputDesc).onBlur();
        }
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.timeIntervals;
    }
}
