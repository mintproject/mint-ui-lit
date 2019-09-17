import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from '../../app/actions';

import { fetchAuthorsForModelConfig, fetchParametersForConfig, fetchMetadataNoioForModelConfig } from '../../util/model-catalog-actions';

import "weightless/slider";
import "weightless/progress-spinner";
import '../../components/loading-dots'
import { UriModels } from '../../util/model-catalog-reducers';

@customElement('models-configure')
export class ModelsConfigure extends connect(store)(PageViewElement) {
    @property({type: Boolean})
    private _hideModels : boolean = false;

    @property({type: Boolean})
    private _editing : boolean = false;

    @property({type: Object})
    private _models : UriModels | null = null;

    @property({type: Object})
    private _config: any = null;

    @property({type: Object})
    private _calibration: any = null;

    @property({type: Object})
    private _versions : any = null;

    @property({type: Object})
    private _configParameters : any = null;

    @property({type: Object})
    private _calibrationParameters : any = null;

    @property({type: Object})
    private _configMetadata : any = null;

    @property({type: Object})
    private _calibrationMetadata : any = null;

    @property({type: Object})
    private _configAuthors : any = null;

    @property({type: Object})
    private _calibrationAuthors : any = null;

    private _selectedModel : string = '';
    private _selectedConfig : string = '';
    private _selectedCalibration : string = '';

    static get styles() {
        return [
            css `
            .cltrow wl-button {
                padding: 2px;
            }

            .card2 {
                margin: 0px;
                left: 0px;
                right: 0px;
                padding: 10px;
                padding-top: 5px;
                height: calc(100% - 40px);
                background: #FFFFFF;
            }

            .twocolumns {
                position: absolute;
                top: 120px;
                bottom: 25px;
                left: 25px;
                right: 25px;
                display: flex;
                border: 1px solid #F0F0F0;
            }

            .left {
                width: 30%;
                padding-top: 0px;
                border-right: 1px solid #F0F0F0;
                padding-right: 5px;
                overflow: auto;
                height: 100%;
            }

            .left_closed {
                width: 0px;
                overflow: hidden;
            }

            .right, .right_full {
                width: 70%;
                padding-top: 0px;
                overflow: auto;
                height: 100%;
            }

            .right_full {
                width: 100%;
            }

            wl-slider > .value-edit {
                width: 40px;
            }

            input.value-edit {
                background-color: transparent;
                border: 0px;
                text-align: right;
            }

            input.value-edit {
                background-color: transparent;
                border: 0px;
                text-align: right;
            }

            input.value-edit:hover {
                border-bottom: 1px dotted black;
                margin-bottom: -1px;
            }

            input.value-edit:focus {
                border-bottom: 1px solid black;
                margin-bottom: -1px;
                outline-offset: -0px;
                outline: -webkit-focus-ring-color auto 0px;
            }

            th > wl-icon {
                text-size: .8em;
                vertical-align: bottom;
                margin-left: 4px;
            }

            .inline-new-button {
                line-height: 1.2em;
                font-size: 1.2em;
            }

            .inline-new-button > wl-icon {
                --icon-size: 1.2em;
                vertical-align: top;
            }
            `,
            SharedStyles
        ];
    }

    _goToUrl (modelUri, version, config, calibration?) {
        let url = 'models/configure/' + modelUri.split('/').pop() + '/' + (version.id || version.uri.split('/').pop())
                + '/' + config.uri.split('/').pop() + (calibration? '/' + calibration.uri.split('/').pop() : '');
        this._editing = false;
        goToPage(url);
    }

    _renderVersionTree () {
        if (!this._versions || !this._models) 
            return html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`;
        return html `
        <ul>
            ${Object.entries(this._versions).filter(([modelUri, v]) => this._models[modelUri]).map(([modelUri, vers]) => html`
            <li>
                ${this._models && this._models[modelUri] ? this._models[modelUri].label : 'no name or loading'}
                <ul>
                    ${(<any>vers).map((v) => html`
                    <li>
                        ${v.label}
                        <ul>
                            ${(v.configs || []).map((cfg) => html`
                            <li>
                                <a @click="${()=>{this._goToUrl(modelUri, v, cfg)}}">${cfg.label}</a>
                                <ul>
                                    ${(cfg.calibrations || []).map((cal) => html`
                                    <li>
                                        <a @click="${()=>{this._goToUrl(modelUri, v, cfg, cal)}}">${cal.label}</a>
                                    </li>`)}
                                    <li><a class="inline-new-button"><wl-icon>add_circle_outline</wl-icon> Add new setup</a></li>
                                </ul>
                            </li>`)}
                            <li><a class="inline-new-button"><wl-icon>add_circle_outline</wl-icon> Add new configuration</a></li>
                        </ul>
                    </li>`)}
                </ul>
            </li>`)}
        </ul>`
    }

    _dump (obj) {
        if (obj)
            return html`<ul>${Object.entries(obj).map(([key, val]) => html`<li><b>${key}:</b> ${val}</li>`)}</ul>`
    }

    protected render() {
        //console.log(Object.values(this._models||{}).filter((m) => (!this._versions[m.uri] || this._versions[m.uri].length>0)));
        return html`
        <div class="twocolumns">
            <div class="${this._hideModels ? 'left_closed' : 'left'}">
                <div class="clt">
                    <div class="cltrow_padded">
                        <div class="cltmain">
                            <wl-title level="4" style="margin: 0px">Models:</wl-title>
                        </div>
                    </div>                    
                    ${this._renderVersionTree()}
                </div>
            </div>

            <div class="${this._hideModels ? 'right_full' : 'right'}">
                <div class="card2">
                    <wl-icon @click="${() => this._hideModels = !this._hideModels}"
                        class="actionIcon bigActionIcon" style="float:right">
                        ${!this._hideModels ? "fullscreen" : "fullscreen_exit"}
                    </wl-icon>
                    <div class="cltrow_padded">
                        <div class="cltmain">
                            <wl-title level="3" style="margin: 0px">
                                ${this._calibration ? this._calibration.label : (this._config ? this._config.label : 'Select a configuration or calibration on the left panel.')}
                            </wl-title>
                        </div>
                    </div>

                    ${this._calibration ? this._renderCalibration() : (this._config ? this._renderConfig() : '')}
                </div>
            </div>
        </div>
        `
    }

    _renderCalibration () {
        let loadingMeta = !this._calibrationMetadata;
        let loadingParams = !this._calibrationParameters;
        let meta = (!loadingMeta && this._calibrationMetadata.length > 0) ? this._calibrationMetadata[0] : null;
        let params = (!loadingParams && this._calibrationParameters.length > 0) ? this._calibrationParameters : null;
        return html`
        <div style="margin-bottom: 1em;">
            <b>Description:</b>
            ${loadingMeta ? html`<loading-dots style="--width: 20px"></loading-dots>` : meta.desc}
        </div>
        ${loadingParams ? html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`
        : (params ? html`
        <table class="pure-table pure-table-striped" style="width: 100%">
            <thead>
                <th><b>#</b></th>
                <th><b>Label</b></th>
                <th><b>Type</b></th>
                <th><b>Datatype</b></th>
                <th style="text-align: right;"><b>Default Value</b></th>
                <th style="text-align: right;">
                    <b>Value in this setup</b>
                    ${this._editing? html`<wl-icon>edit</wl-icon>` : ''}
                </th>
                <th style="text-align: right;"><b>Unit</b></th>
            </thead>
            <tbody>
            ${params.map((p:any) => html`<tr>
                <td>${p.position}</td>
                <td>
                    <b>${p.description}</b><br/>
                    <code>${p.paramlabel}</code>
                </td>
                <td>${p.type}</td>
                <td>
                    ${p.pdatatype}
                    ${(p.minVal || p.maxVal) ? html`<br/><span style="font-size: 11px;">Range is from ${p.minVal} to ${p.maxVal}</span>` : '' }
                </td>
                <td style="text-align: right;">${p.defaultvalue}</td>
                <td style="text-align: right;">
                    ${this._editing ? html`
                    <input class="value-edit" type="text" placeholder="-" value="${p.fixedValue || ''}"></input>
                    ` : (p.fixedValue || '-')}
                </td>
                <td style="text-align: right;">${p.unit}</td>
            </tr>`)}
            </tbody>
        </table>

        <div style="float:right; margin-top: 1em;">
            ${this._editing? html`
            <wl-button @click="${()=>{this._editing = false;}}" style="margin-right: 1em;" flat inverted>
                <wl-icon>cancel</wl-icon>&ensp;Discard changes
            </wl-button>
            <wl-button @click="${()=>{alert('Sorry! Save function its not available yet.')}}">
                <wl-icon>save</wl-icon>&ensp;Save
            </wl-button>
            `
            : html`
            <wl-button @click="${()=>{this._editing = true;}}">
                <wl-icon>edit</wl-icon>&ensp;Edit
            </wl-button>
            `}
        </div>`
        : html`<p>${this._calibration.label} has no parameters.</p>`)}
        `
    }

    _renderConfig () {
        let loadingMeta = !this._configMetadata;
        let loadingParams = !this._configParameters;
        let meta = (!loadingMeta && this._configMetadata.length > 0) ? this._configMetadata[0] : null;
        let params = (!loadingParams && this._configParameters.length > 0) ? this._configParameters : null;
        return html`
        <div style="margin-bottom: 1em;">
            <b>Description:</b>
            ${loadingMeta ? html`<loading-dots style="--width: 20px"></loading-dots>` : meta.desc}
        </div>
        ${loadingParams ? html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`
        : (params ? html`
        <table class="pure-table pure-table-striped" style="width: 100%">
            <thead>
                <th><b>#</b></th>
                <th><b>Label</b></th>
                <th><b>Type</b></th>
                <th><b>Datatype</b></th>
                <th style="text-align: right;">
                    <b>Default Value</b>
                    ${this._editing ? html`<wl-icon>edit</wl-icon>` : ''}
                </th>
                <th style="text-align: right;"><b>Unit</b></th>
            </thead>
            <tbody>
            ${params.map((p:any) => html`<tr>
                <td>${p.position}</td>
                <td>
                    <b>${p.description}</b><br/>
                    <code>${p.paramlabel}</code>
                </td>
                <td>${p.type}</td>
                <td>
                    ${p.pdatatype}
                    ${(!this._editing && (p.minVal || p.maxVal)) ? html`<br/><span style="font-size: 11px;">Range is from ${p.minVal} to ${p.maxVal}</span>` : '' }
                </td>
                <td style="text-align: right;">
                    ${this._editing ? ((p.minVal || p.maxVal) ? html`
                    <wl-slider thumblabel value="${p.defaulvalue}" min="${p.minVal}" max="${p.maxVal}">
                        <input slot="before" class="value-edit" type="number" placeholder="-" value="${p.minVal || ''}"></input>
                        <input slot="after" class="value-edit" type="number" placeholder="-" value="${p.maxVal || ''}"></input>
                    </wl-slider>
                    ` : html`
                    <input class="value-edit" type="text" placeholder="-" value="${p.defaultvalue || ''}"></input>
                    `) : (p.defaultvalue || '-')}
                </td>
                <td style="text-align: right;">${p.unit}</td>
            </tr>`)}
            </tbody>
        </table>

        <div style="float:right; margin-top: 1em;">
            ${this._editing? html`
            <wl-button @click="${()=>{this._editing = false;}}" style="margin-right: 1em;" flat inverted>
                <wl-icon>cancel</wl-icon>&ensp;Discard changes
            </wl-button>
            <wl-button @click="${()=>{alert('Sorry! Save function its not available yet.')}}">
                <wl-icon>save</wl-icon>&ensp;Save
            </wl-button>
            `
            : html`
            <wl-button @click="${()=>{this._editing = true;}}">
                <wl-icon>edit</wl-icon>&ensp;Edit
            </wl-button>
            `}
        </div>`
        : html`<p>${this._config.label} has no parameters.</p>`)}
        `
    }

    stateChanged(state: RootState) {
        if (state.explorerUI) {
            let ui = state.explorerUI;
            // check whats changed
            let modelChanged : boolean = (ui.selectedModel !== this._selectedModel);
            let configChanged : boolean = (modelChanged || ui.selectedConfig !== this._selectedConfig);
            let calibrationChanged : boolean = (configChanged || ui.selectedCalibration !== this._selectedCalibration);

            if (modelChanged) {
                this._selectedModel = ui.selectedModel;
            }
            if (configChanged) {
                if (ui.selectedConfig) {
                    store.dispatch(fetchMetadataNoioForModelConfig(ui.selectedConfig));
                    store.dispatch(fetchParametersForConfig(ui.selectedConfig));
                    store.dispatch(fetchAuthorsForModelConfig(ui.selectedConfig));
                }
                this._selectedConfig = ui.selectedConfig;
                this._config = null;
                this._configMetadata = null;
                this._configAuthors = null;
                this._configParameters = null;
            }
            if (calibrationChanged) {
                if (ui.selectedCalibration) {
                    store.dispatch(fetchMetadataNoioForModelConfig(ui.selectedCalibration));
                    store.dispatch(fetchParametersForConfig(ui.selectedCalibration));
                    store.dispatch(fetchAuthorsForModelConfig(ui.selectedCalibration));
                }
                this._selectedCalibration = ui.selectedCalibration;
                this._calibration = null;
                this._calibrationMetadata = null;
                this._calibrationAuthors = null;
                this._calibrationParameters = null;
            }

            if (state.explorer) {
                let db = state.explorer;
                this._versions = db.versions;
                this._models   = db.models;
                if (!this._config && this._versions[this._selectedModel]) {
                    this._config = this._versions[this._selectedModel].reduce((acc, v) => {
                        if (acc) return acc;
                        return (v.configs || []).reduce((ac, c) => {
                            if (ac) return ac;
                            return (c.uri === this._selectedConfig) ? c : null;
                        }, null);
                    }, null);
                }
                if (!this._calibration && this._config) {
                    this._calibration = (this._config.calibrations || []).reduce((acc,c) => {
                        if (acc) return acc;
                        return (c.uri === this._selectedCalibration) ? c : null;
                    }, null);
                }

                if (db.authors) {
                    if (!this._configAuthors && this._config) this._configAuthors = db.authors[this._config.uri];
                    if (!this._calibrationAuthors && this._calibration) this._calibrationAuthors = db.authors[this._calibration.uri];
                }

                if (db.metadata) {
                    if (!this._configMetadata && this._config) this._configMetadata = db.metadata[this._selectedConfig];
                    if (!this._calibrationMetadata && this._calibration) this._calibrationMetadata = db.metadata[this._selectedCalibration];
                }

                if (db.parameters) {
                    if (!this._configParameters && this._config) this._configParameters = db.parameters[this._selectedConfig];
                    if (!this._calibrationParameters && this._calibration) this._calibrationParameters = db.parameters[this._selectedCalibration];
                }
            }
        }
    }
}
