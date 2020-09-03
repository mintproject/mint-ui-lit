import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from '../../app/actions';
import { renderNotifications } from "../../util/ui_renders";
import { showNotification } from "../../util/ui_functions";
import { ExplorerStyles } from './model-explore/explorer-styles'

import './model-version-tree'

import { ModelCatalogModel } from './configure/resources/model';
import { ModelCatalogSoftwareVersion } from './configure/resources/software-version';
import { getLabel, getURL } from 'model-catalog/util';
import { SoftwareVersion, Model } from '@mintproject/modelcatalog_client';

import "weightless/progress-spinner";
import '../../components/loading-dots'

@customElement('models-edit')
export class ModelsEdit extends connect(store)(PageViewElement) {
    @property({type: Boolean})
    private _hideModels : boolean = false;

    @property({type: Boolean})
    private _editing : boolean = false;

    @property({type: Boolean})
    private _creating : boolean = false;

    @property({type: Object})
    private _model: Model;

    @property({type: Object})
    private _version: SoftwareVersion;

    private _iModel: ModelCatalogModel;
    private _iVersion: ModelCatalogSoftwareVersion;

    private _url : string = '';
    private _selectedModel : string = '';
    private _selectedVersion : string = '';

    public constructor () {
        super();
        this._iVersion = new ModelCatalogSoftwareVersion();
        this._iModel = new ModelCatalogModel();
    }

    static get styles() {
        return [ExplorerStyles,
            css `
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

            .custom-button {
                line-height: 20px;
                cursor: pointer;
                margin-right: 5px;
                border: 1px solid green;
                padding: 1px 3px;
                border-radius: 4px;
            }

            .custom-button:hover {
                background-color: rgb(224, 224, 224);
            }

            .title-prefix {
                font-size: 15px;
                font-weight: normal;
                color: rgb(153, 153, 153) !important;
            }
            `,
            SharedStyles
        ];
    }

    protected render() {
        return html`
        <div class="twocolumns">
            <div class="${this._hideModels ? 'left_closed' : 'left'}">
                <div class="clt">
                    <wl-title level="4" style="margin: 4px; padding: 10px 10px 0px 10px;">Models:</wl-title>
                    <model-version-tree active></model-version-tree>
                </div>
            </div>

            <div class="${this._hideModels ? 'right_full' : 'right'}">
                <div class="card2">
                    <wl-icon @click="${() => this._hideModels = !this._hideModels}"
                        class="actionIcon bigActionIcon" style="float:right">
                        ${!this._hideModels ? "fullscreen" : "fullscreen_exit"}
                    </wl-icon>
                    ${this._selectedModel && !this._creating ? html`
                    <span style="float:right;" class="custom-button" @click="${this._goToCatalog}">See in catalog</span>
                    `: ''}
                    <div class="cltrow_padded">
                        <div class="cltmain">
                            <wl-title level="3" style="margin: 0px; ${(this._model&&!this._version)? 'color:rgb(6, 108, 67);':''}">
                                ${this._creating ? html`<span class="title-prefix">
                                    CREATING NEW ${this._model? 'VERSION FOR' : 'MODEL' }
                                </span>` 
                                : (this._editing ? html`<span class="title-prefix">EDITING</span>`: '')}
                                ${this._version ? 
                                    html`<span class="title-prefix">VERSION:</span> ${ getLabel(this._version) }`
                                    : (this._model ? 
                                        html`<span class="title-prefix">MODEL:</span> ${ getLabel(this._model) }`
                                        : (this._creating ? '' : 'Select a model or software version on the left panel.'))
                                }
                            </wl-title>
                        </div>
                    </div>

                    <div style="padding: 0px 10px;">
                        ${!this._selectedVersion && (!this._selectedModel != !this._creating) ? this._iModel : ''}
                        ${this._selectedModel && (this._selectedVersion || this._creating) ? this._iVersion : ''}
                    </div>
                </div>
            </div>
        </div>
        ${renderNotifications()}
        `
    }

    private _goToCatalog () {
        let url = 'models/explore/' + getURL(this._model, this._version);
        /*        + this._selectedModel.split('/').pop();
        if (this._selectedVersion) {
            url += '/' + this._selectedVersion.split('/').pop() + '/';
        }*/
        goToPage(url)
    }

    stateChanged(state: RootState) {
        if (state.explorerUI) {
            let ui = state.explorerUI;
            // check whats changed
            let modelChanged : boolean = (ui.selectedModel !== this._selectedModel);
            let versionChanged : boolean = (modelChanged || ui.selectedVersion !== this._selectedVersion)

            let enableCreation : boolean = (ui.mode === 'new' && !this._creating);
            this._creating = (ui.mode === 'new');

            super.setRegionId(state);

            if (modelChanged) {
                this._selectedModel = ui.selectedModel;
                this._model = null;
                if (!this._selectedModel)
                    this._iModel.setResource(null);
            }
            if (versionChanged) {
                this._selectedVersion = ui.selectedVersion;
                this._version = null;
                if (!this._selectedVersion)
                    this._iVersion.setResource(null);
            }

            if (state.modelCatalog) {
                let db = state.modelCatalog;
                // Set selected resource
                if (!this._model && db.models && this._selectedModel && db.models[this._selectedModel]) {
                    this._model = db.models[this._selectedModel];
                    this._iModel.disableSingleResourceCreation();
                    this._iModel.setResource(this._model);
                }

                if (!this._version && db.versions && this._selectedVersion && db.versions[this._selectedVersion]) {
                    this._version = db.versions[this._selectedVersion];
                    this._iVersion.disableSingleResourceCreation();
                    this._iVersion.setResource(this._version);
                }
            }

            if (this._creating) {
                if (this._model) {
                    if (!this._iVersion.isCreating())
                        this._iVersion.enableSingleResourceCreation(this._model);
                } else {
                    if (!this._iModel.isCreating())
                        this._iModel.enableSingleResourceCreation();
                }
            }

        }
    }
}
