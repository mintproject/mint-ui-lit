import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../model-explore/explorer-styles'

import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';

//import { renderNotifications } from "util/ui_renders";
//import { showNotification, showDialog, hideDialog } from 'util/ui_functions';

import { parameterGet } from 'model-catalog/actions';

import "weightless/slider";
import "weightless/progress-spinner";
//import "weightless/tab";
//import "weightless/tab-group";
import 'components/loading-dots'

@customElement('models-configure-configuration')
export class ModelsConfigureConfiguration extends connect(store)(PageViewElement) {
    @property({type: Boolean})
    private _editing : boolean = false;

    @property({type: Object})
    private _models : any = null;

    @property({type: Object})
    private _versions : any = null;

    @property({type: Object})
    private _configs : any = null;

    @property({type: Object})
    private _model: any = null;

    @property({type: Object})
    private _version: any = null;

    @property({type: Object})
    private _config: any = null;

    @property({type: Object})
    private _setup: any = null;

    @property({type: Object})
    private _configParameters : any = {};

    @property({type: Object})
    private _setupParameters : any = null;

    @property({type: Object})
    private _configMetadata : any = null;

    @property({type: Object})
    private _setupMetadata : any = null;

    @property({type: Object})
    private _configAuthors : any = null;

    @property({type: Object})
    private _setupAuthors : any = null;

    @property({type: Object})
    private _configInputs : any = null;

    @property({type: Object})
    private _setupInputs : any = null;

    private _url : string = '';
    private _selectedModel : string = '';
    private _selectedVersion : string = '';
    private _selectedConfig : string = '';
    private _selectedSetup : string = '';

    static get styles() {
        return [ExplorerStyles, SharedStyles, css`
            .cltrow wl-button {
                padding: 2px;
            }

            wl-slider > .value-edit {
                width: 47px;
            }

            input.value-edit {
                width: 100%;
                background-color: transparent;
                border: 0px;
                text-align: right;
                font-size: 16px;
                font-weight: 400;
                family: Raleway;
            }

            input.value-edit::placeholder {
                color: rgb(136, 142, 145);
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
                vertical-align: bottom;
                margin-left: 4px;
                --icon-size: 14px;
            }

            .inline-new-button {
                line-height: 1.2em;
                font-size: 1.2em;
            }

            .inline-new-button > wl-icon {
                --icon-size: 1.2em;
                vertical-align: top;
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
                text-align: right;
                padding-right: 6px;
            }

            .details-table tr:nth-child(odd) {
                background-color: rgb(246, 246, 246);
            }
            `,
        ];
    }

    _cancel () {
        /* this._url never stores /edit or /new so this go back */
        goToPage(this._url);
    }

    _edit () {
        goToPage(this._url + '/edit');
    }

    _saveConfig () {
        let labelEl = this.shadowRoot.getElementById('edit-config-name') as HTMLInputElement;
        let descEl = this.shadowRoot.getElementById('edit-config-desc') as HTMLInputElement;
        let keywordsEl = this.shadowRoot.getElementById('edit-config-keywords') as HTMLInputElement;
        let authEl = this.shadowRoot.getElementById('edit-config-authors') as HTMLInputElement;
        let imgEl = this.shadowRoot.getElementById('edit-config-sw-img') as HTMLInputElement;
        let repoEl = this.shadowRoot.getElementById('edit-config-repo') as HTMLInputElement;
        let complocEl = this.shadowRoot.getElementById('edit-config-comp-loc') as HTMLInputElement;
        let paramEls = this.shadowRoot.querySelectorAll('.edit-config-param');
        // TODO: capture min and max val, check what to do with the inputs
        let inputEls = this.shadowRoot.querySelectorAll('.edit-config-input');
        if (labelEl && descEl && authEl) {
            let label = labelEl.value;
            let desc = descEl.value;
            let auth = authEl.value;
            let keywords = keywordsEl.value;
            let dImg = imgEl.value;
            let repo = repoEl.value;
            let compLoc = complocEl.value;
            let params = Array.from(paramEls).map(e => (<HTMLInputElement>e).value);
            let inputs = Array.from(inputEls).map(e => (<HTMLInputElement>e).value);

            if (!label) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>labelEl).refreshAttributes();
                return;
            }

            let newConfigMeta = Object.assign({}, this._configMetadata[0]);
            newConfigMeta.desc = desc;
            newConfigMeta.keywords = keywords.split(',');
            newConfigMeta.repo = repo;
            newConfigMeta.compLoc = compLoc;
            newConfigMeta.dImg = dImg;

            let newAuthors = auth.split(',').map(x => {return {label: x, name: x}});
            
            let newConfigParameters = Object.assign({}, this._configParameters);
            for (let i = 0; i < params.length; i++) {
                newConfigParameters[i]['defaultvalue'] = params[i];
            }

            /*let newConfigInputs = Object.assign({}, this._configInputs);
            for (let i = 0; i < inputs.length; i++) {
                newConfigInputs[i]['fixedValueURL'] = inputs[i];
            }*/

            store.dispatch(addParameters(this._config.uri, Object.values(newConfigParameters)));
            store.dispatch(addMetadata(this._config.uri, [newConfigMeta]));
            //store.dispatch(addInputs(this._config.uri, Object.values(Object.assign(newConfigInputs))));
            //store.dispatch(addAuthor(this._config.uri, newAuthors))
            showNotification("saveNotification", this.shadowRoot!);
            goToPage(this._url);
        }
    }

    _getId (resource) {
        return resource.id.split('/').pop();
    }

    _createUrl (model, version?, config?, setup?) {
        let url = 'models/configure/' + this._getId(model);
        if (version) {
            url += '/' + this._getId(version);
            if (config) {
                url += '/' + this._getId(config);
                if (setup) {
                    url += '/' + this._getId(setup);
                }
            }
        }
        return url;
    }

    _select (model, version, config, setup?) {
        goToPage(this._createUrl(model, version, config, setup));
    }

    _selectNew (model, version, config?) {
        goToPage(this._createUrl(model, version, config) + '/new');
    }

    protected render() {
        return html`
        <table class="details-table">
            <tr>
                <td>Description:</td>
                <td>${this._config.description}<td>
            </tr>
            <tr>
                <td>Keywords:</td>
                <td>${this._config.keywords}<td>
            </tr>
            <tr>
                <td>Software Image:</td>
                <td><code>${this._config.hasSoftwareImage}</code><td>
            </tr>
            <tr>
                <td>Component Location:</td>
                <td>${this._renderExternalLink(this._config.hasComponentLocation)}<td>
            </tr>
            <tr>
                <td>Grid:</td>
                <td>${this._config.hasGrid ? this._config.hasGrid[0].id : 'No grid'}<td>
            </tr>
        </table>

        <wl-title level="4" style="margin-top:1em;">Parameters:</wl-title>
        <table class="pure-table pure-table-striped" style="width: 100%">
            <thead>
                <th class="ta-right"><b>#</b></th>
                <th><b>Label</b></th>
                <th><b>Type</b></th>
                <th style="text-align: right;">
                    <b>Default Value</b>
                </th>
                <th style="text-align: right;"><b>Unit</b></th>
            </thead>
            <tbody>
            ${this._config.hasParameter ? this._config.hasParameter.map(x => typeof x === 'object' ? x.id : x).map((uri:string) => html`
            <tr>
                ${this._configParameters[uri] ? html`
                <td class="ta-right">${this._configParameters[uri].position}</td>
                <td>
                    <code>${this._configParameters[uri].label}</code><br/>
                    <b>${this._configParameters[uri].description}</b>
                </td>
                <td>
                    ${this._renderParameterType(this._configParameters[uri])}
                </td>
                <td style="text-align: right;">
                    ${this._configParameters[uri].hasDefaultValue ? this._configParameters[uri].hasDefaultValue : '-'}
                </td>
                <td style="text-align: right;">${this._configParameters[uri].usesUnit}</td>`
                : html`<tr><td colspan="5" style="text-align: center;"> <wl-progress-spinner></wl-progress-spinner> </td></tr>`}
            </tr>`)
            : html`<tr><td colspan="5" class="info-center">- This configuration has no parameters -</td></tr>`}
            </tbody>
        </table>


        <div style="float:right; margin-top: 1em;">
            <wl-button @click="${this._edit}">
                <wl-icon>edit</wl-icon>&ensp;Edit
            </wl-button>
        </div>`
        return html`
        HI!
        `
    }

    _renderEditConfig () {
        let loadingMeta = !this._configMetadata;
        let loadingParams = !this._configParameters;
        let loadingIO = !this._configInputs
        let meta = (!loadingMeta && this._configMetadata.length > 0) ? this._configMetadata[0] : null;
        let params = (!loadingParams && this._configParameters.length > 0) ? this._configParameters : null;
        let inputs = (!loadingIO && this._configInputs.length > 0) ? this._configInputs : null;

        return html`
        <div style="margin-bottom: 1em;">
            <wl-textfield id="edit-config-name" label="Config name" value="${this._config.label}" disabled></wl-textfield>
            <wl-textarea id="edit-config-desc" label="Description" value="${meta ? meta.desc : ''}"></wl-textarea>
            <wl-textarea id="edit-config-keywords" label="Keywords" value="${meta ? meta.keywords.join(', ') : ''}"></wl-textarea>
            <wl-textfield id="edit-config-authors" label="Authors" value="${this._configAuthors && this._configAuthors.length > 0 ?
                this._configAuthors.map(c => c.name).join(', ') : ''}" disabled></wl-textfield>
            <br/>
            <wl-textfield id="edit-config-sw-img" label="Software Image" value="${meta ? meta.dImg : ''}"></wl-textfield>
            <wl-textfield id="edit-config-repo" label="Repository" value="${meta ? meta.repo : ''}"></wl-textfield>
            <wl-textfield id="edit-config-comp-loc" label="Component Location" value="${meta ? meta.compLoc : ''}"></wl-textfield>
        </div>

        <wl-title level="4" style="margin-top:1em;">Parameters:</wl-title>
        <table class="pure-table pure-table-striped" style="width: 100%">
            <thead>
                <th class="ta-right"><b>#</b></th>
                <th><b>Label</b></th>
                <th><b>Type</b></th>
                <th style="text-align: right;">
                    <b>Default Value</b>
                </th>
                <th style="text-align: right;"><b>Unit</b></th>
            </thead>
            <tbody>
            ${loadingParams ? html`<tr><td colspan="5" style="text-align: center;"> <wl-progress-spinner></wl-progress-spinner> </td></tr>`
            : ( !params ? html`<tr><td colspan="5" class="info-center">- This configuration has no parameters -</td></tr>`
                : params.map((p:any) => html`
                <tr>
                    <td class="ta-right">${p.position}</td>
                    <td>
                        <code>${p.paramlabel}</code><br/>
                        <b>${p.description}</b>
                    </td>
                    <td>
                        ${p.type} ${p.pdatatype ? '(' + p.pdatatype + ')' : ''}
                        ${(p.minVal || p.maxVal) ? html`<br/><span style="font-size: 11px;">Range is from ${p.minVal} to ${p.maxVal}</span>` : '' }
                    </td>
                    <td style="text-align: right;">
                    ${(p.minVal || p.maxVal) ? html`
                    <wl-slider class="edit-config-param" thumblabel value="${p.defaultvalue}" min="${p.minVal}" max="${p.maxVal}"
                            step="${p.pdatatype=='float' ? .01 : 1}">
                        <input slot="before" class="input-range value-edit" type="number" placeholder="-" value="${p.minVal || ''}"></input>
                        <input slot="after" class="input-range value-edit" type="number" placeholder="-" value="${p.maxVal || ''}"></input>
                    </wl-slider>
                    ` : html`
                    <input class="value-edit edit-config-param" type="text" placeholder="-" value="${p.defaultvalue || ''}"></input>
                    `}
                    </td>
                    <td style="text-align: right;">${p.unit}</td>
                </tr>`))}
            </tbody>
        </table>

        <wl-title level="4" style="margin-top:1em;">Input files:</wl-title>
        <table class="pure-table pure-table-striped" style="width: 100%">
            <colgroup>
                <col span="1">
                <col span="1">
                <col span="1">
                <col span="1">
            </colgroup>
            <thead>
                <th class="ta-right"><b>#</b></th>
                <th><b>Name</b></th>
                <th><b>Description</b></th>
                <th style="text-align: right;"><b>Format</b></th>
            </thead>
            <tbody>
            ${loadingIO ? html`<tr><td colspan="3" style="text-align: center;"> <wl-progress-spinner></wl-progress-spinner> </td></tr>`
            : (!inputs ?  html`<tr><td colspan="3" class="info-center">- This setup has no input files -</td></tr>`
                : inputs.map(i => html`
                <tr>
                    <td class="ta-right">${i.position}</td>
                    <td><code>${i.label}</code></td>
                    <td>${i.desc}</td>
                    <td style="text-align: right;">${i.format}</td>
                </tr>
            `))}
            </tbody>
        </table>

        <div style="float:right; margin-top: 1em;">
            <wl-button @click="${this._cancel}" style="margin-right: 1em;" flat inverted>
                <wl-icon>cancel</wl-icon>&ensp;Discard changes
            </wl-button>
            <wl-button @click="${this._saveConfig}">
                <wl-icon>save</wl-icon>&ensp;Save
            </wl-button>
        </div>`
    }


    _renderExternalLink (uri, label?) {
        return html`<a target='_blank' href="${uri}">${label? label : uri}</a>`
    }

    _renderParameterType (param) {
        let ptype = param.type.filter(p => p != 'Parameter').map(uri => uri.split('#').pop())
        return html`
            ${ptype} ${param.hasDataType ? '(' + param.hasDataType + ')' : ''}
            ${(param.hasMinimumAcceptedValue || param.hasMaximumAcceptedValue) ?
                html`<br/><span style="font-size: 11px;">Range is from ${param.hasMinimumAcceptedValue} to ${param.hasMaximumAcceptedValue}</span>` : '' }
        `
    }

    _renderConfig () {
        /* OBA has no author, description or keywords for some reason
            <b>Authors:</b>
            ${!this._configAuthors ?  html`<loading-dots style="--width: 20px"></loading-dots>`
            : this._configAuthors.map(a => a.name).join(', ')}
            <br/>
         */
         /*
        <wl-title level="4" style="margin-top:1em;">Input files:</wl-title>
        <table class="pure-table pure-table-striped" style="width: 100%">
            <colgroup>
                <col span="1">
                <col span="1">
                <col span="1">
                <col span="1">
            </colgroup>
            <thead>
                <th class="ta-right"><b>#</b></th>
                <th><b>Name</b></th>
                <th><b>Description</b></th>
                <th style="text-align: right;"><b>Format</b></th>
            </thead>
            <tbody>
            ${loadingIO ? html`<tr><td colspan="4" style="text-align: center;"> <wl-progress-spinner></wl-progress-spinner> </td></tr>`
            : (!inputs ?  html`<tr><td colspan="4" class="info-center">- This setup has no input files -</td></tr>`
                : inputs.map(i => html`
                <tr>
                    <td class="ta-right">${i.position}</td>
                    <td><code>${i.label}</code></td>
                    <td>${i.desc}</td>
                    <td style="text-align: right;">${i.format}</td>
                </tr>
            `))}
            </tbody>
        </table>
         */
    }

    updated () {
        if (this._editing) {
            if (this._setup) {
                if (this._setupMetadata && this._setupMetadata.length > 0) {
                    let passignEl = this.shadowRoot.getElementById('edit-setup-passign');
                    if (passignEl) {
                        let selectEl = passignEl.querySelector('select')
                        if (selectEl) {
                            selectEl.value = this._setupMetadata[0].paramAssignMethod;
                            console.log(selectEl)
                        }
                    }
                }
                let keywordsEl = this.shadowRoot.getElementById('edit-setup-keywords');
                if (keywordsEl) (<any>keywordsEl).refreshHeight();
            } else {
                let keywordsEl = this.shadowRoot.getElementById('edit-config-keywords');
                if (keywordsEl) (<any>keywordsEl).refreshHeight();
            }
        }
    }

    private _configParametersLoading : Set<string> = new Set();

    stateChanged(state: RootState) {
        if (state.explorerUI) {
            let ui = state.explorerUI;
            // check whats changed
            let modelChanged : boolean = (ui.selectedModel !== this._selectedModel);
            let versionChanged : boolean = (modelChanged || ui.selectedVersion !== this._selectedVersion)
            let configChanged : boolean = (versionChanged || ui.selectedConfig !== this._selectedConfig);
            this._editing = (ui.mode === 'edit');

            if (modelChanged) {
                this._selectedModel = ui.selectedModel;
                this._model = null;
            }
            if (versionChanged) {
                this._selectedVersion = ui.selectedVersion;
                this._version = null;
            }
            if (configChanged) {
                if (ui.selectedConfig) {
                    //store.dispatch(authorGet(ui.selectedConfig));
                    /*store.dispatch(fetchMetadataNoioForModelConfig(ui.selectedConfig));
                    store.dispatch(fetchParametersForConfig(ui.selectedConfig));
                    store.dispatch(fetchParametersForConfig(ui.selectedConfig));
                    store.dispatch(fetchAuthorsForModelConfig(ui.selectedConfig));
                    store.dispatch(fetchIOAndVarsSNForConfig(ui.selectedConfig));*/
                }
                this._selectedConfig = ui.selectedConfig;
                this._config = null;

                this._configParameters = {};
                this._configParametersLoading = new Set();

                this._configInputs = null;
                this._configInputsLoading = new Set();
            }

            if (state.modelCatalog) {
                let db = state.modelCatalog;

                // Set selected resources
                if (!this._model && db.models && this._selectedModel && db.models[this._selectedModel]) {
                    this._model = db.models[this._selectedModel];
                }
                if (!this._version && db.versions && this._selectedVersion && db.versions[this._selectedVersion]) {
                    this._version = db.versions[this._selectedVersion];
                }
                if (db.configurations) {
                    if (!this._config && this._selectedConfig && db.configurations[this._selectedConfig]) {
                        this._config = db.configurations[this._selectedConfig];
                        //console.log('LOADED CONFIGURATION, FETCHING PARAMETERS...');
                        (this._config.hasParameter || []).forEach((p) => {
                            if (typeof p === 'object') p = p.id;
                            store.dispatch(parameterGet(p));
                            this._configParametersLoading.add(p);
                        });
                    }
                }

                // Other resources
                if (db.parameters) {
                    if (this._configParametersLoading.size > 0 && this._config && this._config.hasParameter) {
                        this._configParametersLoading.forEach((uri:string) => {
                            if (db.parameters[uri]) {
                                let tmp = { ...this._configParameters };
                                tmp[uri] = db.parameters[uri];
                                this._configParameters = tmp;
                                this._configParametersLoading.delete(uri);
                            }
                        })
                    }
                }

                if (db.inputs) {
                    if (this._configParametersLoading.size > 0 && this._config && this._config.hasParameter) {
                        this._configParametersLoading.forEach((uri:string) => {
                            if (db.parameters[uri]) {
                                let tmp = { ...this._configParameters };
                                tmp[uri] = db.parameters[uri];
                                this._configParameters = tmp;
                                this._configParametersLoading.delete(uri);
                            }
                        })
                    }
                }
            }
        }
    }
}
