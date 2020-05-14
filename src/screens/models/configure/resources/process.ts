import { ModelCatalogResource } from './resource';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { processGet, processesGet, processPost, processPut, processDelete } from 'model-catalog/actions';
import { Process, ProcessFromJSON } from '@mintproject/modelcatalog_client';
import { IdMap } from "app/reducers";

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('model-catalog-process')
export class ModelCatalogProcess extends connect(store)(ModelCatalogResource)<Process> {
    static get styles() {
        return [ExplorerStyles, SharedStyles, this.getBasicStyles(), css`
        .two-inputs > wl-textfield, 
        .two-inputs > wl-select {
            display: inline-block;
            width: 50%;
        }`];
    }

    protected classes : string = "resource process";
    protected name : string = "process";
    protected pname : string = "processs";
    protected resourcesGet = processesGet;
    protected resourceGet = processGet;
    protected resourcePost = processPost;
    protected resourcePut = processPut;
    protected resourceDelete = processDelete;

    /*protected _renderForm () {
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
                <wl-select id="time-interval-unit" label="Interval unit" required
                    value="${edResource && edResource.intervalUnit ? edResource.intervalUnit[0].id:''}">
                    <option value disabled>None</option>
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
        if (label && desc && unit) {
            let jsonRes = {
                type: ["TimeInterval"],
                label: [label],
                description: [desc],
                intervalUnit: [ { id: unit } ],
            };
            if (value) {
                jsonRes['intervalValue'] = [value];
            }
            return TimeIntervalFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
            if (!desc) (<any>inputDesc).onBlur();
        }
    }*/

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.processes;
    }
}
