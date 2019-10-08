import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from '../../app/actions';
import { renderNotifications } from "../../util/ui_renders";
import { showNotification } from "../../util/ui_functions";
import { ExplorerStyles } from './model-explore/explorer-styles'

import './configure/configuration';

import { fetchIOAndVarsSNForConfig, fetchAuthorsForModelConfig, fetchParametersForConfig,
         fetchMetadataNoioForModelConfig, addParameters, addCalibration, addMetadata,
         addInputs, addAuthor } from '../../util/model-catalog-actions';
import { parameterGet } from 'model-catalog/actions';

import { showDialog, hideDialog } from 'util/ui_functions';

import "weightless/slider";
import "weightless/progress-spinner";
import "weightless/tab";
import "weightless/tab-group";
import '../../components/loading-dots'

const sortByPosition = (a,b) => {
    let intA = Number(a.position);
    let intB = Number(b.position);
    return (intA < intB) ? -1 : (intA > intB? 1 : 0);
}

@customElement('models-configure')
export class ModelsConfigure extends connect(store)(PageViewElement) {
    @property({type: Boolean})
    private _hideModels : boolean = false;

    @property({type: Boolean})
    private _editing : boolean = false;

    @property({type: Boolean})
    private _creating : boolean = false;

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
        return [ExplorerStyles,
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
            SharedStyles
        ];
    }

    _cancel () {
        /* this._url never stores /edit or /new so this go back */
        goToPage(this._url);
    }

    _edit () {
        goToPage(this._url + '/edit');
    }

     _uuidv4() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
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

    _saveCalibration () {
        let labelEl = this.shadowRoot.getElementById('edit-setup-name') as HTMLInputElement;
        let descEl = this.shadowRoot.getElementById('edit-setup-desc') as HTMLInputElement;
        let keywordsEl = this.shadowRoot.getElementById('edit-setup-keywords') as HTMLInputElement;
        let authEl = this.shadowRoot.getElementById('edit-setup-authors') as HTMLInputElement;
        let methodEl = this.shadowRoot.getElementById('edit-setup-passign') as HTMLInputElement;
        let imgEl = this.shadowRoot.getElementById('edit-setup-sw-img') as HTMLInputElement;
        let repoEl = this.shadowRoot.getElementById('edit-setup-repo') as HTMLInputElement;
        let complocEl = this.shadowRoot.getElementById('edit-setup-comp-loc') as HTMLInputElement;
        let paramEls = this.shadowRoot.querySelectorAll('.edit-setup-param');
        let inputEls = this.shadowRoot.querySelectorAll('.edit-setup-input');
        if (labelEl && descEl && authEl) {
            let label = labelEl.value;
            let desc = descEl.value;
            let auth = authEl.value;
            let method = methodEl.value;
            let keywords = keywordsEl.value;
            let dImg = imgEl.value;
            let repo = repoEl.value;
            let compLoc = complocEl.value;
            let params = Array.from(paramEls).map(e => (<HTMLInputElement>e).value);
            let inputs = Array.from(inputEls).map(e => (<HTMLInputElement>e).value);

            if (!label || !method) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>labelEl).refreshAttributes();
                (<any>methodEl).refreshAttributes();
                return;
            }

            let newSetupMeta = Object.assign({}, this._setupMetadata[0]);
            newSetupMeta.paramAssignMethod = method;
            newSetupMeta.desc = desc;
            newSetupMeta.keywords = keywords.split(',');
            newSetupMeta.repo = repo;
            newSetupMeta.compLoc = compLoc;
            newSetupMeta.dImg = dImg;

            let newAuthors = auth.split(',').map(x => {return {label: x, name: x}});
            
            let newSetupParameters = Object.assign({}, this._setupParameters);
            for (let i = 0; i < params.length; i++) {
                newSetupParameters[i]['fixedValue'] = params[i];
            }

            let newSetupInputs = Object.assign({}, this._setupInputs);
            for (let i = 0; i < inputs.length; i++) {
                newSetupInputs[i]['fixedValueURL'] = inputs[i];
            }

            store.dispatch(addParameters(this._setup.uri, Object.values(newSetupParameters)));
            store.dispatch(addMetadata(this._setup.uri, [newSetupMeta]));
            store.dispatch(addInputs(this._setup.uri, Object.values(Object.assign(newSetupInputs))));
            //store.dispatch(addAuthor(this._setup.uri, newAuthors))
            showNotification("saveNotification", this.shadowRoot!);
            goToPage(this._url);
        }
    }

    _save () {
        if (this._editing) {
            alert('Sorry! Save function its not available yet.');
        } else if (this._creating) {
            let labelEl = this.shadowRoot.getElementById('new-setup-label') as HTMLInputElement;
            let descEl = this.shadowRoot.getElementById('new-setup-desc') as HTMLInputElement;
            let authEl = this.shadowRoot.getElementById('new-setup-authors') as HTMLInputElement;
            let methodEl = this.shadowRoot.getElementById('new-setup-assign-method') as HTMLInputElement;
            let paramEls = this.shadowRoot.querySelectorAll('.new-setup-param');
            let inputEls = this.shadowRoot.querySelectorAll('.new-setup-input');
            if (labelEl && descEl && authEl) {
                let label = labelEl.value;
                let desc = descEl.value;
                let auth = authEl.value;
                let method = methodEl.value;
                let params = Array.from(paramEls).map(e => (<HTMLInputElement>e).value);
                let inputs = Array.from(inputEls).map(e => (<HTMLInputElement>e).value);
                if (!label || !method) {
                    showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                    (<any>labelEl).refreshAttributes();
                    (<any>methodEl).refreshAttributes();
                    return;
                }
                
                let id = this._uuidv4();
                let newUri = "https://w3id.org/okn/i/mint/" + id;

                let newSetupParameters = Object.assign({}, this._configParameters);
                for (let i = 0; i < params.length; i++) {
                    newSetupParameters[i]['fixedValue'] = params[i];
                }

                let newSetupMeta = Object.assign({}, this._configMetadata[0]);
                newSetupMeta.paramAssignMethod = method;
                newSetupMeta.desc = desc;
                newSetupMeta.compLoc = '';

                let newAuthor = auth ? {label: auth, name: auth} : {};

                let newSetupInputs = Object.assign({}, this._configInputs);
                for (let i = 0; i < inputs.length; i++) {
                    newSetupInputs[i]['fixedValueURL'] = inputs[i];
                }

                store.dispatch(addParameters(newUri, Object.values(newSetupParameters)));
                store.dispatch(addCalibration(this._config.uri, newUri, label));
                store.dispatch(addMetadata(newUri, [newSetupMeta]));
                store.dispatch(addInputs(newUri, Object.values(Object.assign(newSetupInputs))));
                store.dispatch(addAuthor(newUri, [newAuthor]))
                showNotification("saveNotification", this.shadowRoot!);
                goToPage(this._url + '/' + id);
            }
        }
    }

    _newConfig () {
        showNotification("cantSave", this.shadowRoot!);
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

    _renderVersionTree () {
        if (!this._models) 
            return html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`;
        return html`
        <ul>
            ${Object.values(this._models).filter((model) => !!model.hasVersion).map((model) => html`
            <li>
                ${model.label}
                ${!this._versions ? html`<loading-dots style="--width: 20px"></loading-dots>` : html`
                <ul>
                    ${model.hasVersion.map((v) => this._versions[v.id]).map((version) => html`
                    <li>
                        ${version.label ? version.label : version.id.split('/').pop()}
                        ${!this._configs ? html`<loading-dots style="--width: 20px"></loading-dots>` : html`
                        <ul>
                            ${(version.hasConfiguration || []).map((c) => this._configs[c.id]).map((config) => html`
                            <li>
                                <a @click="${()=>{this._select(model, version, config)}}">
                                    ${config.label}
                                </a>
                                <ul>
                                    ${(config.hasCalibration || []).map((s) => this._configs[s.id]).map(setup => html`
                                    <li>
                                        <a @click="${()=>{this._select(model, version, config, setup)}}">
                                            ${setup.label}
                                        </a>
                                    </li>
                                    `)}
                                    <li>
                                        <a class="inline-new-button" @click="${()=>{this._selectNew(model, version, config)}}">
                                            <wl-icon>add_circle_outline</wl-icon>
                                            Add new setup
                                        </a>
                                    </li>
                                </ul>
                            </li>
                            `)}
                            <li>
                                <a class="inline-new-button" @click="${()=>{this._selectNew(model, version)}}">
                                    <wl-icon>add_circle_outline</wl-icon>
                                    Add new configuration
                                </a>
                            </li>
                        </ul>`}
                    </li>`)}
                </ul>
                `}
            </li>
        `)}
        </ul>`;
    }

    protected render() {
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
                                ${this._creating ? 'Creating a new ' + (this._config ? 'setup' : 'configuration') + ' for ' 
                                : (this._editing ? 'Editing ': '')}
                                ${this._setup ? 
                                    this._setup.label 
                                    : (this._config ? 
                                        this._config.label 
                                        : (this._version ? this._version.label : 'Select a model configuration or setup on the left panel.')
                                )}
                            </wl-title>
                            ${!this._version ? html`
                            <wl-text>
                                Welcome to the configure models tool, here you can create or edit new
                                configurations and setups.
                            </wl-text>
                            ` :''}
                        </div>
                    </div>

                    <div style="padding: 0px 20px;">
                    <models-configure-configuration class="page" ?active="${this._config && !this._setup && !this._creating}"></models-configure-configuration>
                    ${(this._creating && !this._setup) ? 
                        ((this._config) ? this._renderNewSetup() : this._renderNewConfig())
                        : (this._editing ?
                            (this._setup? this._renderEditCalibration() : (this._config? this._renderEditConfig() : '') )
                            : (this._setup ? 
                                this._renderCalibration() 
                                : ''))}

                    </div>
                </div>
            </div>
        </div>
        ${renderNotifications()}
        `
    }

    _renderNewAuthorDialog () {
        let tab = 'author'
        return html`
        <wl-dialog class="larger" id="addAuthorDialog" fixed backdrop blockscrolling>
            <h3 slot="header">Add Author</h3>
            <div slot="content">
                <wl-tab-group align="center" style="background-color: #F6F6F6;">
                    <wl-tab style="background-color: #F6F6F6;" ?checked=${tab=='author'} @click="${() => {tab = 'author'}}">Person</wl-tab>
                    <wl-tab style="background-color: #F6F6F6;" ?checked=${tab=='organization'} @click="${() => {tab = 'organization'}}" disabled>Organization</wl-tab>
                </wl-tab-group>
                ${tab == 'author' ? html`
                <wl-textfield label="Search persons"><wl-icon slot="after">search</wl-icon></wl-textfield>
                <wl-card style="margin-top: 5px; text-align: center;">-No match-</wl-card>
                <br/>
                or <a>create a new Person</a>
                <form>
                    <wl-textfield id="new-author-name" label="Name" required></wl-textfield>
                    <wl-textfield id="new-author-email" label="E-mail" required></wl-textfield>
                    <wl-textfield id="new-author-web" label="Website"></wl-textfield>
                </form>
                ` : html`INS CONTENT`}
            </div>
            <div slot="footer">
                <wl-button @click="${this._onNewAuthorCancel}" style="margin-right: 5px;" inverted flat>Cancel</wl-button>
                <wl-button @click="${this._onNewAuthorSubmit}" class="submit" id="dialog-submit-button">Save</wl-button>
            </div>
        </wl-dialog>`
    }

    _showNewAuthorDialog () {
        console.log('dialog')
        showDialog("addAuthorDialog", this.shadowRoot);
    }

    _onNewAuthorSubmit () {
        console.log('submit')
        let nameEl = this.shadowRoot.getElementById('new-author-name')
        let emailEl = this.shadowRoot.getElementById('new-author-email')
        let webEl = this.shadowRoot.getElementById('new-author-web')
        if (nameEl && emailEl && webEl) {
            //TODO
        }
    }

    _onNewAuthorCancel () {
        hideDialog("addAuthorDialog", this.shadowRoot);
    }

    _renderNewConfig () {
        return html`
        <div style="margin-bottom: 1em;">
            <wl-title level="4">Creating a new configuration</wl-title>
            <wl-textfield id="new-config-name" label="Configuration name" required></wl-textfield>
            <wl-textarea id="new-config-desc" label="Description" ></wl-textarea>
            <wl-textarea id="new-config-keywords" label="Keywords"></wl-textarea>
            <wl-textfield id="new-config-authors" label="Authors"></wl-textfield>
            <br/>
            <wl-textfield id="new-config-sw-img" label="Software Image"></wl-textfield>
            <wl-textfield id="new-config-repo" label="Repository"></wl-textfield>
            <wl-textfield id="new-config-comp-loc" label="Component Location"></wl-textfield>
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
                <tr>
                    <td colspan="4" class="info-center">- This configuration has no parameters -</td>
                    <td colspan="1" style="text-align: right;"><wl-button><wl-icon>add</wl-icon></wl-button></td>
                </tr>
            </tbody>
        </table>

        <wl-title level="4" style="margin-top:1em;">Input files:</wl-title>
        <table class="pure-table pure-table-striped" style="width: 100%">
            <thead>
                <th class="ta-right"><b>#</b></th>
                <th><b>Name</b></th>
                <th><b>Description</b></th>
                <th style="text-align: right;"><b>Format</b></th>
            </thead>
            <tbody>
                <tr>
                    <td colspan="3" class="info-center">- This setup has no input files -</td>
                    <td colspan="1" style="text-align: right;"><wl-button><wl-icon>add</wl-icon></wl-button></td>
                </tr>
            </tbody>
        </table>

        <div style="text-align: right; margin-top: 3em;">
            <wl-button @click="${() => goToPage('models/configure')}" style="margin-right: 1em;" flat inverted>
                <wl-icon>cancel</wl-icon>&ensp;Cancel
            </wl-button>
            <wl-button @click="${this._newConfig}">
                <wl-icon>save</wl-icon>&ensp;Save
            </wl-button>
        </div>
        `
    }

    _renderNewSetup () {
        return html`
        <wl-title level="4">Creating a new setup</wl-title>
        <wl-textfield id="new-setup-label" label="Setup name" required></wl-textfield>
        <wl-textarea id="new-setup-desc" style="--input-font-size: 15px;"label="Description"></wl-textarea>
        <wl-textfield id="new-setup-authors"label="Authors"></wl-textfield>
        <wl-select id="new-setup-assign-method" label="Parameter assignment method" placeholder="Select a parameter assignament method" required>
            <option value="" disabled selected>Please select a parameter assignment method</option>
            <option value="Calibration">Calibration</option>
            <option value="Expert-tuned">Expert tuned</option>
        </wl-select>

        <wl-title level="4" style="margin-top:1em;">Parameters:</wl-title>
        <table class="pure-table pure-table-striped" style="width: 100%">
            <thead>
                <th class="ta-right"><b>#</b></th>
                <th><b>Label</b></th>
                <th><b>Type</b></th>
                <th><b>Datatype</b></th>
                <th style="text-align: right;">
                    <b>Value in this setup</b>
                    <span class="tooltip" tip="If a value is set up in this field, you will not be able to change it in run time. For example, a price adjustment is set up to be 10%, it won't be editable when running the the model">
                        <wl-icon>help</wl-icon>
                    </span>
                    <wl-icon>edit</wl-icon>
                </th>
                <th style="text-align: right;"><b>Unit</b></th>
            </thead>
            <tbody>
            ${!this._configParameters ? html`
            <tr>
                <td colspan="6">
                    <div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>
                </td>
            </tr>
            `
            : (this._configParameters.length == 0 ? html`<tr><td colspan="6">
                <div class="info-center">- This configuration has no parameters -</div>
            </td></tr>`
            : this._configParameters.map((p:any) => html`
            <tr>
                <td class="ta-right">${p.position}</td>
                <td>
                    <b>${p.description}</b><br/>
                    <code>${p.paramlabel}</code>
                </td>
                <td>${p.type}</td>
                <td>
                    ${p.pdatatype}
                </td>
                <td style="text-align: right;">
                    ${(p.minVal || p.maxVal) ? html`
                    <wl-slider thumblabel value="${p.defaulvalue}" min="${p.minVal}" max="${p.maxVal}"
                            step="${p.pdatatype=='float' ? .01 : 1}" class="new-setup-param">
                        <span slot="before" class="int-range">${p.minVal}</span>
                        <span slot="after" class="int-range">${p.maxVal}</span>
                    </wl-slider>
                    ` : (p.pdatatype == 'boolean' ? html`
                    <wl-select class="new-setup-param">
                        <option>True</option>
                        <option>False</option>
                    </wl-select>
                    `: html`
                    <input class="new-setup-param value-edit" type="${(p.pdatatype=='int' || p.pdatatype=='float')? 'number' : 'text'}" 
                        step="${p.datatype=='float' ? 0.01 : 1}"placeholder="${p.defaultvalue}"></input>
                    `)}
                </td>
                <td style="text-align: right;">${p.unit}</td>
            </tr>`))
            }
            </tbody>
        </table>

        <wl-title level="4" style="margin-top:1em;">Input files:</wl-title>
        ${!this._configInputs ? html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`
        : html`
        <table class="pure-table pure-table-striped" style="width: 100%">
            <colgroup>
                <col span="1">
                <col span="1">
                <col span="1">
                <col span="1" style="width: 50%;">
            </colgroup>
            <thead>
                <th class="ta-right"><b>#</b></th>
                <th><b>Name</b></th>
                <th><b>Description</b></th>
                <th><b>File</b></th>
            </thead>
            <tbody>
            ${this._configInputs.length === 0 ?  html`
                <tr>
                    <td colspan="4">
                        <div class="info-center">- This configuration has no input files -</div>
                    </td>
                </tr>`
            : this._configInputs.map(i => html`
                <tr>
                <td class="ta-right">${i.position}</td>
                    <td>${i.label}</td>
                    <td>${i.desc}</td>
                    <td>
                        <input class="new-setup-input value-edit" style="width:100%; text-align: left;" type="url" placeholder="Add an URL"></input>
                    </td>
                </tr>
            `)}
            </tbody>
        </table> `}

        <div style="float:right; border-top: 2em;">
            <wl-button @click="${this._cancel}" style="margin-right: 1em;" flat inverted>
                <wl-icon>cancel</wl-icon>&ensp;Cancel
            </wl-button>
            <wl-button @click="${this._save}">
                <wl-icon>save</wl-icon>&ensp;Save
            </wl-button>
        </div>
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

    _renderEditCalibration () {
        let loadingMeta = !this._setupMetadata;
        let loadingParams = !this._setupParameters;
        let loadingIO = !this._setupInputs;
        let meta = (!loadingMeta && this._setupMetadata.length > 0) ? this._setupMetadata[0] : null;
        let params = (!loadingParams && this._setupParameters.length > 0) ? this._setupParameters : null;
        let inputs = (!loadingIO && this._setupInputs.length > 0) ? this._setupInputs : null;

        return html`
        ${this._renderNewAuthorDialog()}
        <div style="margin-bottom: 1em;">
            <wl-textfield id="edit-setup-name" label="Setup name" value="${this._setup.label}" disabled></wl-textfield>
            <wl-textarea id="edit-setup-desc" label="Description" value="${meta ? meta.desc : ''}"></wl-textarea>
            <wl-textarea id="edit-setup-keywords" label="Keywords" value="${meta ? meta.keywords.join(', ') : ''}"></wl-textarea>
            <wl-textfield id="edit-setup-authors" label="Authors" value="${this._setupAuthors && this._setupAuthors.length > 0 ?
                this._setupAuthors.map(c => c.name).join(', ') : ''}">
                <wl-icon slot="after" @click="${this._showNewAuthorDialog}" class="clickable">add</wl-icon>
            </wl-textfield>
            <wl-select id="edit-setup-passign" label="Parameter assignment method" placeholder="Parameter assignament method" required>
                <option value="" disabled selected>Parameter assignment method</option>
                <option value="Calibration">Calibration</option>
                <option value="Expert-tuned">Expert-tuned</option>
            </wl-select>
            <br/>
            <wl-textfield id="edit-setup-sw-img" label="Software Image" value="${meta ? meta.dImg : ''}"></wl-textfield>
            <wl-textfield id="edit-setup-repo" label="Repository" value="${meta ? meta.repo : ''}"></wl-textfield>
            <wl-textfield id="edit-setup-comp-loc" label="Component Location" value="${meta ? meta.compLoc : ''}"></wl-textfield>
        </div>

        <wl-title level="4">Parameters:</wl-title>
        <table class="pure-table pure-table-striped" style="width: 100%">
            <colgroup>
                <col span="1" style="width: 44px">
                <col span="1" style="width: 28%;">
                <col span="1">
                <col span="1">
                <col span="1">
                <col span="1">
            </colgroup>
            <thead>
                <th class="ta-right"><b>#</b></th>
                <th><b>Label</b></th>
                <th><b>Type</b></th>
                <th style="text-align: right;">
                    <b>Value in this setup</b>
                    <span class="tooltip" tip="If a value is set up in this field, you will not be able to change it in run time. For example, a price adjustment is set up to be 10%, it won't be editable when running the the model">
                        <wl-icon>help</wl-icon>
                    </span>
                </th>
                <th style="text-align: right;"><b>Unit</b></th>
            </thead>

            <tbody>
            ${loadingParams ? html`<tr><td colspan="6" style="text-align: center;"> <wl-progress-spinner></wl-progress-spinner> </td></tr>`
            : ( !params ? html`<tr><td colspan="6" class="info-center">- This setup has no parameters -</td></tr>`
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
                    <wl-slider class="edit-setup-param" thumblabel value="${p.fixedValue || p.defaultvalue}" min="${p.minVal}" max="${p.maxVal}"
                            step="${p.pdatatype=='float' ? .01 : 1}">
                        <span slot="before" class="int-range">${p.minVal}</span>
                        <span slot="after" class="int-range">${p.maxVal}</span>
                    </wl-slider>
                    ` : (p.pdatatype == 'boolean' ? html`
                    <wl-select class="edit-setup-param" value=${p.fixedValue || p.defaultvalue}>
                        <option value="TRUE">True</option>
                        <option value="FALSE">False</option>
                    </wl-select>
                    `: html`
                    <input class="edit-setup-param value-edit" type="${(p.pdatatype=='int' || p.pdatatype=='float')? 'number' : 'text'}" 
                        step="${p.datatype=='float' ? 0.01 : 1}" value="${p.defaultvalue}"></input>
                    `)}
                </td>
                <td style="text-align: right;">${p.unit}</td>
            </tr>`)
            )}
            </tbody>
        </table>

        <wl-title level="4" style="margin-top:1em;">Input files:</wl-title>
        <table class="pure-table pure-table-striped" style="width: 100%">
            <colgroup>
                <col span="1" style="width: 44px">
                <col span="1" style="width: 28%;">
                <col span="1">
            </colgroup>
            <thead>
                <th class="ta-right"><b>#</b></th>
                <th><b>Name</b></th>
                <th><b>File URL in this setup</b></th>
            </thead>
            <tbody>
                ${loadingIO ? html`<tr><td colspan="3" style="text-align: center;"> <wl-progress-spinner></wl-progress-spinner> </td></tr>`
                : (!inputs ?  html`<tr><td colspan="3" class="info-center">- This setup has no input files -</td></tr>`
                : inputs.map(i => html`
                <tr>
                    <td class="ta-right">${i.position}</td>
                    <td>
                        <code>${i.label}</code><br/>
                        <b>${i.desc}</b>
                    </td>
                    <td>
                    <input class="edit-setup-input value-edit" style="width:100%; text-align: left;" type="url" placeholder="Add an URL" value="${i.fixedValueURL || ''}"></input>
                    </td>
                </tr>`)
                )}
            </tbody>
        </table>

        <div style="float:right; margin-top: 1em;">
            <wl-button @click="${this._cancel}" style="margin-right: 1em;" flat inverted>
                <wl-icon>cancel</wl-icon>&ensp;Discard changes
            </wl-button>
            <wl-button @click="${this._saveCalibration}">
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
    }

    _renderCalibration () {
        let loadingMeta = !this._setupMetadata;
        let loadingParams = !this._setupParameters;
        let loadingIO = !this._setupInputs;
        let meta = (!loadingMeta && this._setupMetadata.length > 0) ? this._setupMetadata[0] : null;
        let params = (!loadingParams && this._setupParameters.length > 0) ? this._setupParameters : null;
        let inputs = (!loadingIO && this._setupInputs.length > 0) ? this._setupInputs : null;
        return html`
        <table class="details-table">
            <tr>
                <td>Description:</td>
                <td>${this._setup.description}<td>
            </tr>
            <tr>
                <td>Keywords:</td>
                <td>${this._setup.keywords}<td>
            </tr>
            <tr>
                <td>Software Image:</td>
                <td><code>${this._setup.hasSoftwareImage}</code><td>
            </tr>
            <tr>
                <td>Component Location:</td>
                <td>${this._renderExternalLink(this._setup.hasComponentLocation)}<td>
            </tr>
            <tr>
                <td>Grid:</td>
                <td>${this._setup.hasGrid ? this._setup.hasGrid[0].id : 'No grid'}<td>
            </tr>
        </table>

        <div style="margin-bottom: 1em;">
            <b>Description:</b>
            ${loadingMeta ? html`<loading-dots style="--width: 20px"></loading-dots>` : meta.desc}
            <br/>
            <b>Keywords:</b>
            ${loadingMeta ? html`<loading-dots style="--width: 20px"></loading-dots>` : meta.keywords.join(', ')}
            <br/>
            <b>Parameter assignment method:</b>
            ${loadingMeta ? html`<loading-dots style="--width: 20px"></loading-dots>` : meta.paramAssignMethod}
            <br/>
            <b>Authors:</b>
            ${!this._setupAuthors ? html`<loading-dots style="--width: 20px"></loading-dots>`
            : (this._setupAuthors.length > 0) ? this._setupAuthors.map(a => a.name).join(', ') : 'No authors'}
            <br/>
            <!--b>Time interval:</b-->
            <br/><b>Software Image:</b>
            ${loadingMeta ? html`<loading-dots style="--width: 20px"></loading-dots>` : meta.dImg}
            <br/><b>Repository:</b>
            ${loadingMeta ? html`<loading-dots style="--width: 20px"></loading-dots>` 
                : html`<a href="${meta.repo}" target="_blank">${meta.repo}</a>`}
            <br/><b>Component Location:</b>
            ${loadingMeta ? html`<loading-dots style="--width: 20px"></loading-dots>`
                : html`<a href="${meta.compLoc}" target="_blank">${meta.compLoc}</a>`}
        </div>

        <wl-title level="4">Parameters:</wl-title>
        <table class="pure-table pure-table-striped" style="width: 100%">
            <colgroup>
                <col span="1" style="width: 44px">
                <col span="1" style="width: 28%;">
                <col span="1">
                <col span="1">
                <col span="1">
            </colgroup>
            <thead>
                <th class="ta-right"><b>#</b></th>
                <th><b>Label</b></th>
                <th><b>Type</b></th>
                <th style="text-align: right;">
                    <b>Value in this setup</b>
                    <span class="tooltip" tip="If a value is set up in this field, you will not be able to change it in run time. For example, a price adjustment is set up to be 10%, it won't be editable when running the the model">
                        <wl-icon>help</wl-icon>
                    </span>
                </th>
                <th style="text-align: right;"><b>Unit</b></th>
            </thead>

            <tbody>
            ${loadingParams ? html`<tr><td colspan="6" style="text-align: center;"> <wl-progress-spinner></wl-progress-spinner> </td></tr>`
            : ( !params ? html`<tr><td colspan="6" class="info-center">- This setup has no parameters -</td></tr>`
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
                    ${p.fixedValue ? p.fixedValue : p.defaultvalue + ' (default)'}
                </td>
                <td style="text-align: right;">${p.unit}</td>
            </tr>`)
            )}
            </tbody>
        </table>

        <wl-title level="4" style="margin-top:1em;">Input files:</wl-title>
        <table class="pure-table pure-table-striped" style="width: 100%">
            <colgroup>
                <col span="1" style="width: 44px">
                <col span="1" style="width: 28%;">
                <col span="1">
            </colgroup>
            <thead>
                <th class="ta-right"><b>#</b></th>
                <th><b>Name</b></th>
                <th><b>File URL in this setup</b></th>
            </thead>
            <tbody>
                ${loadingIO ? html`<tr><td colspan="4" style="text-align: center;"> <wl-progress-spinner></wl-progress-spinner> </td></tr>`
                : (!inputs ?  html`<tr><td colspan="4" class="info-center">- This setup has no input files -</td></tr>`
                : inputs.map(i => html`
                <tr>
                    <td class="ta-right">${i.position}</td>
                    <td>
                        <code>${i.label}</code><br/>
                        <b>${i.desc}</b>
                    </td>
                    <td><a target="_blank" href="${i.fixedValueURL}">${i.fixedValueURL}</a>
                    </td>
                </tr>`)
                )}
            </tbody>
        </table>

        <div style="float:right; margin-top: 1em;">
            <wl-button @click="${this._edit}">
                <wl-icon>edit</wl-icon>&ensp;Edit
            </wl-button>
        </div>`
    }

    _renderButtons () {
        return html`
        <div style="float:right; margin-top: 1em;">
            ${this._editing? html`
            <wl-button @click="${this._cancel}" style="margin-right: 1em;" flat inverted>
                <wl-icon>cancel</wl-icon>&ensp;Discard changes
            </wl-button>
            <wl-button @click="${this._save}">
                <wl-icon>save</wl-icon>&ensp;Save
            </wl-button>
            `
            : html`
            <wl-button @click="${this._edit}">
                <wl-icon>edit</wl-icon>&ensp;Edit
            </wl-button>
            `}
        </div>
        `;
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
            let calibrationChanged : boolean = (configChanged || ui.selectedCalibration !== this._selectedSetup);
            this._editing = (ui.mode === 'edit');
            this._creating = (ui.mode === 'new');

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
                this._configMetadata = null;
                this._configAuthors = null;
                this._configParameters = {};
                this._configParametersLoading = new Set();
                this._configInputs = null;
            }
            if (calibrationChanged) {
                if (ui.selectedCalibration) {
                    /*store.dispatch(fetchMetadataNoioForModelConfig(ui.selectedCalibration));
                    store.dispatch(fetchParametersForConfig(ui.selectedCalibration));
                    store.dispatch(fetchAuthorsForModelConfig(ui.selectedCalibration));
                    store.dispatch(fetchIOAndVarsSNForConfig(ui.selectedCalibration));*/
                }
                this._selectedSetup = ui.selectedCalibration;
                this._setup = null;
                this._setupMetadata = null;
                this._setupAuthors = null;
                this._setupParameters = null;
                this._setupInputs = null;
            }

            if (state.modelCatalog) {
                let db = state.modelCatalog;
                this._models = db.models;
                this._versions = db.versions;
                this._configs = db.configurations;

                // Set selected resource
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
                        /*(this._config.hasParameter || []).forEach((p) => {
                            if (typeof p === 'object') p = p.id;
                            store.dispatch(parameterGet(p));
                            this._configParametersLoading.add(p);
                        });*/
                    }
                    if (!this._setup && this._selectedSetup && db.configurations[this._selectedSetup]) {
                        this._setup = db.configurations[this._selectedSetup];
                    }
                }

                // Other resources
                /*if (db.parameters) {
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
                }*/
            }

            if (state.explorer && false) {
                let db = state.explorer;
                this._versions = db.versions;
                this._models   = db.models;

                if (this._versions && !this._version) {
                    let versionId : string = this._selectedVersion.split('/').pop();
                    this._version = (this._versions[this._selectedModel] || []).reduce((V, ver) => {
                        if (V) return V;
                        else return (ver.id === versionId) ? ver : null;
                    }, null)
                }
                if (this._version && !this._config) {
                    this._config = (this._version.configs || []).reduce((C, cfg) => {
                        if (C) return C;
                        else return (cfg.uri === this._selectedConfig) ? cfg : null;
                    }, null);
                    if (this._config) {
                        this._url = 'models/configure/' + this._selectedModel.split('/').pop() + '/' 
                                  + ui.selectedVersion.split('/').pop() + '/' + this._config.uri.split('/').pop();
                    }
                }
                if (this._config && !this._setup) {
                    this._setup = (this._config.calibrations || []).reduce((C, cal) => {
                        if (C) return C;
                        return (cal.uri === this._selectedCalibration) ? cal : null;
                    }, null);
                    if (this._setup) {
                        this._url = 'models/configure/' + this._selectedModel.split('/').pop() + '/' 
                                  + ui.selectedVersion.split('/').pop() + '/' + this._config.uri.split('/').pop()
                                  + '/' + this._setup.uri.split('/').pop();
                    }
                }

                if (db.authors) {
                    if (!this._configAuthors && this._config) this._configAuthors = db.authors[this._config.uri];
                    if (!this._setupAuthors && this._setup) this._setupAuthors = db.authors[this._setup.uri];
                }

                if (db.metadata) {
                    if (!this._configMetadata && this._config) this._configMetadata = db.metadata[this._selectedConfig];
                    if (!this._setupMetadata && this._setup) this._setupMetadata = db.metadata[this._selectedCalibration];
                }

                if (db.parameters) {
                    if (!this._configParameters && this._config && db.parameters[this._selectedConfig]) {
                        this._configParameters = db.parameters[this._selectedConfig].sort(sortByPosition);
                    }
                    if (!this._setupParameters && this._setup && db.parameters[this._selectedCalibration]) {
                        this._setupParameters = db.parameters[this._selectedCalibration].sort(sortByPosition);
                    }
                }

                if (db.inputs) {
                    if (!this._configInputs && this._config && db.inputs[this._selectedConfig]) {
                        this._configInputs = db.inputs[this._selectedConfig].sort(sortByPosition);
                    }
                    if (!this._setupInputs && this._setup && db.inputs[this._selectedCalibration]) {
                        this._setupInputs = db.inputs[this._selectedCalibration].sort(sortByPosition);
                    }
                }
            }
        }
    }
}
