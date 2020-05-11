import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../model-explore/explorer-styles'

import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';

import { renderNotifications } from "util/ui_renders";
import { showNotification } from 'util/ui_functions';

import { modelConfigurationPost } from 'model-catalog/actions';
import { getLabel } from 'model-catalog/util';
import { sortByPosition, createUrl, renderExternalLink, renderParameterType } from './util';

import { IdMap } from 'app/reducers';
import { ModelConfiguration } from '@mintproject/modelcatalog_client';
import { ModelCatalogTimeInterval } from './resources/time-interval';

import "./resources/time-interval";

import "weightless/slider";
import "weightless/progress-spinner";
import 'components/loading-dots'

@customElement('models-new-config')
export class ModelsNewConfig extends connect(store)(PageViewElement) {
    @property({type: Object}) private _config: ModelConfiguration;

    @property({type: String})
    private _mode : string = '';

    _scrollUp () {
        let el = this.shadowRoot.getElementById('start');
        if (el) {
            el.scrollIntoView({behavior: "smooth", block: "start"})
        }
    }

    _cancel () {
        this._scrollUp();
        goToPage(createUrl(this._model, this._version, this._config));
    }

    _saveNewSetup () {
        let nameEl      = this.shadowRoot.getElementById('new-setup-name') as HTMLInputElement;
        let descEl      = this.shadowRoot.getElementById('new-setup-desc') as HTMLInputElement;
        let keywordsEl  = this.shadowRoot.getElementById('new-setup-keywords') as HTMLInputElement;
        let assignMeEl  = this.shadowRoot.getElementById('new-setup-assign-method') as HTMLInputElement;
        let usageEl     = this.shadowRoot.getElementById('new-setup-usage-notes') as HTMLInputElement;

        if (nameEl && descEl && keywordsEl && assignMeEl) {
            let name        = nameEl.value;
            let desc        = descEl.value;
            let keywords    = keywordsEl.value;
            let assignMe    = assignMeEl.value;
            let notes       = usageEl.value;

            if (!name || !assignMe) {
                if (!name) nameEl.setAttribute('invalid', 'true');
                if (!assignMe) assignMeEl.setAttribute('invalid', 'true');
                this._scrollUp();
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                return;
            }

            let setupCreated = {...this._setup};

            delete setupCreated.hasSetup;
            setupCreated.id = undefined;
            setupCreated.type = ['ModelConfigurationSetup', 'Theory-GuidedModel', 'ConfigurationSetup'];
            setupCreated.label = [name];
            setupCreated.description = [desc];
            setupCreated.hasUsageNotes = [notes];
            setupCreated.keywords = [keywords.split(/ *, */).join('; ')];
            setupCreated.parameterAssignmentMethod = [assignMe];

            setupCreated.hasGrid = this._grid ? [this._grid] : undefined;
            setupCreated.hasOutputTimeInterval = this._timeInterval ? [this._timeInterval] : undefined;

            setupCreated.hasInput = (setupCreated.hasInput || []).map((input: DatasetSpecification) => {
                let newInput = this._inputs[input.id];
                newInput.id = '';
                newInput.hasFixedResource = (newInput.hasFixedResource||[]).map((sample:SampleCollection|SampleResource) => {
                    sample.id = '';
                    sample['hasPart'] = ((<SampleCollection>sample).hasPart||[]).map((sr:SampleResource) => {
                        sr.id = '';
                        return sr;
                    });
                    return sample;
                });
                return newInput;
            });
            setupCreated.hasParameter = (setupCreated.hasParameter || []).map((param: Parameter) => {
                let newParam = this._parameters[param.id];
                if (!newParam['isAdjustable'] && (!newParam.hasFixedValue || newParam.hasFixedValue.length === 0) && newParam.hasDefaultValue) {
                    newParam.hasFixedValue = newParam.hasDefaultValue;
                }
                newParam.id = '';
                return newParam;
            });

            store.dispatch(modelConfigurationSetupPost(setupCreated, this._config)).then((setup:ModelConfigurationSetup) => {
                goToPage(createUrl(this._model, this._version, this._config, setup));
            });
            showNotification("saveNotification", this.shadowRoot!);
        }
    }

    protected render() {
        return html`
        <table class="details-table" id="start">
            <colgroup width="150px">
            <tr>
                <td colspan="2" style="padding: 5px 20px;">
                    <wl-textfield id="new-setup-name" label="New setup name" value="" required></wl-textfield>
                </td>
            </tr>

            <tr>
                <td>Description:</td>
                <td>
                    <textarea id="new-setup-desc" name="description" rows="4"></textarea>
                </td>
            </tr>

            <tr>
                <td>Keywords:</td>
                <td>
                    <input id="new-setup-keywords" type="text" value=""/>
                </td>
            </tr>

            <tr>
                <td>Region:</td>
                <td>
                </td>
            </tr>

            <tr>
                <td>Setup creator:</td>
                <td>
                </td>
            </tr>

            <tr>
                <td>Parameter assignment method:</td>
                <td>
                    <div style="display: grid; grid-template-columns: auto 36px;">
                        <wl-select id="new-setup-assign-method" label="Parameter assignment method" placeholder="Select a parameter assignament method" required>
                            <option value="" disabled selected>Please select a parameter assignment method</option>
                            <option value="Calibration">Calibration</option>
                            <option value="Expert-configured">Expert tuned</option>
                        </wl-select>
                        <span tip="Calibrated: The model was calibrated (either manually or automatically) against baseline data.&#10;Expert configured: A modeler did an expert guess of the parameters based on available data." 
                              id="pam" class="tooltip" style="top: 8px;">
                            <wl-icon style="--icon-size: 24px;">help_outline</wl-icon>
                        </span>
                    </div>
                </td>
            </tr>

            <tr>
                <td>Software Image:</td>
                <td>
                </td>
            </tr>

            <tr>
                <td>Component Location:</td>
                <td>
                    <textarea id="new-setup-comp-loc" disabled></textarea>
                </td>
            </tr>

            <tr>
                <td>Grid:</td>
                <td>
                </td>
            </tr>

            <tr>
                <td>Time interval:</td>
                <td>
                    <model-catalog-time-interval id="mcti"></model-catalog-time-interval>
                </td>
            </tr>

            <tr>
                <td>Processes:</td>
                <td>
                </td>
            </tr>

            <tr>
                <td>Usage notes:</td>
                <td>
                    <textarea id="new-setup-usage-notes" rows="6"></textarea>
                </td>
            </tr>

        </table>

        <wl-title level="4" style="margin-top:1em;">Parameters:</wl-title>
        <table class="pure-table pure-table-striped" style="width: 100%">
            <colgroup>
                <col span="1">
                <col span="1">
                <col span="1">
                <col span="1">
                <col span="1">
            </colgroup>
            <thead>
                <th><b>Label</b></th>
                <th><b>Type</b></th>
                <th class="ta-right" style="white-space:nowrap;">
                    <b>Value in this setup</b>
                    <span class="tooltip" style="white-space:normal;"
                     tip="If a value is set up in this field, you will not be able to change it in run time. For example, a price adjustment is set up to be 10%, it won't be editable when running the the model">
                        <wl-icon>help</wl-icon>
                    </span>
                </th>
                <th class="ta-right" style="white-space:nowrap;" colspan="1">
                    <b>Adjustable</b>
                    <span class="tooltip" style="white-space:normal;"
                     tip="An adjustable parameter is a knob that a user will be able to fill with a value when executing the model">
                        <wl-icon>help</wl-icon>
                    </span>
                </th>
                <th> </th>
            </thead>
            <tbody>
                <tr><td colspan="5" class="info-center">- This setup has no parameters -</td></tr>
            </tbody>
        </table>

        <wl-title level="4" style="margin-top:1em;">Input files:</wl-title>
        <table class="pure-table pure-table-striped" style="width: 100%">
            <colgroup>
                <col span="1">
                <col span="1">
                <col span="1">
            </colgroup>
            <thead>
                <th><b>Input description</b></th>
                <th style="white-space:nowrap;" colspan="2">
                    <b>Value in this setup</b>
                    <span class="tooltip" style="white-space:normal;" tip="If a value is set up in this field, you will not be able to change it in run time.">
                        <wl-icon>help</wl-icon>
                    </span>
                </th>
            </thead>
            <tbody>
            </tbody>
        </table>

        <div style="float:right; margin-top: 1em;">
            <wl-button @click="" style="margin-right: 1em;" flat inverted>
                <wl-icon>cancel</wl-icon>&ensp;Discard changes
            </wl-button>
            <wl-button @click="">
                <wl-icon>save</wl-icon>&ensp;Save
            </wl-button>
        </div>`
    }

    clearForm () {
        let nameEl      = this.shadowRoot.getElementById('new-setup-name') as HTMLInputElement;
        let descEl      = this.shadowRoot.getElementById('new-setup-desc') as HTMLInputElement;
        let keywordsEl  = this.shadowRoot.getElementById('new-setup-keywords') as HTMLInputElement;
        let assignMeEl  = this.shadowRoot.getElementById('new-setup-assign-method') as HTMLInputElement;
        let usageEl     = this.shadowRoot.getElementById('new-setup-usage-notes') as HTMLInputElement;
        if (nameEl && descEl && keywordsEl && assignMeEl) {
            nameEl      .value = '';
            descEl      .value = '';
            keywordsEl  .value = '';
            assignMeEl  .value = '';
            usageEl     .value = '';
        }
    }

    firstUpdated () {
        this.addEventListener('timeIntervalSelected', this._onTimeIntervalSelected);
    }

    stateChanged(state: RootState) {
        super.setRegionId(state);
        if (state.explorerUI) {
            let ui = state.explorerUI;
            // Clear form when changed 
            if (ui.mode != this._mode) {
                this.clearForm();
            }
        }
    }

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

            li > a {
                cursor: pointer;
            }

            .ta-right {
                text-align: right;
            }

            .input-range {
                width: 50px !important;
                color: black;
            }

            .details-table {
                border-collapse: collapse;
                width: 100%;
            }

            .details-table tr td:first-child {
                font-weight: bold;
                padding-right: 6px;
                padding-left: 13px;
            }

            .details-table tr td:first-child {
                padding-right: 13px;
            }

            .details-table tr:nth-child(odd) {
                background-color: rgb(246, 246, 246);
            }

            .details-table > tbody > tr > td > span {
                display: inline-block;
                border-radius: 4px;
                line-height: 20px;
                padding: 1px 4px;
                margin-right: 4px;
                margin-bottom: 2px;
            }

            .details-table > tbody > tr > td > span > wl-icon {
                --icon-size: 16px;
                cursor: pointer;
                vertical-align: middle;
            }

            .details-table > tbody > tr > td > input, textarea {
                background: transparent;
                font-family: Raleway;
                font-size: 14px;
                width: calc(100% - 10px);
                resize: vertical;
            }

            .details-table > tbody > tr > td > span > wl-icon:hover {
                background-color: rgb(224, 224, 224);
            }

            .details-table td {
                padding: 5px 1px;
                vertical-align: top;
            }

            wl-button.small {
                border: 1px solid gray;
                margin-right: 5px;
                --button-padding: 4px;
            }

            #pam.tooltip:hover::after {
                bottom: 26px;
                color: rgb(255, 255, 255);
                right: 20%;
                position: absolute;
                z-index: 98;
                background: rgba(0, 0, 0, 0.8);
                border-radius: 5px;
                padding: 5px 15px;
                width: 610px;
                content: attr(tip);
                white-space: pre;
                word-wrap: break-word;
            }`,
        ];
    }
}
