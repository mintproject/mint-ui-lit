import { html, property, customElement, css } from 'lit-element';

import { PageViewElement } from '../../../components/page-view-element.js';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../../../app/store';

import { SharedStyles } from '../../../styles/shared-styles';
import { ExplorerStyles } from './explorer-styles'

import { ComparisonEntry } from './ui-reducers';
import { FetchedModel, VersionDetail } from './api-interfaces';
import { explorerFetchVersions } from './actions';
import { explorerSetCompareA, explorerSetCompareB } from './ui-actions'

//import { goToPage } from '../../../app/actions';
/*import "weightless/expansion";
import "weightless/tab";
import "weightless/tab-group";
import "weightless/card";
import "weightless/progress-spinner";*/
import "weightless/progress-spinner";
import "weightless/icon";
import "weightless/select";

@customElement('model-compare')
export class ModelCompare extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _compareA : ComparisonEntry | null = null;

    @property({type: Object})
    private _compareB : ComparisonEntry | null = null;

    @property({type: Object})
    private _modelA : FetchedModel | null = null;

    @property({type: Object})
    private _modelB : FetchedModel | null = null;

    @property({type: Object})
    private _versionsA: VersionDetail[] | null = null;

    @property({type: Object})
    private _versionsB: VersionDetail[] | null = null;

    @property({type: Object})
    private _configsA: any = null;

    @property({type: Object})
    private _configsB: any = null;

    @property({type: Object})
    private _calibrationsA: any = null;

    @property({type: Object})
    private _calibrationsB: any = null;

    constructor () {
        super();
        this.active = true;
    }

    static get styles() {
        return [SharedStyles, ExplorerStyles,
            css`
            wl-select {
                --input-font-size: 1em;
                --input-label-font-size: 0.8em;
            }

            table {
                width:100%;
                table-layout: fixed;
                border-spacing: 0;
                border-collapse: collapse;
            }

            #main-row td:nth-child(odd) {
                width: calc(50% - 21px);
                padding: 0px 0px 0px 15px;
                border-radius: 1em;
                background: #f0f0f0;
                vertical-align:top;
                padding: 4px 8px 15px 8px;
            }

            #main-row td:nth-child(2) {
                width: 10px;
            }

            .header {
                width: 100%;
                text-align: center;
            }

            .header > div.title {
                width: calc(100% - 30px);
                font-size: 1.2em;
                line-height: 1.2em;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                padding: 0px 15px;
            }

            .header > span {
                float: left;
                font-size: .8em;
            }

            .header > wl-icon {
                float: right;
                font-size: 1.2em;
            }

            div.selectors {
                text-align: center;
                padding: 0px 20px;
            }
            `
        ];
    }

    protected render() {
        return html`${(this._compareA && this._modelA)?
        html`
            <table>
                <tr id="main-row">
                    <td> 
                        <div class="header">
                            <span> Comparing: </span>
                            <wl-icon class="clickable" @click="${this._clearA}">clear</wl-icon>
                            <div class="title">${this._modelA.label}</div>
                        </div>
                        <div class="selectors">
                            ${this._versionsA ? html`
                            <wl-select id="selector-version-a" label="Version:" @input="${this._onVersionAChange}"
                                       value="${this._compareA.version}">
                                <option value="">Any version</option>
                                ${this._versionsA.map((v:any) => html`<option value="${v.uri}">${v.label}</option>`)}
                            </wl-select>
                            ${(this._compareA.version && this._configsA)? html`
                            <wl-select id="selector-config-a" label="Configuration:" @input="${this._onConfigAChange}"
                                       value="${this._compareA.config}">
                                <option value="">Any configuration</option>
                                ${this._configsA.map((c:any) => html`<option value="${c.uri}">${c.label}</option>`)}
                            </wl-select>
                            `:html``}
                            ${(this._compareA.config && this._calibrationsA)? html`
                            <wl-select id="selector-calibration-a" label="Calibration:" @input="${this._onCalibrationAChange}"
                                       value="${this._compareA.calibration}">
                                <option value="">Any calibration</option>
                                ${this._calibrationsA.map((c:any) => html`<option value="${c.uri}">${c.label}</option>`)}
                            </wl-select>
                            ` :html``}
                            `
                            : html`<wl-progress-spinner></wl-progress-spinner>`}
                        </div>
                    </td>

                    <td></td>

                    <td style="${!(this._modelB && this._compareB)? 'vertical-align:middle;' : ''}">
                        ${(this._modelB && this._compareB)? 
                        html`
                        <div class="header">
                            <span> To: </span>
                            <wl-icon class="clickable" @click="${this._clearB}">clear</wl-icon>
                            <div class="title">${this._modelB.label}</div>
                        </div>

                        <div class="selectors">
                            ${this._versionsB ? html`
                            <wl-select id="selector-version-b" label="Version:" @input="${this._onVersionBChange}"
                                       value="${this._compareB.version}">
                                <option value="">Any version</option>
                                ${this._versionsB.map((v:any) => html`<option value="${v.uri}">${v.label}</option>`)}
                            </wl-select>
                            ${(this._compareB.version && this._configsB)? html`
                            <wl-select id="selector-config-b" label="Configuration:" @input="${this._onConfigBChange}"
                                       value="${this._compareB.config}">
                                <option value="">Any configuration</option>
                                ${this._configsB.map((c:any) => html`<option value="${c.uri}">${c.label}</option>`)}
                            </wl-select>
                            `:html``}
                            ${(this._compareB.config && this._calibrationsB)? html`
                            <wl-select id="selector-calibration-b" label="Calibration:" @input="${this._onCalibrationBChange}"
                                       value="${this._compareB.calibration}">
                                <option value="">Any calibration</option>
                                ${this._calibrationsB.map((c:any) => html`<option value="${c.uri}">${c.label}</option>`)}
                            </wl-select>
                            ` :html``}
                            `
                            : html`<wl-progress-spinner></wl-progress-spinner>`}
                        </div>
                        ` 
                        :html`
                        <div style="text-align:center;">
                            Select a model below or <a class="clickable" @click="${this._setBfromA}">compare across configurations</a>
                        </div>`}
                    </td>

                </tr>
            </table>
        `
        : html``}`;
    }

    _onVersionAChange () {
        let selector : HTMLElement | null = this.shadowRoot!.getElementById('selector-version-a');
        if (selector && this._modelA) {
            store.dispatch(explorerSetCompareA({model: this._modelA.uri, version: selector['value']? selector['value'] : ''}));
        }
    }

    _onConfigAChange () {
        let selector : HTMLElement | null = this.shadowRoot!.getElementById('selector-config-a');
        if (selector) {
            store.dispatch(explorerSetCompareA({...this._compareA, config: selector['value']? selector['value'] : '', calibration: ''}));
        }
    }

    _onCalibrationAChange () {
        let selector : HTMLElement | null = this.shadowRoot!.getElementById('selector-calibration-a');
        if (selector) {
            store.dispatch(explorerSetCompareA({...this._compareA, calibration: selector['value'] ? selector['value'] : ''}));
        }
    }
    _onVersionBChange () {
        let selector : HTMLElement | null = this.shadowRoot!.getElementById('selector-version-b');
        if (selector && this._modelB) {
            store.dispatch(explorerSetCompareB({model: this._modelB.uri, version: selector['value']? selector['value'] : ''}));
        }
    }

    _onConfigBChange () {
        let selector : HTMLElement | null = this.shadowRoot!.getElementById('selector-config-b');
        if (selector) {
            store.dispatch(explorerSetCompareB({...this._compareB, config: selector['value']? selector['value'] : '', calibration: ''}));
        }
    }

    _onCalibrationBChange () {
        let selector : HTMLElement | null = this.shadowRoot!.getElementById('selector-calibration-b');
        if (selector) {
            store.dispatch(explorerSetCompareB({...this._compareB, calibration: selector['value'] ? selector['value'] : ''}));
        }
    }

    _updateSelectOptions (selectId:string, data:any, selectedValue:string) {
        let selector : HTMLElement | null = this.shadowRoot!.getElementById(selectId);
        if (selector) {
            let mySelect = selector.getElementsByTagName('select')[0];
            while (mySelect.options.length > 1) {
                mySelect.remove(mySelect.options.length - 1);
            }
            for (let i = 0; i < data.length; i++) {
                let opt = document.createElement('option');
                opt.text = data[i].label;
                opt.value = data[i].uri;
                if (data[i].uri === selectedValue) {
                    opt.selected = true;
                }

                mySelect.add(opt, null);
            }
        }
    }

    _clearA () {
        if (this._compareB) {
            store.dispatch(explorerSetCompareA(this._compareB));
            store.dispatch(explorerSetCompareB({}));
        } else {
            store.dispatch(explorerSetCompareA({}));
        }
    }

    _clearB () {
        store.dispatch(explorerSetCompareB({}));
    }

    _setBfromA () {
        store.dispatch(explorerSetCompareB(this._compareA));
    }

    stateChanged(state: RootState) {
        if (state.explorerUI) {
            if (state.explorerUI.compareA) {
                if (state.explorerUI.compareA.model === '') {
                    this._compareA = null;
                    this._modelA = null;
                } else if (!this._compareA || state.explorerUI.compareA.model !== this._compareA.model) {
                    if (state.explorer && state.explorer.models && state.explorer.models[state.explorerUI.compareA.model]) {
                        this._modelA = state.explorer.models[state.explorerUI.compareA.model];
                        if (!state.explorer.versions || !state.explorer.versions[this._modelA!.uri]) {
                            store.dispatch(explorerFetchVersions(this._modelA!.uri));
                        }
                    } else {
                        this._modelA = null;
                    }
                }
                this._compareA = state.explorerUI.compareA;
            }
            if (state.explorerUI.compareB) {
                if (state.explorerUI.compareB.model === '') {
                    this._compareB = null;
                    this._modelB = null;
                } else if (!this._compareB || state.explorerUI.compareB.model !== this._compareB.model) {
                    if (state.explorer && state.explorer.models && state.explorer.models[state.explorerUI.compareB.model]) {
                        this._modelB = state.explorer.models[state.explorerUI.compareB.model];
                        if (!state.explorer.versions || !state.explorer.versions[this._modelB!.uri]) {
                            store.dispatch(explorerFetchVersions(this._modelB!.uri));
                        }
                    } else {
                        this._modelB = null;
                    }
                }
                this._compareB = state.explorerUI.compareB;
            }
        }

        if (this._compareA && state.explorer) {
            if (this._compareA.model && state.explorer.versions) {
                this._versionsA = state.explorer.versions[this._compareA.model] || null;
                this._configsA = null;
                this._calibrationsA = null;
            }

            if (this._compareA.version && this._versionsA) {
                let thisVersion = this._versionsA.filter((v:any) => v.uri===this._compareA!.version)[0];
                this._configsA = thisVersion.configs || null;
                this._updateSelectOptions('selector-config-a', this._configsA, this._compareA.config);
                this._calibrationsA = null;
            }

            if (this._compareA.config && this._configsA) {
                let thisConfig = this._configsA.filter((c:any) => c.uri===this._compareA!.config)[0];
                this._calibrationsA = thisConfig.calibrations ? thisConfig.calibrations :null;
                this._updateSelectOptions('selector-calibration-a', this._calibrationsA, this._compareA.calibration);
            }
        }

        if (this._compareB && state.explorer) {
            if (this._compareB.model && state.explorer.versions) {
                this._versionsB = state.explorer.versions[this._compareB.model] || null;
                this._configsB = null;
                this._calibrationsB = null;
            }

            if (this._compareB.version && this._versionsB) {
                let thisVersion = this._versionsB.filter((v:any) => v.uri===this._compareB!.version)[0];
                this._configsB = thisVersion.configs || null;
                this._updateSelectOptions('selector-config-b', this._configsB, this._compareB.config);
                this._calibrationsB = null;
            }

            if (this._compareB.config && this._configsB) {
                let thisConfig = this._configsB.filter((c:any) => c.uri===this._compareB!.config)[0];
                this._calibrationsB = thisConfig.calibrations ? thisConfig.calibrations :null;
                this._updateSelectOptions('selector-calibration-b', this._calibrationsB, this._compareB.calibration);
            }
        }

    }
}
