import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';
import { CustomNotification } from 'components/notification';

import './configure/resources/person';
import './configure/resources/grid';
import './configure/resources/numerical-index';

import { ModelCatalogPerson } from './configure/resources/person';
import { ModelCatalogGrid } from './configure/resources/grid';
import { ModelCatalogFundingInformation } from './configure/resources/funding-information';
import { ModelCatalogVisualization } from './configure/resources/visualization';
import { ModelCatalogNumericalIndex } from './configure/resources/numerical-index';
import { ModelCatalogModel } from './configure/resources/model';

import { renderNotifications } from "util/ui_renders";
import { showNotification } from 'util/ui_functions';

import { Model, Person, ModelFromJSON, SoftwareVersion, SoftwareVersionFromJSON } from '@mintproject/modelcatalog_client';
import { getId, getLabel, getURL } from 'model-catalog/util';

import 'components/loading-dots'
import "weightless/title";
import "weightless/icon";
import "weightless/select";
import "weightless/textfield";

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('models-register')
export class ModelsRegister extends connect(store)(PageViewElement) {
    static get styles() {
        return [SharedStyles, css`
            .details-table {
                border-collapse: collapse;
                width: 100%;
            }

            .details-table tr td:first-child {
                font-weight: bold;
                padding-right: 6px;
                padding-left: 13px;
            }

            .details-table tr td:last-child {
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
                border-right: 1px solid #F0F0F0;
                overflow: auto;
                height: 100%;
                padding: 10px;
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

            .step {
                border: 2px solid darkgray;
                border-radius: 5px;
                padding: 5px 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 5px 0px;
            }

            .step[active] {
                background: rgba(127, 191, 63, 0.2);
            }

            .step[active]:hover {
                background: rgba(127, 191, 63, 0.3);
            }

            .step[disabled] {
                background: rgba(62, 62, 62, 0.3);
                cursor: not-allowed;
            }
        `];
    }

    @property({type: Boolean})
    private _hideLateral : boolean = true;

    @property({type: Boolean})
    private _waiting : boolean = false;

    @property({type: String})
    private _modelid : string = "";

    @property({type: Number})
    private _step : number = 0;

    @property({type: Object})
    private _model : Model;

    private _iModel : ModelCatalogModel;

    public constructor () {
        super();
        this._iModel = new ModelCatalogModel();
        this._iModel.enableSingleResourceCreation();
    }

    firstUpdated () {
        this.addEventListener('model-catalog-save', (e:Event) => {
            let detail : Model = e['detail'];
            this._iModel.enableSingleResourceCreation();
            if (detail.type && detail.type.indexOf("Model") >= 0)
                goToPage('models/explore/' + getURL(detail));
        })
        this.addEventListener('model-catalog-cancel', () => {
            this._iModel.enableSingleResourceCreation();
        });
    }

    protected render() {
        return html`
        <div class="twocolumns">
            <div class="${this._hideLateral ? 'left_closed' : 'left'}">
                <div class="clt">
                    ${this._renderSteps()}
                </div>
            </div>
            <div class="${this._hideLateral ? 'right_full' : 'right'}">
                <div class="card2">
                    <div style="height: 24px;" id="page-top">
                        <wl-icon @click="${() => this._hideLateral = !this._hideLateral}"
                            class="actionIcon bigActionIcon" style="float:right">
                            ${!this._hideLateral ? "fullscreen" : "fullscreen_exit"}
                        </wl-icon>
                    </div>
                    <wl-title level="4">
                        To register a new model, please fill the following form:
                    </wl-title>
                    ${this._iModel}
                </div>
            </div>
        </div>
        `
    }

    private _scrollUp () {
        let head = this.shadowRoot.getElementById('page-top');
        if (head) 
            head.scrollIntoView({behavior: "smooth", block: "start"})
    }

    private _renderSteps () {
        return html`
            <wl-title level="4">
                Steps for creating a new model:
            </wl-title>
            <div class="step" ?active="${this._step <= 1}" ?disabled="${this._step > 1}">
                <div>
                    <wl-title level="3"> Step 1: </wl-title>
                    <div>Describe your model</div>
                </div>
                <div>
                    <wl-icon>library_books</wl-icon>
                </div>
            </div>

            <div class="step" ?active="${this._step == 2}" ?disabled="${this._step < 2}">
                <div>
                    <wl-title level="3"> Step 2: </wl-title>
                    <div>Make your model discoverable</div>
                </div>
                <div>
                    <wl-icon>library_books</wl-icon>
                </div>
            </div>

            <div class="step" ?active="${this._step == 3}" ?disabled="${this._step < 3}">
                <div>
                    <wl-title level="3"> Step 3: </wl-title>
                    <div>Register a initial version</div>
                </div>
                <div>
                    <wl-icon>library_books</wl-icon>
                </div>
            </div>
        `;
    }

    private _here : boolean = false;
    stateChanged(state: RootState) {
        if (state.app) {
            if (!this._here && state.app.subpage === 'register') {
                this._iModel.scrollUp();
                this._iModel.clearForm();
            }
            this._here = state.app.subpage === 'register';
        } 
    }
}
