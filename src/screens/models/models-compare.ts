import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from '../../app/actions';
import { renderNotifications } from "../../util/ui_renders";
import { showNotification } from "../../util/ui_functions";
import { ExplorerStyles } from './model-explore/explorer-styles'

import './models-tree'

import { showDialog, hideDialog } from 'util/ui_functions';

import "weightless/progress-spinner";
import '../../components/loading-dots'

@customElement('models-compare')
export class ModelsCompare extends connect(store)(PageViewElement) {
    @property({type: Boolean})
    private _hideLateral : boolean = true;

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
            }`,
            SharedStyles
        ];
    }

    protected render() {
        return html`
        <div class="twocolumns">
            <div class="${this._hideLateral ? 'left_closed' : 'left'}">
                <div class="clt">
                    <wl-title level="4" style="margin: 4px; padding: 10px;">Models:</wl-title>
                    Search models here.
                </div>
            </div>

            <div class="${this._hideLateral ? 'right_full' : 'right'}">
                <div class="card2">
                    <wl-icon @click="${() => this._hideLateral = !this._hideLateral}"
                        class="actionIcon bigActionIcon" style="float:right">
                        ${!this._hideLateral ? "fullscreen" : "fullscreen_exit"}
                    </wl-icon>
                    CONTENT
                </div>
            </div>
        </div>
        `
    }

    stateChanged(state: RootState) {
        if (state.explorerUI) {
        }
    }
}
