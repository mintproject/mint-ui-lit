import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { IdMap } from 'app/reducers';
import { goToPage } from 'app/actions';

import { dataTransformationsGet, dataTransformationGet, dataTransformationSetupsGet, dataTransformationPut,
         dataTransformationPost, dataTransformationDelete } from 'model-catalog/actions';
import { DataTransformation, DataTransformationFromJSON } from '@mintproject/modelcatalog_client';
import { getId, getLabel } from 'model-catalog/util';
import { PREFIX_URI } from 'model-catalog/actions';
import { renderExternalLink } from 'util/ui_renders';

import "components/loading-dots";
import "weightless/title";
import "weightless/icon";
import "weightless/select";
import "weightless/textfield";

import { Textarea } from 'weightless/textarea';

import { ModelCatalogSoftwareImage } from 'screens/models/configure/resources/software-image';
import { ModelCatalogParameter } from 'screens/models/configure/resources/parameter';
import { ModelCatalogDatasetSpecification } from 'screens/models/configure/resources/dataset-specification';
import { ModelCatalogDataTransformation } from 'screens/models/configure/resources/data-transformation';
import { ModelCatalogRegion } from 'screens/models/configure/resources/region';

@customElement('data-transformation-list')
export class DataTransformationList extends connect(store)(PageViewElement) {
    static get styles() {
        return [SharedStyles, css`
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
        `];
    }

    @property({type: Boolean})
    private _hideLateral : boolean = false;

    @property({type: Boolean})
    private _loadingAll : boolean = false;

    @property({type: Boolean})
    private _editing : boolean = false;

    @property({type: Object})
    private _dts : IdMap<DataTransformation> = {};

    @property({type: String})
    private _dtid : string = '';

    private _selectedDT : ModelCatalogDataTransformation;

    public constructor () {
        super();
        this._selectedDT = new ModelCatalogDataTransformation();
    }

    protected render() {
        return html`
        <div class="twocolumns">
            <div class="${this._hideLateral ? 'left_closed' : 'left'}">
                <div class="clt">
                    ${this._loadingAll ? 
                        html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`
                        : this._renderDTList()}
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
                    ${this._dtid ? this._selectedDT : html`
                    <div>
                        <wl-title level="3"> Data transformations </wl-title>
                        <p>
                            Select a data transformation from the list to display details.
                        </p>
                    </div>
                    `}
                </div>
            </div>
        </div>
        `
    }

    private _renderDTList () {
        return html`<ul> ${Object.values(this._dts).map((dt:DataTransformation) => html`
            <li>
                <a href="${this._regionid}/datasets/data-transformations/${getId(dt)}">${getLabel(dt)}</a>
            </li>`)}
        </ul>`
    }

    /*private _onDuplicateButtonClicked () {
        let dt = this._dts[this._dtid];
        let name = window.prompt("Enter the name of the new Data Transformation", getLabel(dt) + " copy");
        if (name) {
            let jsonObj = { ...dt };
            jsonObj.id = "";
            jsonObj.label = [name];
            store.dispatch(dataTransformationPost(DataTransformationFromJSON(jsonObj))).then((ndt) => {
                this._dts[ndt.id] = ndt;
                goToPage('datasets/data-transformations/' + getId(ndt));
            })
        }
    }*/

    protected firstUpdated () {
        this._loadingAll = true;
        store.dispatch(dataTransformationsGet()).then((dts) => {
            this._loadingAll = false;
            this._dts = { ... dts };
        });
        store.dispatch(dataTransformationSetupsGet()).then((dtss) => {
            //TODO
        });
    }

    stateChanged(state: RootState) {
        super.setRegionId(state);
        if (state.explorerUI) {
            let ui = state.explorerUI;
            let db = state.modelCatalog;
            let newEditState : boolean = (ui.mode === 'edit');
            if (newEditState != this._editing) {
                this._editing = newEditState;
                /* FIXME: change to edit depending on URL
                if (false && this._rendered) {
                    if (this._editing) this._setEditingInputs();
                    else this._unsetEditingInputs();
                }*/
            }
        }

        if (state.ui && state.ui.selected_datatransformationid) {
            let pdtid = PREFIX_URI + state.ui.selected_datatransformationid;
            if (this._dtid != pdtid) {
                this._dtid = pdtid;
                this._selectedDT.setResource(
                    this._dtid == "" ? null :
                    {id: this._dtid} as DataTransformation
                );
            }
        }
    }
}
