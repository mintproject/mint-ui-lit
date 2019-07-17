
import { html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';

@customElement('app-home')
export class AppHome extends connect(store)(PageViewElement) {
  
    static get styles() {
      return [
        SharedStyles,
        css`
          .topstats {
            display: none;
            justify-content: space-between;
            background: #FFFFFF;
            width: calc(100% - 30px);
            margin: 15px;
          }
  
          .topstats stats-blurb {
            padding-right: 50px;
            padding-left: 20px;
            margin-top: 20px;
            margin-bottom: 20px;
            border-left: 1px solid #DDDDDD;
          }
  
          .topstats stats-blurb:first-child {
            border-left: 0px;
          }
  
          .caption {
            font-size: 12px;
          }
  
          .middle {
            background: #FFFFFF;
            width: 100%;
          }
          
        `
      ];
    }
  
    protected render() {
      //console.log("rendering");
      return html`
  
      <div class="card">
        <div class="topstats">
          <stats-blurb icon="terrain" text="Scenarios" value="8" change=3 color="#629b30"></stats-blurb>
          <stats-blurb icon="description" text="Datasets" value="2,554" change=20 color="#f1951b"></stats-blurb>
          <stats-blurb icon="extension" text="Models" value="123" change=-2 color="#42b7ff"></stats-blurb>
          <stats-blurb icon="settings" text="Runs" value="45" change=21 color="#06436c"></stats-blurb>
        </div>
  
        <div class="middle">
            <wl-title level="3">MINT Home Page</wl-title>
            <p>
                Information about MINT
            </p>
        </div>

      </div>
      `
    }
}
