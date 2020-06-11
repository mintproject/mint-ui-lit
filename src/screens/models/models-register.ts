import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';

import './configure/resources/person';
import './configure/resources/grid';

import { ModelCatalogPerson } from './configure/resources/person';
import { ModelCatalogGrid } from './configure/resources/grid';

import "weightless/title";
import "weightless/icon";
import "weightless/select";
import "weightless/textfield";

import { Textfield } from 'weightless/textfield';
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
    private _hideLateral : boolean = false;

    private _inputAuthor : ModelCatalogPerson;
    private _inputContributor : ModelCatalogPerson;
    private _inputContactPerson : ModelCatalogPerson;
    private _inputGrid : ModelCatalogGrid;

    public constructor () {
        super();
        this._inputAuthor = new ModelCatalogPerson();
        this._inputContributor = new ModelCatalogPerson();
        this._inputContactPerson = new ModelCatalogPerson();
        this._inputGrid = new ModelCatalogGrid();

        [this._inputAuthor, this._inputContributor, this._inputContactPerson]
                .forEach((input) => input.setActionMultiselect());
        this._inputGrid.setActionSelect();
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
                    <div style="height: 24px;">
                        <wl-icon @click="${() => this._hideLateral = !this._hideLateral}"
                            class="actionIcon bigActionIcon" style="float:right">
                            ${!this._hideLateral ? "fullscreen" : "fullscreen_exit"}
                        </wl-icon>
                    </div>
                    ${this._renderStepForm()}
                    <div class="footer">
                        <wl-button> continue </wl-button>
                    </div>
                </div>
            </div>
        </div>
        `
    }

    private _renderSteps () {
        return html`
            <wl-title level="4">
                Steps for creating a new model:
            </wl-title>
            <div class="step" active>
                <div>
                    <wl-title level="3"> Step 1: </wl-title>
                    <div>Describe your model</div>
                </div>
                <div>
                    <wl-icon>library_books</wl-icon>
                </div>
            </div>

            <div class="step" disabled>
                <div>
                    <wl-title level="3"> Step 2: </wl-title>
                    <div>Make your model discoverable</div>
                </div>
                <div>
                    <wl-icon>library_books</wl-icon>
                </div>
            </div>

            <div class="step" disabled>
                <div>
                    <wl-title level="3"> Step 3: </wl-title>
                    <div>Make your model executable</div>
                </div>
                <div>
                    <wl-icon>library_books</wl-icon>
                </div>
            </div>
        `;
    }

    private _renderStepForm () {
        return html`
            <wl-title level="2">Describe your model</wl-title>

            <table class="details-table">
                <colgroup width="150px">
                <tr>
                    <td colspan="2" style="padding: 5px 20px;">
                        <wl-textfield id="m-name" label="Model name" required></wl-textfield>
                    </td>
                </tr>

                <tr>
                    <td>Category:</td>
                    <td>
                        <wl-select id="m-category" name="Category" required>
                            <option value="">None</option>
                            <option value="Agriculture">Agriculture</option>
                            <option value="Hydrology">Hydrology</option>
                            <option value="Economy">Economy</option>
                            <option value="Weather">Weather</option>
                            <option value="Land Use">Land Use</option>
                        </wl-select>
                    </td>
                </tr>

                <tr>
                    <td>Sort description:</td>
                    <td>
                        <textarea id="m-short-desc" name="Short description" rows="3"></textarea>
                    </td>
                </tr>

                <tr>
                    <td>Full description:</td>
                    <td>
                        <textarea id="m-desc" name="Description" rows="5"></textarea>
                    </td>
                </tr>

                <tr>
                    <td>Sort description:</td>
                    <td>
                        <textarea id="m-short-desc" name="Short description" rows="3"></textarea>
                    </td>
                </tr>

                <tr>
                    <td>Example:</td>
                    <td>
                        <textarea id="m-example" name="Example" rows="4"></textarea>
                    </td>
                </tr>

                <tr>
                    <td>Keywords:</td>
                    <td>
                        <wl-textfield id="m-keywords" name="Keywords"/>
                    </td>
                </tr>

                <tr>
                    <td>License:</td>
                    <td>
                        <textarea id="m-license" name="License" rows="2"></textarea>
                    </td>
                </tr>

                <tr>
                    <td>Citation:</td>
                    <td>
                        <textarea id="m-citation" name="Citation" rows="2"></textarea>
                    </td>
                </tr>

                <tr>
                    <td>Website:</td>
                    <td>
                        <wl-textfield id="m-website" name="Website"></wl-textfield>
                    </td>
                </tr>

                <tr>
                    <td>Documentation page:</td>
                    <td>
                        <wl-textfield id="m-documentation" name="Documentation"></wl-textfield>
                    </td>
                </tr>

                <tr>
                    <td>Model creator:</td>
                    <td>
                        ${this._inputAuthor}
                    </td>
                </tr>

                <tr>
                    <td>Contributors:</td>
                    <td>
                        ${this._inputContributor}
                    </td>
                </tr>

                <tr>
                    <td>Contact person:</td>
                    <td>
                        ${this._inputContactPerson}
                    </td>
                </tr>

                <tr>
                    <td>Grid:</td>
                    <td>
                        ${this._inputGrid}
                    </td>
                </tr>
            </table>
        `;
    }

    private _shouldClear : boolean = false;
    stateChanged(state: RootState) {
        if (state.app) {
            if (state.app.subpage === 'register') {
                if (this._shouldClear) [this._inputAuthor, this._inputContributor, this._inputContactPerson, this._inputGrid]
                        .forEach((input) => input.setResources(null));
            } else {
                this._shouldClear = true;
            }
        } 
    }
}
