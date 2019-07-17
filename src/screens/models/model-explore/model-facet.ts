
// These are the shared styles needed by this element.
//import { SharedStyles } from '../components/shared-styles.js';

import { LitElement, html, property, customElement, css } from 'lit-element';

import { goToPage } from '../../../app/actions';
//import'fa-icons';

@customElement('model-facet')
export class ModelFacet extends LitElement {
    @property({type: String})
        name : string = "";

    @property({type: String})
        category : string = "";

    @property({type: String})
        id : string = "";

    static get styles() {
        return [
            css `
                :host {
                }

                table {
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
                td.left div:nth-child(2) { height: calc(150px - 3.6em); }
                td.left div:nth-child(3) { height: 2.4em; }

                td.right div:nth-child(1) { height: 1.3em; }
                td.right div:nth-child(2) { height: calc(150px - 2.5em); }
                td.right div:nth-child(3) { height: 1.2em; }

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
                    max-width: calc(100% - 8px);
                    border: 1px solid black;
                }

                .helper {
                    display: inline-block;
                    height: 100%;
                    vertical-align: middle;
                }

                .title {
                    display: inline-block;
                    padding: 0px 10px;
                    width: calc(100% - 2.6em - 20px);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .icon {
                    cursor: pointer;
                    display: inline-block;
                    background-color: red;
                    width: 1.3em;
                    overflow: hidden;
                    float: right;
                }

                .content {
                    padding: 0px 10px;
                    text-align: justify;
                }

                .keywords {
                    display: inline-block;
                    width: calc(100% - 120px);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    padding: 0px 10px;
                }

                .details-button {
                    display: inline-block;
                    float: right;
                    margin-right: 5px;
                    color: rgb(15, 122, 207);
                    cursor: pointer;
                    font-weight: bold;
                }
            `
        ];
    }

    protected render() {
        return html`
            <table>
              <tr>
                <td class="left">
                  <div class="text-centered one-line">2 vers, 2 configs</div>
                  <div>
                    <span class="helper"></span>
                    <img src="https://research.ifas.ufl.edu/media/researchifasufledu/images/sliders/GUA_DSSAT2.jpg"/>
                  </div>
                  <div class="text-centered two-lines">
                    Category: ${this.category}
                    <br/>
                    Type: NumericalModel
                  </div>
                </td>

                <td class="right">
                  <div class="header"> 
                    <span class="title"> ${this.name} </span>
                    <span class="icon">1</span>
                    <span class="icon">2</span>
                  </div>
                  <div class="content"> 
                    Software application program that comprises dynamic crop growth simulation models for over 40 crops. DSSAT is supported by a range of utilities and apps for weather, soil, genetic, crop management, and observational experimental data, and includes example data sets for all crop models.
                  </div>
                  <div class="footer one-line">
                    <span class="keywords"> <b>Keywords:</b> 
                        Agriculture, soil, crop, model, climate
                    </span>
                    <span class="details-button"
                          @click="${()=>{goToPage('models/' + this.id)}}"
                           > More details </span>
                  </div>
                </td>
              </tr>
            </table>
        `;
    }
}
