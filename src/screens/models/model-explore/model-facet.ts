
import { PageViewElement } from '../../../components/page-view-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../../../app/store';

import { html, property, customElement, css } from 'lit-element';

import { goToPage } from '../../../app/actions';

import { FetchedModel } from "./api-interfaces";
import { ExplorerStyles } from './explorer-styles'
import { explorerCompareModel } from './ui-actions'

@customElement('model-facet')
export class ModelFacet extends connect(store)(PageViewElement) {
    @property({type: String})
        uri : string = "";

    @property({type: String})
        altDesc : string = '';

    @property({type: String})
        altTitle : string = '';

    @property({type: Object})
    private _model! : FetchedModel;

    private _id : String = '';

    constructor () {
        super();
        this.active = true;
    }

    static get styles() {
        return [ExplorerStyles,
            css `
                :host {
                    display: block;
                }

                table {
                    margin-bottom: 1em;
                    table-layout: fixed;
                    border: 1px solid black;
                    width: 100%;
                    border-spacing: 0;
                    border-collapse: collapse;
                    height: 160px;
                    overflow: hidden;
                }

                td {
                    padding: 0px;
                    padding-top: 3px;
                    vertical-align: top;
                }

                td.left {
                    width: 25%;
                }

                td.right {
                    width: 75%;
                }

                td div {
                    overflow: hidden;  
                }

                td.left div:nth-child(1) { height: 1.2em; }
                td.left div:nth-child(2) { height: calc(150px - 3.6em); text-align: center;}
                td.left div:nth-child(3) { height: 2.4em; }

                td.right div:nth-child(1) { height: 1.3em; }
                td.right div:nth-child(2) { height: 96px; }
                td.right div:nth-child(3) { height: calc(44px - 1.3em); }

                .one-line {
                    height: 1.2em;
                    line-height: 1.2em;
                }

                .two-lines {
                    height: 2.4em;
                    line-height: 1.2em;
                }

                .header {
                    font-size: 1.2em;
                    line-height: 1.3em;
                    height: 1.3em;
                }

                .text-centered {
                    text-align: center;
                }
              

                img {
                    vertical-align: middle;
                    border: 1px solid black;
                    max-width: calc(100% - 8px);
                    max-height: calc(150px - 3.6em - 2px);
                }

                .helper {
                    display: inline-block;
                    height: 100%;
                    vertical-align: middle;
                }

                .title {
                    display: inline-block;
                    padding: 0px 10px 3px 10px;
                    width: calc(100% - 2.6em - 20px);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .title > a > wl-icon {
                    font-size: 1em;
                }

                .icon {
                    cursor: pointer;
                    display: inline-block;
                    overflow: hidden;
                    float: right;
                    font-size: 1em;
                    width: 1.4em;
                    margin-right: 7px;
                    margin-top: -5px;
                }

                .content {
                    padding: 5px 10px 0px 10px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    line-height: 16px;
                    max-height: 96px;

                    /* The number of lines to be displayed */
                    -webkit-line-clamp: 6;
                    -webkit-box-orient: vertical;
                }

                .content > code {
                    line-height: 19px;
                }
                
                .footer {
                    padding: 5px 10px 0px 10px;
                }

                .keywords {
                    display: inline-block;
                    width: calc(100% - 100px);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .details-button {
                    display: inline-block;
                    float: right;
                    color: rgb(15, 122, 207);
                    cursor: pointer;
                    font-weight: bold;
                }
            `
        ];
    }

    protected render() {
        if (this._model) {
        return html`
            <table>
              <tr>
                <td class="left"> 
                  <div class="text-centered one-line">
                    ${this._model.ver? html`${this._model.ver.length} version${this._model.ver.length>1?'s':''}`: html`No versions`}
                  </div>
                  <div>
                    <span class="helper"></span>${this._model.logo ? 
                        html`<img src="${this._model.logo}"/>`
                        : html`<img src="http://www.sclance.com/pngs/image-placeholder-png/image_placeholder_png_698412.png"/>`}
                  </div>
                  <div class="text-centered two-lines">
                    Category: ${this._model.categories? html`${this._model.categories[0]}` : html`-`}
                    <br/>
                    Type: ${this._model.type? html`${this._model.type}`: html`-`}
                  </div>
                </td>

                <td class="right">
                  <div class="header"> 
                    <span class="title">
                        ${this._model.label}
                        ${this._model.doc ? html`<a target="_blank" href="${this._model.doc}"><wl-icon>open_in_new</wl-icon></a>`: html``}
                    </span>
                    <span class="icon"><wl-icon @click="${()=>{this._compare(this._model.uri)}}">compare_arrows</wl-icon></span>
                  </div>
                  <div class="content" style="${this.altDesc? '' : 'text-align: justify;'}">
                    ${this.altDesc ? 
                        html`<b>${this.altTitle}</b> ${this.altDesc.split(';').map((v, i) => {
                            if (i===0) return html`<code>${v}</code>`;
                            else return html`, <code>${v}</code>`;
                        })}`: 
                        this._model.desc}
                  </div>
                  <div class="footer one-line">
                    <span class="keywords"> 
                        <b>Keywords:</b> 
                        ${this._model.keywords?  html`${this._model.keywords.join(', ')}` : html`No keywords`}
                    </span>
                    <span class="details-button"
                          @click="${()=>{goToPage('models/explore/' + this._id)}}"
                           > More details </span>
                  </div>
                </td>
              </tr>
            </table>
        `;
        } else {
            return html`Something when wrong!`
        }
    }

    _compare (uri:string) {
        store.dispatch(explorerCompareModel(uri));
    }

    firstUpdated() {
        let sp = this.uri.split('/');
        if (sp.length > 1) {
            this._id = sp[sp.length - 1];
        }
    }

    stateChanged(state: RootState) {
        if (state.explorer && state.explorer.models) {
            this._model = state.explorer.models[this.uri];
        }
    }
}
