import { property, html, customElement, css } from 'lit-element';
import { LitElement } from 'lit-element';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../model-explore/explorer-styles'

import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';
import { IdMap } from 'app/reducers';

import { renderNotifications } from "util/ui_renders";
import { showNotification, showDialog, hideDialog } from 'util/ui_functions';

import { parameterGet } from 'model-catalog/actions';
import { sortByPosition, createUrl, renderExternalLink, renderParameterType } from './util';

import { Parameter } from '@mintproject/modelcatalog_client';

import "weightless/progress-spinner";
import 'components/loading-dots'

interface ParameterWithStatus extends Parameter {
    loading?: boolean;
    error?: boolean;
}

@customElement('parameters-table')
export class ParameterTable extends connect(store)(LitElement) {
    @property({type: Boolean})
    public isSetup : boolean = false;           // To display on setups or configurations (default).
    @property({type: Boolean})
    public edit : boolean = false;              // To display on edit mode
    @property({type: Boolean})
    private _editingRanges : boolean = false;   // Display ranges on parameter edit
    @property({type: Boolean})
    private _editingDefaults : boolean = false; // Display defaults on parameter edit (setup)

    @property({type: Object})
    public parameters : Parameter[] = [];       // The original object (config|setup).hasParameter
    private _lastParameters : Parameter[] = []; // A copy to check if the object has changed

    @property({type: Object})
    private _parameter : Parameter = null;       // Parameter selected to edit

    @property({type: Object})
    private _parameters : ParameterWithStatus[] = []; // Internal copy of parameters to make edits

    static get styles() {
        return [ExplorerStyles, SharedStyles, css`
            th > wl-icon {
                vertical-align: bottom;
                margin-left: 4px;
                --icon-size: 14px;
            }

            .info-center {
                text-align: center;
                font-size: 13pt;
                height: 32px;
                line-height:32px;
                color: #999;
            }
            
            .ta-right {
                text-align: right;
            }

            wl-button.small {
                border: 1px solid gray;
                margin-right: 5px;
                --button-padding: 4px;
            }

            .checkbox {
                display: inline-block;
                cursor: pointer;
            }

            .checkbox > wl-icon {
                margin-right: 8px;
                vertical-align: middle;
            }

            .checkbox > wl-icon:after {
                content: 'check_box_outline_blank';
            }

            .checkbox > span {
                vertical-align: middle;
            }

            .checkbox[active] {
                font-weight: bold;
            }

            .checkbox[active] > wl-icon:after {
                content: 'check_box';
            }

            .min-max-input {
                display: grid;
                grid-template-columns: 25% 50% 25%;
            }

            .min-max-input.no-ranges {
                display: grid;
                grid-template-columns: 0% 100% 0%;
            }
            `,
        ];
    }

    private _loadParameters () {
        let state : RootState = store.getState() as RootState;
        let allParameters = state.modelCatalog ? state.modelCatalog.parameters : {};
        this._parameters = this.parameters
                .filter((p:Parameter) => allParameters[p.id])
                .map((p:Parameter) => { return { ...allParameters[p.id], loading: false }; } );

        Promise.all( 
            this.parameters
                .filter((p:Parameter) => !allParameters[p.id])
                .map((p:Parameter) => { 
                    let index = this._parameters.length;
                    this._parameters.push( {...p, loading: true } as ParameterWithStatus )
                    let req = store.dispatch(parameterGet(p.id));
                    req.then((newP:Parameter) => {
                        this._parameters[index] = { ...newP, loading: false } as ParameterWithStatus;
                        this.requestUpdate();
                    });
                    return req;
                })
        ).then((parameters: Parameter[]) => {
            this._parameters = this._parameters.sort(sortByPosition);
            this.requestUpdate();
        })

    }

    protected render() {
        if (this._lastParameters != this.parameters) {
            this._lastParameters = this.parameters;
            this._loadParameters();
            console.log('PARAMETERS:', this.parameters);
            console.log('isSetup:', this.isSetup);
        }

        return html`
        <wl-title level="4" style="margin-top:1em;">Parameters:</wl-title>
        <table class="pure-table pure-table-striped" style="width: 100%">
            <colgroup>
                <col span="1">
                <col span="1">
                <col span="1">
                ${this.isSetup? html`<col span="1">` : ''}
                ${this.edit? html`<col span="1">` : ''}
            </colgroup>
            <thead>
                <th><b>Parameter description</b></th>
                <th><b>Type</b></th>
                ${this.isSetup ? html`<th class="ta-right" style="white-space:nowrap;" colspan="1">
                    <b>Adjustable</b>
                    <span class="tooltip" style="white-space:normal;"
                     tip="An adjustable parameter is a knob that a user will be able to fill with a value when executing the model">
                        <wl-icon>help</wl-icon>
                    </span>
                </th>` : ''}
                <th class="ta-right" style="white-space:nowrap;">
                    ${this.isSetup ? html`
                    <b>Value in this setup</b>
                    <span class="tooltip" style="white-space:normal;"
                     tip="If a value is set up in this field, you will not be able to change it in run time. For example, a price adjustment is set up to be 10%, it won't be editable when running the the model">
                        <wl-icon>help</wl-icon>
                    </span>` 
                    : html`<b>Default Value</b>`}
                </th>

                ${this.edit? html`<th class="ta-right"></th>` : ''}
            </thead>
            <tbody>
            ${this._parameters.length > 0 ? (this._parameters.map((p:ParameterWithStatus) => 
                p.loading ? html`
                <tr>
                    <td colspan="5" style="text-align: center;"> <wl-progress-spinner></wl-progress-spinner> </td>
                </tr>
                ` : html`
                <tr>
                    <td>
                        <code>${p.label}</code><br/>
                        <b>${p.description}</b>
                    </td>
                    <td>
                        ${renderParameterType(p)}
                    </td>
                    ${this.isSetup ? html`
                    <td style="text-align: center;">
                        <wl-button flat inverted @click="${() => {
                                p['isAdjustable'] = !p['isAdjustable'];
                                this.requestUpdate();
                            }}">
                            <wl-icon>${p['isAdjustable'] ? 'check_box' : 'check_box_outline_blank'}</wl-icon>
                        </wl-button>
                    </td>
                    ` : ''}
                    <td class="ta-right">
                        ${this.isSetup ? 
                            (p.hasFixedValue && p.hasFixedValue.length > 0 ? 
                                p.hasFixedValue :
                                (p.hasDefaultValue ? p.hasDefaultValue + ' (default)' : '-')) 
                            : (p.hasDefaultValue ? p.hasDefaultValue : '-')
                        }
                        ${p.usesUnit ?p.usesUnit[0]['label'] : ''}
                    </td>
                    ${this.edit? html `
                    <td style="text-align: right;">
                        <wl-button flat inverted @click="${() => this._editParameter(p)}" class="small"><wl-icon>edit</wl-icon></wl-button>
                    </td>`:''}
                </tr>`))
            : html`
                <tr>
                    <td colspan="5" class="info-center">- This configuration has no parameters -</td>
                </tr>`
            }
            </tbody>
        </table>

        <wl-dialog class="larger" id="parameterDialog" fixed backdrop blockscrolling persistent>
            <h3 slot="header">Editing parameter</h3>
            <div slot="content">
                ${this._parameter ? this._renderParameterForm() : ''}
            </div>
            <div slot="footer">
                <wl-button @click="${this._closeDialog}" style="margin-right: 5px;" inverted flat>Cancel</wl-button>
                <wl-button @click="${this._setParameter}">Set</wl-button>
            </div>
        </wl-dialog>
        `
    }

    private _renderParameterForm () {
        let inputType : string = 'text';
        if (this._parameter.hasDataType && this._parameter.hasDataType.length > 0) {
            switch (this._parameter.hasDataType[0]) {
                case 'float':
                case 'int':
                    inputType = 'number';
                    break;
                case 'boolean':
                    inputType = 'boolean';
                    break;
            }
        }
        let min = this._parameter.hasMinimumAcceptedValue ? this._parameter.hasMinimumAcceptedValue[0] : '';
        let max = this._parameter.hasMaximumAcceptedValue ? this._parameter.hasMaximumAcceptedValue[0] : '';
        let showRanges = this._editingRanges || (this.isSetup && inputType === 'number');
        return html`
            <div style="margin-bottom: 5px; font-size:14px;">
                <span class="monospaced">${this._parameter.label}</span>
                ${this._parameter.usesUnit ? ' (' + (this._parameter.usesUnit[0] as any).label + ')': ''}
            </div>
            <form>
                <wl-textarea label="Description" id="parameter-description"
                             value="${this._parameter.description}"></wl-textarea>
                ${this.isSetup ? html`
                    ${inputType === 'boolean' ? html`
                    <wl-select id="parameter-value" label="${this._parameter.label} fixed value"
                     value="${this._parameter.hasFixedValue}">
                        <option disabled selected>Choose</option>
                        <option value="TRUE">TRUE</option>
                        <option value="FALSE">FALSE</option>
                    </wl-select>
                    ` : html`
                    <wl-textfield 
                        type="${inputType}" min="${min}" max="${max}"
                        id="parameter-fixed-value" label="${this._parameter.label} fixed value"
                        value="${this._parameter.hasFixedValue}"
                        placeholder="${this._parameter.hasDefaultValue}" required>
                        <span slot="after">${this._parameter.usesUnit ?(this._parameter.usesUnit[0] as any).label : ''}</span>
                    </wl-textfield>
                    `}

                <div class="checkbox" ?active="${this._editingDefaults}" 
                     @click="${() => {this._editingDefaults = !this._editingDefaults}}">
                    <wl-icon></wl-icon>
                    <span>Edit configuration defaults</span>
                </div>
                ` : ''}

                ${!this.isSetup || this._editingDefaults? html`
                <div class="min-max-input ${showRanges ? '' : 'no-ranges'}">
                    <wl-textfield
                        type="number"
                        id="parameter-def-min-value" label="Minimum"
                        value="${min}" ?required="${showRanges}">
                    </wl-textfield>
                    ${inputType === 'boolean' ? html`
                    <wl-select id="parameter-def-value" label="${this._parameter.label} default value"
                     value="${this._parameter.hasDefaultValue}">
                        <option disabled selected>Choose</option>
                        <option value="TRUE">TRUE</option>
                        <option value="FALSE">FALSE</option>
                    </wl-select>
                    ` : html`
                    <wl-textfield 
                        type="${inputType}" min="${min}" max="${max}"
                        id="parameter-def-value" label="${this._parameter.label} default value"
                        value="${this._parameter.hasDefaultValue}"
                        placeholder="${this._parameter.hasDefaultValue}" required>
                        ${showRanges ? '' : html`
                            <span slot="after">${this._parameter.usesUnit ?(this._parameter.usesUnit[0] as any).label : ''}</span>
                        `}
                    </wl-textfield>
                    `}
                    <wl-textfield 
                        type="number"
                        id="parameter-max-value" label="Maximum"
                        value="${max}" ?required="${showRanges}">
                    </wl-textfield>
                </div>
                ` : ''}

                ${!this.isSetup? html`
                <div class="checkbox" ?active="${this._editingRanges}" @click="${() => {this._editingRanges = !this._editingRanges}}">
                    <wl-icon></wl-icon>
                    <span>Edit ranges</span>
                </div>
                `: ''}
            </form>`
    }

    private _closeDialog () {
        hideDialog("parameterDialog", this.shadowRoot);
        this._parameter = null;
    }

    private _setParameter () {
    }

    private _editParameter (parameter:Parameter) {
        this._parameter = parameter;
        showDialog("parameterDialog", this.shadowRoot);
    }

    /*stateChanged(state: RootState) {
        if (state.modelCatalog.parameters)
            this._parameters = state.modelCatalog.parameters;
    }*/
}
