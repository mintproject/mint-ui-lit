
import { html, customElement, css, property } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { listRegions } from '../regions/actions';
import { RegionList } from '../regions/reducers';
import { GOOGLE_API_KEY } from '../../config/google-api-key';

@customElement('app-home')
export class AppHome extends connect(store)(PageViewElement) {
  
    @property({type: Object})
    private _regions!: RegionList;

    @property({type:Array})
    private _mapStyles = '[{"featureType":"landscape","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"stylers":[{"hue":"#00aaff"},{"saturation":-100},{"gamma":2.15},{"lightness":12}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"visibility":"on"},{"lightness":24}]},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":57}]}]';
    
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

          .middle2main {
            height: calc(100% - 80px);
          }
          
        `
      ];
    }
  
    protected render() {
      //console.log("rendering");
      return html`
  
        <div class="topstats">
          <stats-blurb icon="terrain" text="Scenarios" value="8" change=3 color="#629b30"></stats-blurb>
          <stats-blurb icon="description" text="Datasets" value="2,554" change=20 color="#f1951b"></stats-blurb>
          <stats-blurb icon="extension" text="Models" value="123" change=-2 color="#42b7ff"></stats-blurb>
          <stats-blurb icon="settings" text="Runs" value="45" change=21 color="#06436c"></stats-blurb>
        </div>
  
        <div class="middle">
            <wl-title level="3">Welcome to MINT</wl-title>
            <p>
            Major societal and environmental challenges require forecasting how natural processes and human activities affect one another. 
            There are many areas of the globe where climate affects water resources and therefore food availability, with major economic 
            and social implications. Today, such analyses require significant effort to integrate highly heterogeneous models from 
            separate disciplines, including geosciences, agriculture, economics, and social sciences. 
            
            Model integration requires resolving semantic, spatio-temporal, and execution mismatches, which are largely done by hand today 
            and may take more than two years. The Model INTegration (MINT) project is developing a modeling environment to significantly 
            reduce the time needed to develop new integrated models while ensuring their utility and accuracy.
            </p>
        </div>
        <google-map class="middle2main" api-key="${GOOGLE_API_KEY}" 
            latitude="5" longitude="40" zoom="4" disable-default-ui
            styles="${this._mapStyles}">
            ${Object.keys(this._regions || {}).map((regionid) => {
            let region = this._regions![regionid];
            return html`
            <google-map-json-layer url="${region.geojson}"></google-map-json-layer>
            `;
            })}
        </google-map>        

      `
    }

    protected firstUpdated() {
      store.dispatch(listRegions());
    }

    // This is called every time something is updated in the store.
    stateChanged(state: RootState) {
        if(state.regions && state.regions.regions) {
            this._regions = state.regions.regions;
        }
    }    
}
