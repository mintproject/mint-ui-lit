import { html, property, customElement, css } from 'lit-element';

import { PageViewElement } from '../../../components/page-view-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../../../app/store';

import { FetchedModel, IODetail, VersionDetail, ConfigDetail, CalibrationDetail, CompIODetail,
         ExplanationDiagramDetail } from "./api-interfaces";
import { explorerFetchCompatibleSoftware, explorerFetchParameters, explorerFetchVersions, explorerFetchIO,
         explorerFetchIOVarsAndUnits, explorerFetchExplDiags, explorerFetchMetadata } from './actions';
import { explorerSetMode } from './ui-actions';
import { SharedStyles } from '../../../styles/shared-styles';
import { ExplorerStyles } from './explorer-styles'

import { goToPage } from '../../../app/actions';
import "weightless/expansion";
import "weightless/tab";
import "weightless/tab-group";
import "weightless/card";
import "weightless/icon";
import "weightless/textarea";
import "weightless/progress-spinner";
import "weightless/progress-bar";
import '../../../components/image-gallery'

@customElement('model-edit')
export class ModelEdit extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _model! : FetchedModel;
    _modelId: string = '';
    _versionId: string = '';
    _configId: string = '';

    @property({type: String})
    private _uri : string = "-";

    @property({type: Number})
    private _count : number = 0;

    @property({type: Object})
    private _modelMetadata: any = null;

    @property({type: Object})
    private _versionMetadata: any = null;

    @property({type: Object})
    private _configMetadata: any = null;

    @property({type: Object})
    private _calibrationMetadata: any = null;

    @property({type: Object})
    private _parameters: any = null;

    @property({type: Object})
    private _inputs : IODetail[] | null = null;

    @property({type: Object})
    private _outputs : IODetail[] | null = null;

    @property({type: Object}) //map IO_URI -> [Variables...]
    private _variables : any = {};

    private _IOStatus : Set<string> = new Set();
    private _allVersions : any = null;
    private _allModels : any = null;

    @property({type: Object})
    private _versions!: VersionDetail[];

    @property({type: Object})
    private _version : VersionDetail | null = null;

    @property({type: Object})
    private _config : ConfigDetail | null = null;

    @property({type: Object})
    private _calibration : CalibrationDetail | null = null;

    @property({type: Object})
    private _compInput : CompIODetail[] | null = null;
    
    @property({type: Object})
    private _compOutput : CompIODetail[] | null = null;

    @property({type: Object})
    private _compModels : FetchedModel[] | null = null;

    @property({type: Object})
    private _explDiagrams : ExplanationDiagramDetail[] | null = null;

    @property({type: String})
    private _tab : 'overview'|'io'|'variables'|'software' = 'overview';

    constructor () {
        super();
        this.active = true;
    }

    static get styles() {
        return [SharedStyles, ExplorerStyles,
            css `
                img {
                  vertical-align: middle;
                  max-width: calc(100% - 8px);
                  border: 1px solid black;
                }

                #logo-placeholder {
                    vertical-align: middle;
                    --icon-size: 200px;
                }

                .text-centered {
                  text-align: center;
                }

                .wrapper {
                    display:grid;
                    grid-gap:4px;
                    grid-template-columns: 1fr 1fr 1fr 1fr;
                    //border: 1px dotted red;
                }

                .col-img {
                    grid-column: 1 / 2;
                    grid-row: 1;
                    padding: 16px;
                }

                .col-img > img {
                    max-height: 200px;
                }

                .col-desc {
                    grid-column: 2 / 5;
                    grid-row: 1;
                }

                .col-desc > wl-select {
                    --input-border-width: 0px;
                }
                
                .row-main-edit {
                    grid-column: 1 / 5;
                    grid-row: 2;
                }
                
                .row-buttons {
                    grid-column: 1 / 5;
                    grid-row: 3;
                }
                
                .inline-info {
                    padding-top:4px;
                    padding-left:5px;
                }
                .inline-info > span {
                    display: inline-block;
                    width: 33%;
                }
                
                .hidden {
                    display: none;
                }
                
                #model-name-edit {
                    --input-font-size: 1.5625rem
                }

                #model-desc-edit {
                    --input-font-size: 14px;
                }
                
                #cancel-icon {
                    padding-top: 22px;
                    padding-bottom: 8px;
                    --icon-size: 1.5625rem;
                }`
        ];
    }

    _cancel () {
        store.dispatch(explorerSetMode('view')); 
    }

    protected render() {
        if (!this._model) return html``;
        return html`
            <div class="wrapper">
                <div class="col-img text-centered">
                    ${this._model.logo ? 
                    html`<img src="${this._model.logo}"/>`
                    : html`<wl-icon id="logo-placeholder">image</wl-icon>`}
                    <wl-button style="margin-top: 5px;"><wl-icon>add_photo_alternate</wl-icon> Add new logo</wl-button>
                </div>
                <div class="col-desc"style="text-align: justify;">
                    <wl-textfield id="model-name-edit" label="Model name" value="${this._model.label}"> </wl-textfield>
                    <wl-textarea id="model-desc-edit" label="Model description" value="${this._model.desc || ''}"> </wl-textarea>
                    <wl-textfield id="model-keywords-edit" label="Keywords" value="${this._model.keywords.join('; ') || ''}">
                    </wl-textfield>
                    <div class="inline-info">
                        <span><wl-select label="Category"><option selected>${this._model.categories || ''}</option></wl-select></span>
                        <span><wl-select label="Model type"><option selected>${this._model.type}</option></wl-select></span>
                        <span><wl-textfield label="Creation date" type="number" min="1990" max="2100" value="${this._model.dateC || ''}"></wl-textfield></span>
                    </div>
                </div>

                <div class="row-main-edit">
                    <fieldset>
                        <legend>Technical Information</legend>
                        <wl-textfield label="Operating systems" value="${this._model.os ? this._model.os.join(', ') : ''}"></wl-textfield>
                        <wl-textfield label="Memory requeriments" value="${this._model.memReq || ''}"></wl-textfield>
                        <wl-textfield label="Processor requeriments" value="${this._model.procReq || ''}"></wl-textfield>
                        <wl-textfield label="Software requeriments" value="${this._model.softwareReq || ''}"></wl-textfield>
                        <wl-textfield label="Web page" value="${this._model.web || ''}"></wl-textfield>
                        <wl-textfield label="Download URL" value="${this._model.downloadURL || ''}"></wl-textfield>
                        <wl-textfield label="Documentation URL" value="${this._model.doc || ''}"></wl-textfield>
                        <wl-textfield label="Installation instructions URL" value="${this._model.installInstr || ''}"></wl-textfield>
                    </fieldset>

                    <fieldset>
                        <legend>Publication Information</legend>
                        <wl-textfield label="Authors" value="${this._model.authors ? this._model.authors.join(', ') : ''}">
                            <wl-icon slot="after">add_box</wl-icon>
                        </wl-textfield>
                        <wl-textfield label="Funding source" value="${this._model.fundS || ''}">
                            <wl-icon slot="after">add_box</wl-icon>
                        </wl-textfield>
                        <wl-textfield label="Publisher" value="${this._model.publisher || ''}">
                            <wl-icon slot="after">add_box</wl-icon>
                        </wl-textfield>
                        <wl-textfield label="Publication date" value="${this._model.downloadURL || ''}"></wl-textfield>
                        <wl-textarea label="Preferred citation" value="${this._model.referenceP || ''}"></wl-textarea>
                    </fieldset>
                    <wl-textarea label="Assumptions" value="${this._model.assumptions?  this._model.assumptions.replace(/\. /g, '.\n') : ''}"></wl-textarea>
                </div>
                <div class="row-buttons">
                    <wl-button style="float: right;">Save</wl-button>
                    <wl-button style="float: right; margin-right: 6px;" @click="${this._cancel}">Cancel</wl-button>
                </div>
            </div>`
    }

    _renderLink (url) {
        let sp = url.split('/')
        return html`<a target="_blank" href="${url}">${sp[sp.length-1] || sp[sp.length-2]}</a>`
    }

    _renderGallery () {
        let items = [];
        if (this._model.sampleVisualization) {
            items.push({label: "Sample Visualization", src: this._model.sampleVisualization})
        }
        if (this._explDiagrams) {
            this._explDiagrams.forEach((ed) => {
                let newItem = {label: ed.label, src: ed.url, desc: ed.desc};
                if (ed.source) {
                    newItem.source = {label: ed.source.split('/').pop(), url: ed.source}
                }
                items.push(newItem);
            })
        }
        if (items.length > 0) {
            return html`<h3>Gallery:</h3>
                <image-gallery style="--width: 300px; --height: 160px;" .items="${items}"></image-gallery>`;
        } else {
            return html``;
        }
    }

    private _selectedModel = null;

    stateChanged(state: RootState) {
        if (state.explorerUI) {
            let ui = state.explorerUI;
            // check whats changed
            let modelChanged : boolean = (ui.selectedModel !== this._selectedModel);

            // Fetch & reset data
            if (modelChanged) {
                this._selectedModel = ui.selectedModel;

                this._model = null;
                this._explDiagrams = null;
                this._modelMetadata = null;
            }

            // Load data 
            if (state.explorer) {
                let db = state.explorer;
                if (!this._model && db.models) {
                    this._model = db.models[this._selectedModel];
                }
                if (!this._explDiagrams && db.explDiagrams) {
                    this._explDiagrams = db.explDiagrams[this._selectedModel];
                }

            }
        }
    }
}
