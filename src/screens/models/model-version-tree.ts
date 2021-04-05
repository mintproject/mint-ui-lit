import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { ExplorerStyles } from './model-explore/explorer-styles'
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from '../../app/actions';

import { IdMap } from 'app/reducers';
import { SoftwareVersion, Model, ModelCategory } from '@mintproject/modelcatalog_client';
import { getLabel, sortVersions, getURL} from 'model-catalog/util';

import "weightless/progress-spinner";
import 'components/loading-dots'

@customElement('model-version-tree')
export class ModelVersionTree extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _models : IdMap<Model> = {} as IdMap<Model>;

    @property({type: Object})
    private _versions : IdMap<SoftwareVersion> = {} as IdMap<SoftwareVersion>;

    @property({type: Object})
    private _visible : IdMap<boolean> = {};

    @property({type: String})
    private _selectedModel : string = '';

    @property({type: String})
    private _selectedVersion : string = '';

    @property({type: Boolean})
    private _creating : boolean = false;

    static get styles() {
        return [ExplorerStyles, SharedStyles, css`
            .tooltip:hover::after {
                width: 80px;
                left: -10px;
            }

            .inline-new-button {
                line-height: 1.2em;
                font-size: 1.2em;
                vertical-align: middle;
            }

            wl-icon {
                position: relative;
                top: 5px;
            }

            .inline-new-button > wl-icon {
                --icon-size: 1em;
                margin: 1px;
            }

            .config {
                color: rgb(6, 108, 67);
            }

            .setup {
                color: rgb(6, 67, 108);
            }

            ul {
                padding-left: 14px;
                font-size: 13px;
            }

            li {
                list-style-type: none;
                font-size: 13px;
            }

            li > a {
                cursor: pointer;
            }

            .ta-right {
                text-align: right;
            }

            li[selected] > span, li[selected] > a {
                font-weight: 900;
                font-size: 15px;
            }

            span {
                cursor: pointer;
            }
            
            span.tag {
                border: 1px solid;
                border-radius: 3px;
                padding: 0px 3px;
                font-weight: bold;
            }
            
            span.tag.deprecated {
                border-color: chocolate;
                background: chocolate;
                color: white;
            }
            
            span.tag.latest {
                border-color: forestgreen;
                background: forestgreen;
                color: white;
            }`
        ];
    }

    _select (model:Model, version?:SoftwareVersion) {
        goToPage("models/edit/" + getURL(model, version));
    }

    _selectNew (model?:Model) {
        goToPage("models/edit/" + getURL(model) + '/new');
    }

    protected render() {
        if (!this._models) 
            return html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`;

        let categoryModels = {};
        Object.values(this._models).forEach((m:Model) => {
            if (m.hasModelCategory && m.hasModelCategory.length > 0) {
                m.hasModelCategory.map(getLabel).forEach((category:string) => {
                    if (!categoryModels[category]) categoryModels[category] = [];
                    categoryModels[category].push(m);
                    if (this._selectedModel === m.id) this._visible[category] = true;
                });
            } else {
                let category : string = 'Uncategorized';
                if (!categoryModels[category]) categoryModels[category] = [];
                categoryModels[category].push(m);
                if (this._selectedModel === m.id) this._visible[category] = true;
            }
        });

        return html`
        <ul style="padding-left: 10px; margin-top: 4px;">
            ${Object.keys(categoryModels).map((category:string) => html`
            <li ?selected="${this._visible[category]}">
                <span @click="${() => {
                    this._visible[category] = !this._visible[category];
                    this.requestUpdate();
                }}">
                    <wl-icon>${this._visible[category] ? 'expand_more' : 'expand_less'}</wl-icon>
                    <span style="font-size: 15px;">
                        ${category}
                    </span>
                </span>
                ${this._visible[category] ? html`
                <ul>
            ${categoryModels[category]
                .map((model: Model) => html`
            <li ?selected="${this._selectedModel === model.id}">
                <span>
                    <wl-icon @click="${() => {
                        this._visible[model.id] = !this._visible[model.id];
                        this.requestUpdate();
                    }}">
                        ${this._visible[model.id] ? 'expand_more' : 'expand_less'}
                    </wl-icon>
                    <span @click="${() => {
                        this._select(model);
                    }}">
                        ${getLabel(model)}
                    </span>
                </span>
                ${this._visible[model.id] ? html`
                <ul>
                    ${(model.hasVersion||[])
                        .filter((v:any) => !!this._versions[v.id])
                        .map((v:any) => this._versions[v.id])
                        .sort(sortVersions)
                        .map((version : SoftwareVersion) => html`
                    <li ?selected="${this._selectedVersion === version.id}">
                        <span @click=${() => {
                             this._select(model, version);
                        }}>
                            ${this._renderTag(version['tag'])}
                            <span>
                                ${getLabel(version)}
                            </span>
                        </span>
                    </li>`)}
                    <li>
                        <a class="inline-new-button config" @click="${() => {this._selectNew(model)}}">
                            <wl-icon>add_circle_outline</wl-icon>
                            Add new version
                        </a>
                    </li>
                </ul>
                ` : ''}
            </li>
        `)}
                </ul>
                ` : ''}
            </li>
            `)}
        </ul>
        `;
    }


    private _renderTag (tag : string[]) {
        if (!tag || tag.length == 0)
            return '';
        if (tag[0] == "preferred") 
            return html`<span tip="Preferred" class="tooltip"><wl-icon style="width: 20px;">start</wl-icon></span>`;
        return html`<span class="tag ${tag[0]}">${tag[0]}</span>`;
    }

    stateChanged(state: RootState) {
        if (state.explorerUI) {
            let ui = state.explorerUI;
            // check whats changed
            let modelChanged : boolean = (ui.selectedModel !== this._selectedModel);
            let versionChanged : boolean = (modelChanged || ui.selectedVersion !== this._selectedVersion)
            this._creating = (ui.mode === 'new');

            if (modelChanged) {
                this._selectedModel = ui.selectedModel;
                this._visible[this._selectedModel] = true;
            }
            if (versionChanged) {
                this._selectedVersion = ui.selectedVersion;
                this._visible[this._selectedVersion] = true;
            }

            if (state.modelCatalog2) {
                let db = state.modelCatalog2;
                this._models = db.model;
                this._versions = db.softwareversion;
            }
        }
    }
}
