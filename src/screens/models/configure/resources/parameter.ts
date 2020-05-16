import { ModelCatalogResource, Action } from './resource';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { IdMap } from "app/reducers";

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { parameterGet, parametersGet, parameterPost, parameterPut, parameterDelete } from 'model-catalog/actions';
import { Parameter, ParameterFromJSON } from '@mintproject/modelcatalog_client';

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

const renderParameterType = (param:Parameter) => {
    let ptype = param.type.filter(p => p != 'Parameter').map(uri => uri.split('#').pop())
    return html`
        ${ptype} ${param.hasDataType ? html`(<span class="monospaced">${param.hasDataType}</span>)` : ''}
        ${(param.hasMinimumAcceptedValue || param.hasMaximumAcceptedValue) ?
            html`<br/><span style="font-size: 11px;">
                Range is 
                ${param.hasMinimumAcceptedValue ? html`from ${param.hasMinimumAcceptedValue}` : ''}
                ${param.hasMaximumAcceptedValue ? html`to ${param.hasMaximumAcceptedValue}` : ''}
            </span>` : '' }
    `
}

@customElement('model-catalog-parameter')
export class ModelCatalogParameter extends connect(store)(ModelCatalogResource)<Parameter> {
    static get styles() {
        return [ExplorerStyles, SharedStyles, this.getBasicStyles(), css`
        .min-max-input {
            display: grid;
            grid-template-columns: 25% 50% 25%;
        }`];
    }

    protected classes : string = "resource parameter";
    protected name : string = "parameter";
    protected pname : string = "parameters";
    protected resourcesGet = parametersGet;
    protected resourceGet = parameterGet;
    protected resourcePost = parameterPost;
    protected resourcePut = parameterPut;
    protected resourceDelete = parameterDelete;
    protected colspan = 3;

    protected _renderTableColgroup () {
        if (this._action === Action.EDIT_OR_ADD) 
            return html`
                <col span="1">
                <col span="1">
                <col span="1">
                <col span="1" style="width: 30px;">
            `;
        else return html`
            <col span="1">
            <col span="1">
            <col span="1">
        `;
    }

    protected _renderTableHeader () {
        return html`
            <th><b>Label</b></th>
            <th><b>Type</b></th>
            <th><b>Default Value</b></th>
        `;
    }

    protected _renderRow (r:Parameter) {
        return html`
            <td>
                <code>${getLabel(r)}</code><br/>
                <b>${r.description ? r.description[0] : ''}</b>
            </td>
            <td>${renderParameterType(r)}</td>
            <td>
                ${r.hasDefaultValue ? r.hasDefaultValue : '-'}
                ${r.usesUnit ? r.usesUnit[0].label : ''}
            </td>
        `;
    }

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <form>
            <wl-textfield id="parameter-label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textarea id="parameter-desc" label="Description" required
                value=${edResource && edResource.description ? edResource.description[0] : ''}>
            </wl-textarea>

            <div class="min-max-input">
                <wl-textfield
                    type="number"
                    id="parameter-min-value" label="Minimum"
                    value="${edResource && edResource.hasMinimumAcceptedValue ? edResource.hasMinimumAcceptedValue[0] : '' }">
                </wl-textfield>
                <wl-textfield required
                    type="number"
                    id="parameter-default-value" label="Default value"
                    value="${edResource && edResource.hasDefaultValue}">
                </wl-textfield>
                <wl-textfield 
                    type="number"
                    id="parameter-max-value" label="Maximum"
                    value="${edResource && edResource.hasMaximumAcceptedValue ? edResource.hasMaximumAcceptedValue[0] : ''}">
                </wl-textfield>
            </div>
        </form>`;
    }

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('parameter-label') as Textfield;
        let inputDesc : Textarea = this.shadowRoot.getElementById('parameter-desc') as Textarea;
        let inputMin : Textfield = this.shadowRoot.getElementById('parameter-min-value') as Textfield;
        let inputDefault : Textfield = this.shadowRoot.getElementById('parameter-default-value') as Textfield;
        let inputMax : Textfield = this.shadowRoot.getElementById('parameter-max-value') as Textfield;
        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let desc : string = inputDesc ? inputDesc.value : '';
        let min : string = inputMin ? inputMin.value : '';
        let def : string = inputDefault ? inputDefault.value : '';
        let max : string = inputMax ? inputMax.value : '';
        if (label && desc && def) {
            let jsonRes = {
                type: ["Parameter"],
                description: [desc],
                label: [label],
                hasDefaultValue: [def],
            };
            if (min) jsonRes['hasMinimumAcceptedValue'] = [min];
            if (max) jsonRes['hasMaximumAcceptedValue'] = [max];
            return ParameterFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
            if (!desc) (<any>inputDesc).onBlur();
            if (!def) (<any>inputDefault).onBlur();
        }
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.parameters;
    }
}
