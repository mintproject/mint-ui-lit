import { ModelCatalogResource, Action } from './resource';
import { property, html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { IdMap } from "app/reducers";

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { parameterGet, parametersGet, parameterPost, parameterPut, parameterDelete } from 'model-catalog/actions';
import { Parameter, Unit, ParameterFromJSON } from '@mintproject/modelcatalog_client';
import { PARAMETER_TYPES } from 'offline_data/parameter_types';

import 'components/data-catalog-id-checker';
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
        }
        .two-inputs > wl-textfield, 
        .two-inputs > wl-select,
        .two-inputs > span {
            display: inline-block;
            width: 50%;
        }
        `];
    }

    private _units : IdMap<Unit> = {
        'https://w3id.org/okn/i/mint/%25': 
            { id: 'https://w3id.org/okn/i/mint/%25', label: ['%'] },
        'https://w3id.org/okn/i/mint/dayT':
            { id: 'https://w3id.org/okn/i/mint/dayT', label: ['day']},
        'https://w3id.org/okn/i/mint/hourT':
            { id: 'https://w3id.org/okn/i/mint/hourT', label: ['hour']},
        'https://w3id.org/okn/i/mint/yearT':
            { id: 'https://w3id.org/okn/i/mint/yearT', label: ['year']},
        'https://w3id.org/okn/i/mint/minT':
            { id: 'https://w3id.org/okn/i/mint/minT', label: ['min']},
        'https://w3id.org/okn/i/mint/date':
            { id: 'https://w3id.org/okn/i/mint/date', label: ['date']},
        'https://w3id.org/okn/i/mint/pixel':
            { id: 'https://w3id.org/okn/i/mint/pixel', label: ['pixel']},
        'https://w3id.org/okn/i/mint/second':
            { id: 'https://w3id.org/okn/i/mint/second', label: ['second']},
        'https://w3id.org/okn/i/mint/month':
            { id: 'https://w3id.org/okn/i/mint/month', label: ['month']},
        'https://w3id.org/okn/i/mint/degree':
            { id: 'https://w3id.org/okn/i/mint/degree', label: ['degree']},
        'https://w3id.org/okn/i/mint/kg_ha_1M_L_2':
            { id: 'https://w3id.org/okn/i/mint/kg_ha_1M_L_2', label: ['kg ha-1']},
    } as IdMap<Unit>;

    protected classes : string = "resource parameter";
    protected name : string = "parameter";
    protected pname : string = "parameters";
    //protected positionAttr : string = "position";
    protected resourcesGet = parametersGet;
    protected resourceGet = parameterGet;
    protected resourcePost = parameterPost;
    protected resourcePut = parameterPut;
    protected resourceDelete = parameterDelete;
    public colspan = 3;
    public lazy = true;
    public onlyFixedValue = false;
    
    @property({type: Boolean}) private isAdjustable = false;
    @property({type: Boolean}) private showDefaults = false;
    @property({type: String}) private _formPart : string = "";

    public isSetup : boolean = false;
    public setAsSetup () {
        this.isSetup = true;
        this.colspan = 4;
    }

    constructor () {
        super();
    }

    protected _renderTableHeader () {
        return html`
            <th><b>Name</b></th>
            <th><b>Type</b></th>
            <th style="white-space: nowrap;">${this.isSetup ? 
                html`
                    <b>Value in this setup</b>
                    <span class="tooltip" style="white-space:normal;"
                     tip="If a value is set up in this field, you will not be able to change it in run time. For example, a price adjustment is set up to be 10%, it won't be editable when running the the model">
                        <wl-icon>help</wl-icon>
                    </span>
                `
                : html`<b>Default Value</b>`}
            </th>
            ${this.isSetup ? html`
            <th style="white-space: nowrap;">
                <b>Adjustable</b>
                <span class="tooltip" style="white-space:normal;"
                 tip="An adjustable parameter is a knob that a user will be able to fill with a value when executing the model">
                    <wl-icon>help</wl-icon>
                </span>
            </th>
            ` : html``}
        `;
    }

    protected _renderRow (r:Parameter) {
        let label : string = getLabel(r);
        let dcata : boolean = r.hasDefaultValue && 
                (label == "gldas_dataset_id" || label == "shapefile_dataset_id" || label == "data_set_id");
        return html`
            <td>
                <code>${label}</code><br/>
                <b>${r.description ? r.description[0].split(',').join(', ') : ''}</b>
            </td>
            <td>${renderParameterType(r)}</td>
            <td>
                ${this._renderTypedValue(r)}
            </td>
            ${this.isSetup ? html`
            <td style="text-align: center;">
                <wl-icon>${r.hasFixedValue && r.hasFixedValue.length > 0 ?  'check_box_outline_blank' : 'check_box'}</wl-icon>
            </td>
            ` : html``}
        `;
    }

    protected _renderTypedValue (r:Parameter) {
        let additionalType : string = r.type && r.type.length > 1 ?
                r.type.filter((p:string) => p != 'Parameter')[0] : '';

        let isDefault = false;
        let value = '';
        if (!r.hasFixedValue || r.hasFixedValue.length == 0) {
            isDefault = true;
            if (r.hasDefaultValue && r.hasDefaultValue.length > 0) {
                value = <unknown>r.hasDefaultValue[0] as string;
            }
        } else {
            value = <unknown>r.hasFixedValue[0] as string;
        }

        if (additionalType == "https://w3id.org/wings/export/MINT#DataCatalogId") {
            return html`
                <data-catalog-id-checker id=${value}><data-catalog-id-checker>
            `;
        }

        return html`
            ${value} ${isDefault && this.isSetup ? '(default)' : ''}
            ${r.usesUnit ? r.usesUnit[0].label : ''}`;
    }

    protected _editResource (r:Parameter) {
        super._editResource(r);
        let lr : Parameter = this._loadedResources[r.id];
        if (lr) {
            if (lr.hasDataType && lr.hasDataType.length > 0) {
                let dt = lr.hasDataType[0];
                if (dt === 'integer') dt = 'int';
                this._formPart = dt;
            }
            this.isAdjustable = !lr.hasFixedValue;
        }
    }

    protected _renderForm () {
        let edResource = this._getEditingResource();
        if (edResource && this.onlyFixedValue) return this._renderFixedForm(edResource);
        let additionalTypes = edResource && edResource.type && edResource.type.length > 1 ?
                edResource.type.filter((p:string) => p != 'Parameter') : [];
        return html`
        <form>
            ${this.isSetup ? html`
                <div @click=${() => this.isAdjustable = !this.isAdjustable} style="padding-top: 10px;">
                    <wl-checkbox ?checked="${this.isAdjustable}"></wl-checkbox>
                    <label style="padding-left: 10px;">Is Adjustable</label>
                </div>
                ${this.isAdjustable ? html`` : html`
                <wl-textfield id="fixed-value"  required
                              label="Value in this setup"
                              value="${edResource ? (edResource.hasFixedValue && edResource.hasFixedValue.length > 0 ?
                                edResource.hasFixedValue[0] 
                                : (edResource.hasDefaultValue ? edResource.hasDefaultValue[0] : '')) : ''}">
                </wl-textfield>
                `}
                <div @click=${() => this.showDefaults = !this.showDefaults} style="padding-top: 10px;">
                    <wl-checkbox ?checked="${this.showDefaults}"></wl-checkbox>
                    <label style="padding-left: 10px;">Show defaults</label>
                </div>
            ` : html`
                <wl-textfield id="parameter-label" label="Name" required
                    value=${edResource ? getLabel(edResource) : ''}>
                </wl-textfield>
                <wl-textarea id="parameter-desc" label="Description" required
                    value=${edResource && edResource.description ? edResource.description[0] : ''}>
                </wl-textarea>
            `}

            ${(!this.isSetup || this.showDefaults) ? html`
            <wl-select id="parameter-type" label="Parameter type" 
                value=${(additionalTypes.length > 0)? additionalTypes[0] : ''}>
                <option value="">None</option>
                ${Object.keys(PARAMETER_TYPES).map((id:string) => html`
                    <option value="${id}">${PARAMETER_TYPES[id]}</option>
                `)}
            </wl-select>

            <div class="two-inputs">
                <wl-select id="parameter-datatype" label="Data type" required @change="${this._onDataTypeChanged}"
                    value="${this._formPart}">
                    <option value="string" selected>String</option>
                    <option value="int">Integer</option>
                    <option value="float">Float</option>
                    <option value="boolean">Boolean</option>
                </wl-select>

                <wl-select id="parameter-unit" label="Parameter unit"
                    value="${edResource && edResource.usesUnit ? edResource.usesUnit[0].id:''}">
                    <option value="">None</option>
                    ${Object.values(this._units).map((unit:Unit) => html`
                        <option value="${unit.id}">${unit.label}</option>
                    `)}
                </wl-select>
            </div>

            <div class="min-max-input" style="display: ${this._formPart === 'int' ? 'grid' : 'none'}">
                <wl-textfield type="number" step="1" id="part-int-min" label="Minimum"
                    value="${edResource && edResource.hasMinimumAcceptedValue ? edResource.hasMinimumAcceptedValue[0] : '' }">
                </wl-textfield>
                <wl-textfield type="number" id="part-int-default" label="Default value" required
                    value="${edResource && edResource.hasDefaultValue ? edResource.hasDefaultValue[0] : '' }">
                </wl-textfield>
                <wl-textfield type="number" id="part-int-max" label="Maximum"
                    value="${edResource && edResource.hasMaximumAcceptedValue ? edResource.hasMaximumAcceptedValue[0] : ''}">
                </wl-textfield>
            </div>

            <div style="display: ${this._formPart === 'float' ? 'unset' : 'none'}">
                <div class="two-inputs">
                    <!-- FIXME: step is not working -->
                    <wl-textfield id="part-float-default" type="text"  label="Default value" required
                        value="${edResource && edResource.hasDefaultValue ? edResource.hasDefaultValue[0] : ''}"
                        step="${edResource && edResource.recommendedIncrement ? edResource.recommendedIncrement[0] : '0.01'}">
                    </wl-textfield>
                    <span>
                        <span style="display: flex; align-items: center; justify-content: space-between;">
                            <wl-textfield style="width: 100%;"
                                id="part-float-increment" type="number" step="0.01" label="Increment (optional)"
                                value="${edResource && edResource.recommendedIncrement ? edResource.recommendedIncrement[0] : ''}">
                            </wl-textfield>
                            <span slot="after" class="tooltip small-tooltip" tip="Increment defines what is the recommended delta to increase this parameter when executing multiple simulations. For example, when assessing precipitation variations, you can run a simulation incrementing the percentage of rain by 4%">
                                <wl-icon>help</wl-icon>
                            </span>
                        </span>
                    </span>
                </div>
                <div class="two-inputs">
                    <wl-textfield type="number" id="part-float-min" label="Minimum (optional)"
                        step="${edResource && edResource.recommendedIncrement ? edResource.recommendedIncrement[0] : '0.01'}"
                        value="${edResource && edResource.hasMinimumAcceptedValue ? edResource.hasMinimumAcceptedValue[0] : '' }">
                    </wl-textfield>
                    <wl-textfield type="number" id="part-float-max" label="Maximum (optional)"
                        step="${edResource && edResource.recommendedIncrement ? edResource.recommendedIncrement[0] : '0.01'}"
                        value="${edResource && edResource.hasMaximumAcceptedValue ? edResource.hasMaximumAcceptedValue[0] : ''}">
                    </wl-textfield>
                </div>
            </div>

            <div style="display: ${this._formPart === 'string' || this._formPart === '' ? 'unset' : 'none'}">
                <wl-textfield id="part-string-default" type="text"  label="Default value" required
                    value="${edResource && edResource.hasDefaultValue ? edResource.hasDefaultValue[0] : ''}">
                </wl-textfield>
                <wl-textfield id="part-string-accepted-values" type="text"  label="Accepted values (comma separated)"
                    value="${edResource && edResource.hasAcceptedValues ? edResource.hasAcceptedValues[0] : ''}">
                </wl-textfield>
            </div>

            <div style="display: ${this._formPart === 'boolean' ? 'unset' : 'none'}">
                <wl-select id="part-boolean-default" label="Default value" required
                    value="${edResource && edResource.hasDefaultValue ? edResource.hasDefaultValue[0] : 'False'}">
                    <option value="FALSE">False</option>
                    <option value="TRUE">True</option>
                </wl-select>
            </div>
            ` : html``}


            <!-- TODO: relevantForIntervention, adjustsVariable -->
        </form>`;
    }

    private _renderFixedForm(r:Parameter) {
        return html`
        <form>
            <wl-textfield id="parameter-fixed" label="value" required
                value="${r && r.hasDefaultValue ? r.hasDefaultValue[0] : ''}">
            </wl-textfield>
        </form>`;
    }

    private _onDataTypeChanged (e) {
        let inputDataType : Select = this.shadowRoot.getElementById('parameter-datatype') as Select;
        let datatype : string = inputDataType ? inputDataType.value : '';
        if (datatype) {
            this._formPart = datatype;
        }
    }

    protected _getFixedValue () {
        let inputFixed : Textfield = this.shadowRoot.getElementById('parameter-fixed') as Textfield;
        let fixed : string = inputFixed ? inputFixed.value : '';
        let edResource = this._getEditingResource();
        if (fixed && edResource) {
            return ParameterFromJSON({
                ...edResource,
                hasFixedValue: [fixed]
            });
        }
    }

    protected _getResourceFromForm () {
        if (this.onlyFixedValue) return this._getFixedValue(); //This is used on modeling.
        let edResource = this._getEditingResource();
        let position = edResource && edResource.position && edResource.position.length === 1 ?
            edResource.position[0] : this._resources.length + 1;

        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('parameter-label') as Textfield;
        let inputDesc : Textarea = this.shadowRoot.getElementById('parameter-desc') as Textarea;
        let inputDatatype : Textfield = this.shadowRoot.getElementById("parameter-datatype") as Textfield;
        let inputUnit : Select = this.shadowRoot.getElementById("parameter-unit") as Select;
        let inputType : Select = this.shadowRoot.getElementById("parameter-type") as Select;
        let inputFixed : Textfield = this.shadowRoot.getElementById('fixed-value') as Textfield;

        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let desc : string = inputDesc ? inputDesc.value : '';
        let datatype : string = inputDatatype ? inputDatatype.value : '';
        let unit : string = inputUnit ? inputUnit.value : '';
        let aType : string = inputType ? inputType.value : '';
        let fixed : string = inputFixed ? inputFixed.value : '';
        if (!this.isSetup && label && desc && datatype) {

            let jsonRes = {
                type: ["Parameter"],
                description: [desc],
                label: [label],
                hasDataType: [datatype],
                position: [position],
            };

            if (unit) jsonRes["usesUnit"] = [{id: unit}];
            if (aType) jsonRes["type"].push(aType);

            let jsonRes2 = this._getDefaultsPart(datatype);

            if (jsonRes2)
                return ParameterFromJSON({...jsonRes, ...jsonRes2});
        } else if (this.isSetup) {
            if (this.isAdjustable && !this.showDefaults) {
                // Remove old fixed values to use the default one
                return ParameterFromJSON({hasFixedValue: []})
            }
            if (!this.isAdjustable && !fixed) {
                (<any>inputFixed).onBlur();
                return;
            }
            if (!this.showDefaults) { 
                if (this._validateDataTypedValue(fixed))
                    return ParameterFromJSON({ hasFixedValue: [fixed] });
                else 
                    console.warn("Error validating data-type.");
            } else {
                let jsonRes = {
                    hasDataType: [datatype],
                    type: ["Parameter"],
                };
                if (unit) jsonRes["usesUnit"] = [{id: unit}];
                if (aType) jsonRes["type"].push(aType);
                let jsonRes2 = this._getDefaultsPart(datatype);
                if (jsonRes2)
                    return ParameterFromJSON({...jsonRes, ...jsonRes2});
            }
        } else {
            // Show errors
            if (!this.isSetup) {
                if (!label) (<any>inputLabel).onBlur();
                if (!desc) (<any>inputDesc).onBlur();
                if (!datatype) (<any>inputDatatype).onBlur();
            }
        }
    }

    private _validateDataTypedValue (value:string, ed? : Parameter ) : boolean {
        let edR : Parameter = ed ? ed : this._getEditingResource();
        let datatype : string = edR.hasDataType && edR.hasDataType.length === 1 ? edR.hasDataType[0] : '';
        switch (datatype) {
            case "int":
            case "float":
                let val : number = datatype == "int" ? parseInt(value) : parseFloat(value);;
                let min : number = edR.hasMinimumAcceptedValue && edR.hasMinimumAcceptedValue.length === 1 ? 
                        parseFloat(edR.hasMinimumAcceptedValue[0]) : undefined;
                let max : number = edR.hasMaximumAcceptedValue && edR.hasMaximumAcceptedValue.length === 1 ?
                        parseFloat(edR.hasMaximumAcceptedValue[0]) : undefined;
                if (min != undefined && min > val) {
                    this._notification.error("Parameter value must be greater than " + min);
                    return false;
                }
                if (max != undefined && max < val) {
                    this._notification.error("Parameter value must be less than " + max);
                    return false;
                }
                break;
            case "string":
                if (edR.hasAcceptedValues && edR.hasAcceptedValues.length === 1) {
                    let av : string[] = edR.hasAcceptedValues[0].split(/ *, */);
                    if (!av.includes(value)) {
                        this._notification.error("Parameter value must be an accepted value");
                        return false;
                    }
                }
                break;
            case "boolean":
                let bol : string = value.toLowerCase();
                if (!(bol == 'true' || bol == 'false')) {
                    this._notification.error("Parameter value must be True or False");
                    return false;
                }
                break;
            default:
                console.warn('unrecognized datatype');
                break;
        }
        return true;
    }

    private _getDefaultsPart (datatype:string) {
        switch (datatype) {
            case "int":
                return this._getPartIntFromForm();
                break;
            case "float":
                return this._getPartFloatFromForm();
                break;
            case "string":
                return this._getPartStringFromForm();
                break;
            case "boolean":
                 return this._getPartBooleanFromForm();
                break;
            default:
                console.warn('unrecognized datatype');
                return;
        }
    }

    private _getPartIntFromForm () {
        let inputMin : Textfield = this.shadowRoot.getElementById('part-int-min') as Textfield;
        let inputMax : Textfield = this.shadowRoot.getElementById('part-int-max') as Textfield;
        let inputDef : Textfield = this.shadowRoot.getElementById('part-int-default') as Textfield;
        let min: string = inputMin ? inputMin.value : '';
        let max: string = inputMax ? inputMax.value : '';
        let def: string = inputDef ? inputDef.value : '';
        if (def) {
            let jsonRes = {
                hasDataType: ["int"],
                hasDefaultValue: [def]
            };
            if (min) jsonRes['hasMinimumAcceptedValue'] = [min];
            if (max) jsonRes['hasMaximumAcceptedValue'] = [max];

            if (this._validateDataTypedValue(def, jsonRes))
                return jsonRes;
        } else {
            (<any>inputDef).onBlur();
        }
    }

    private _getPartFloatFromForm () {
        let inputDef : Textfield = this.shadowRoot.getElementById('part-float-default') as Textfield;
        let inputInc : Textfield = this.shadowRoot.getElementById('part-float-increment') as Textfield;
        let inputMin : Textfield = this.shadowRoot.getElementById('part-float-min') as Textfield;
        let inputMax : Textfield = this.shadowRoot.getElementById('part-float-max') as Textfield;
        let def : string = inputDef ? inputDef.value : '';
        let inc : string = inputInc ? inputInc.value : '';
        let min : string = inputMin ? inputMin.value : '';
        let max : string = inputMax ? inputMax.value : '';
        if (def) {
            let jsonRes = {
                hasDataType: ["float"],
                hasDefaultValue: [def]
            };
            if (inc) jsonRes['recommendedIncrement'] = [inc];
            if (min) jsonRes['hasMinimumAcceptedValue'] = [min];
            if (max) jsonRes['hasMaximumAcceptedValue'] = [max];
            if (this._validateDataTypedValue(def, jsonRes))
                return jsonRes;
        } else {
            (<any>inputDef).onBlur();
        }
    }

    private _getPartStringFromForm () {
        let inputDef : Textfield = this.shadowRoot.getElementById('part-string-default') as Textfield;
        let inputAcc : Textfield = this.shadowRoot.getElementById('part-string-accepted-values') as Textfield;
        let def : string = inputDef ? inputDef.value : '';
        let acc : string = inputAcc ? inputAcc.value : '';
        if (def) {
            let jsonRes = {
                hasDataType: ["string"],
                hasDefaultValue: [def]
            };
            if (acc) jsonRes['hasAcceptedValues'] = [acc];
            if (this._validateDataTypedValue(def, jsonRes))
                return jsonRes;
        } else {
            (<any>inputDef).onBlur();
        }
    }

    private _getPartBooleanFromForm () {
        let inputDef : Select = this.shadowRoot.getElementById('part-boolean-default') as Select;
        let def : string = inputDef ? inputDef.value : '';
        if (def) {
            let jsonRes = {
                hasDataType: ["boolean"],
                hasDefaultValue: [def]
            };
            if (this._validateDataTypedValue(def, jsonRes))
                return jsonRes;
        } else {
            (<any>inputDef).onBlur();
        }
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.parameters;
    }
}
