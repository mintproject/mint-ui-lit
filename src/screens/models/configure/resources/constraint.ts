import { ModelCatalogResource } from './resource';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store } from 'app/store';
import { getLabel } from 'model-catalog-api/util';
import { Constraint, ConstraintFromJSON } from '@mintproject/modelcatalog_client';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles';
import { ModelCatalogVariablePresentation } from './variable-presentation';

import { BaseAPI } from '@mintproject/modelcatalog_client';
import { DefaultReduxApi } from 'model-catalog-api/default-redux-api';
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';

@customElement('model-catalog-constraint')
export class ModelCatalogConstraint extends connect(store)(ModelCatalogResource)<Constraint> {
    static get styles() {
        return [ExplorerStyles, SharedStyles, this.getBasicStyles(), css`
        #input-variable-presentation {
            --list-height: 180px;
            --dialog-height: 100%;
        }
        .two-inputs > wl-textfield, 
        .two-inputs > wl-select {
            display: inline-block;
            width: 50%;
        }`];
    }
    protected classes : string = "resource constraint";
    protected name : string = "constraint";
    protected pname : string = "constraints";

    protected resourceApi : DefaultReduxApi<Constraint,BaseAPI> = ModelCatalogApi.myCatalog.constraint;
    private _inputVariablePresentation : ModelCatalogVariablePresentation;

    public pageMax : number = 10

    constructor () {
        super();
        this._inputVariablePresentation = new ModelCatalogVariablePresentation();
        this._inputVariablePresentation.setActionMultiselect();
        this._inputVariablePresentation.setAttribute('id', 'input-variable-presentation');
    }

    //export interface Constraint {
    //    id?: string;
    //    type?: Array<string> | null;
    //    label?: Array<string> | null;
    //    description?: Array<string> | null;
    //    hasVariable?: Array<VariablePresentation> | null;
    //    hasRule?: string | null;
    //}

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <form>
            <wl-textfield id="label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textfield id="description" label="Description" required
                value=${edResource && edResource.description ? edResource.description[0] : ''}>
            </wl-textfield>

            <span style="margin: 10px 0px 3px 0px; display: block; font-size: small;">Rule:</span>
            <textarea id="rule" name="Rule" style="width: 100%;" rows="5">${
                edResource && edResource.hasRule ? edResource.hasRule : ''
            }</textarea>

            <div style="min-height:50px; padding: 10px 0px;">
                <div style="padding-top: 10px; font-weight: bold;">Variables:</div>
                ${this._inputVariablePresentation}
            </div>
        </form>`;
    }

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('label') as Textfield;
        let inputDesc : Textfield = this.shadowRoot.getElementById('description') as Textfield;
        let inputRule : Textarea = this.shadowRoot.getElementById('rule') as Textarea;

        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let desc : string = inputDesc ? inputDesc.value : '';
        let rule : string = inputRule ? inputRule.value : '';
        
        if (label) {
            let jsonRes = {
                type: ["Constraint"],
                label: [label],
                hasVariable: this._inputVariablePresentation.getResources(),
            };
            jsonRes["description"] = (desc) ? [desc] : [];
            jsonRes["hasRule"] = (rule) ? [rule] : [];

            return ConstraintFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
        }
    }

    protected _createResource () {
        this._inputVariablePresentation.setResources(null);
        super._createResource();
    }

    protected _editResource (r:Constraint) {
        super._editResource(r);
        let ed : Constraint = this._getEditingResource();
        this._inputVariablePresentation.setResources( ed.hasVariable );
    }
}