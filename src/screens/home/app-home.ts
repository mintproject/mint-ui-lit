
import { html, customElement, css, property } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { listTopRegions, calculateMapDetails } from '../regions/actions';
import { RegionList } from '../regions/reducers';
import { GOOGLE_API_KEY } from '../../config/google-api-key';

import "../../components/stats-blurb";
import "../../thirdparty/google-map/src/google-map";
import "../../components/google-map-json-layer";
import { selectTopRegion } from '../../app/ui-actions';

@customElement('app-home')
export class AppHome extends connect(store)(PageViewElement) {
  
    @property({type: Object})
    private _regions!: RegionList;

    @property({type: Object})
    private _midpoint: any

    private _mapStyles = '[{"stylers":[{"hue":"#00aaff"},{"saturation":-100},{"lightness":12},{"gamma":2.15}]},{"featureType":"landscape","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":57}]},{"featureType":"road","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"lightness":24},{"visibility":"on"}]},{"featureType":"road.highway","stylers":[{"weight":1}]},{"featureType":"transit","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"water","stylers":[{"color":"#206fff"},{"saturation":-35},{"lightness":50},{"visibility":"on"},{"weight":1.5}]}]';
    
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
            //height: calc(100% - 110px);
            height: calc(100% - 240px);
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
            MINT assists analysts to easily use sophisticated simulation models and data in order to explore the role of weather and climate in water on food availability in select regions of the world. For example, an analyst can use MINT to investigate the expected crop yields given different rainfall predictions through its effect on flooding and drought. MINT’s simulation models are quantitative and contain extensive subject matter knowledge.  For example, a hydrology model contains physical laws that describe how water moves through a river basin, and uses data about the elevation of the terrain and the soil types to determine how much water is absorbed in the ground and how the water flows over a land surface.  MINT provides assistance along the way to significantly reduce the time needed to develop new integrated models while ensuring their utility and accuracy
            </p>
            <p>
            Different analysts may have different expertise and run different types of models.  Each analyst is given a separate account in MINT, and their activities noted with their user name.  All analysts can see the same information in their interface, so when one completes a task all the results are accessible to all the analysts.  Analysts can communicate through the Messages Board on the top right.
            </p>
            <p>
            You can move through the steps above in order to: 1) select regions of interest and areas for modeling (river basins, administrative areas, etc), 2) browse the data available for those areas, 3) browse the models that have been customized for those areas, 4) use the models by setting up initial conditions (including interventions) and running them, and 5) preparing reports that summarize the analyses.
            </p>
            <wl-title level="4">Select a region by hovering over it and clicking.</wl-title>
        </div>
        
        ${this._regions && this._midpoint ?
          html`
          <google-map class="middle2main" api-key="${GOOGLE_API_KEY}" 
              latitude="${this._midpoint.latitude}" 
              longitude="${this._midpoint.longitude}" 
              zoom="${this._midpoint.zoom}" disable-default-ui="true" draggable="true"
              mapTypeId="terrain" styles="${this._mapStyles}">

              ${Object.keys(this._regions || {}).map((regionid) => {
                let region = this._regions![regionid];
                return html`
                  <google-map-json-layer .region_id="${region.id}" .region_name="${region.name}" json="${region.geojson_blob}" 
                    .selected="${region.id == this._regionid}"
                    @click=${(e: CustomEvent) => this.regionSelected(e.detail.id)}></google-map-json-layer>
                `;
              })}
          </google-map>
          `
          : ""
        }

      `
    }

    protected regionSelected(regionid: string) {
      store.dispatch(selectTopRegion(regionid));
    }

    /* This is done by mint-app now
    protected firstUpdated() {
      store.dispatch(listTopRegions());
    }*/

    // This is called every time something is updated in the store.
    stateChanged(state: RootState) {
        if(state.regions && state.regions.regions) {
            this._regions = state.regions.regions;
            //let rect = this.getBoundingClientRect();
            this._midpoint = calculateMapDetails(Object.values(this._regions), 800, 400);
        }
        super.setRegionId(state);
    }    
}
