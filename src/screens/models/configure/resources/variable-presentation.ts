import { ModelCatalogResource } from './resource';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { variablePresentationGet, variablePresentationsGet, variablePresentationPost, variablePresentationPut, variablePresentationDelete } from 'model-catalog/actions';
import { VariablePresentation, VariablePresentationFromJSON } from '@mintproject/modelcatalog_client';
import { IdMap } from "app/reducers";

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';
import { ModelCatalogStandardVariable } from './standard-variable';

@customElement('model-catalog-variable-presentation')
export class ModelCatalogVariablePresentation extends connect(store)(ModelCatalogResource)<VariablePresentation> {
    static get styles() {
        return [ExplorerStyles, SharedStyles, this.getBasicStyles(), css`
            .small-tooltip:hover::after {
                width: 200px;
                left: 30%;
            }
        `];
    }

    protected classes : string = "resource variable-presentation";
    protected name : string = "variable presentation";
    protected pname : string = "variable presentations";
    protected resourcesGet = variablePresentationsGet;
    protected resourceGet = variablePresentationGet;
    protected resourcePost = variablePresentationPost;
    protected resourcePut = variablePresentationPut;
    protected resourceDelete = variablePresentationDelete;

    private _inputStandardVariable : ModelCatalogStandardVariable;

    public pageMax : number = 10;
    public inlineMax : number = 4;

    constructor () {
        super();
        this._inputStandardVariable = new ModelCatalogStandardVariable();
        this._inputStandardVariable.setActionMultiselect();
    }

    protected _editResource (r:VariablePresentation) {
        super._editResource(r);
        let edResource = this._getEditingResource();
        this._inputStandardVariable.setResources( edResource.hasStandardVariable );
    }

    protected _createResource () {
        this._inputStandardVariable.setResources(null);
        super._createResource();
    }

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <form>
            <wl-textfield id="var-label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textarea id="var-desc" label="Description"
                value=${edResource && edResource.description ? edResource.description[0] : ''}>
            </wl-textarea>
            <wl-textfield id="var-short-name" label="Short Name" 
                value=${edResource && edResource.hasShortName ? edResource.hasShortName[0] : ''}>
            </wl-textfield>
            <wl-textfield id="var-long-name" label="Long Name" 
                value=${edResource && edResource.hasLongName ? edResource.hasLongName[0] : ''}>
            </wl-textfield>
            <div style="padding: 10px 0px;">
                <div style="padding: 5px 0px; font-weight: bold;">Standard Variables</div>
                ${this._inputStandardVariable}
            </div>
        </form>`;
    }

    protected _renderResource (r:VariablePresentation) {
        let desc : string = r && r.description ? r.description[0] : '';
        return desc ? html`
            <span class="tooltip small-tooltip" tip="${desc}">
                ${getLabel(r).replaceAll('_',' ')}
            </span>` : (r ? html`${getLabel(r).replaceAll('_',' ')}` : html`--`);
    }

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('var-label') as Textfield;
        let inputDesc : Textarea = this.shadowRoot.getElementById('var-desc') as Textarea;
        let inputShort : Textfield = this.shadowRoot.getElementById('var-short-name') as Textfield;
        let inputLong : Textfield = this.shadowRoot.getElementById('var-long-name') as Textfield;

        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let desc : string = inputDesc ? inputDesc.value : '';
        let shortName : string = inputShort ? inputShort.value : '';
        let longName : string = inputLong ? inputLong.value : '';

        if (label) {
            let jsonRes = {
                type: ["VariablePresentation"],
                label: [label],
            };
            if (desc) jsonRes["description"] = [desc];
            if (shortName) jsonRes["hasShortName"] = [shortName];
            if (longName) jsonRes["hasLongName"] = [longName];

            return VariablePresentationFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
        }
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.variablePresentations;
    }
}
