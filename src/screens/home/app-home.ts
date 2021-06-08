
import { html, customElement, css, property } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { listTopRegions, calculateMapDetails } from '../regions/actions';
import { Region, RegionMap } from '../regions/reducers';
import { GOOGLE_API_KEY } from '../../config/firebase';

import { showDialog, hideDialog } from 'util/ui_functions';

import "../../components/stats-blurb";
import "../../thirdparty/google-map/src/google-map";
import "../../components/google-map-custom";
import { selectTopRegion } from '../../app/ui-actions';
import { GoogleMapCustom } from 'components/google-map-custom';
import { goToPage, goToRegionPage } from 'app/actions';
import { User } from 'app/reducers';

@customElement('app-home')
export class AppHome extends connect(store)(PageViewElement) {
    @property({type: Array})
    private _regionids!: string[];

    @property({type: Object})
    private _regions!: Region[];

    @property({type: String})
    private _mainRegion : string = '';

    @property({type: Boolean})
    private _mapReady: boolean = false;

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
            height: calc(70%);
            min-height: 300px;
          }
          .middle > p {
            margin-bottom: 5px;
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
            As soon as you get started by selecting a region, a set of steps will appear at the top of the screen that will guide you to: 1) select areas of interest for modeling (river basins, administrative areas, etc), 2) browse the data available for those areas, 3) browse the models that have been customized for those areas, 4) use the models by setting up initial conditions (including interventions) and running them, and 5) preparing reports that summarize the analyses.
            </p>
            <ul>
              <li>
                <!--a target="_blank" href="https://drive.google.com/open?id=18cTLMwAzWh0BsWFho8411Utpg3YGm557"-->
                <a @click="${() => { showDialog("introductionDialog", this.shadowRoot) }}" style="cursor:pointer;">
                  <b>An introduction to MINT, training materials, a walkthrough video of the user interface, a glossary, and an FAQ are available here.</b>
                </a>
              </li>
              <li>
                <!--a target="_blank" href="http://bit.ly/MINT-status"-->
                <a target="_blank" href="https://mintproject.readthedocs.io/en/latest/modeling/" style="cursor:pointer;">
                  <b>An overview of the modeling capabilities in MINT is available here.</b>
                </a>
              </li>
              <li>
                <!--a target="_blank" href="http://bit.ly/MINT-indicators"-->
                <a target="_blank" href="https://mintproject.readthedocs.io/en/latest/indicators/" style="cursor:pointer;">
                  <b>An overview of the indicators generated by MINT models is available here.</b>
                </a>
              </li>
              <li>
                <!--a target="_blank" href="http://bit.ly/MINT-Interventions"-->
                <a target="_blank" href="https://mintproject.readthedocs.io/en/latest/interventions/" style="cursor:pointer;">
                  <b>An overview of the interventions that can be explored with MINT.</b>
                </a>
              </li>              
            </ul>
            <p>
                We recommend using Google Chrome browser to navigate this page.
            </p>
            <wl-title level="4">Select a region by hovering over it and clicking.</wl-title>
        </div>
        
        ${!this._mapReady ? html`<wl-progress-spinner class="loading"></wl-progress-spinner>` : ""}
        <google-map-custom class="middle2main" api-key="${GOOGLE_API_KEY}" 
            .style="visibility: ${this._mapReady ? 'visible': 'hidden'}"
            disable-default-ui="true" draggable="true"
            @click=${(e: CustomEvent) => this.regionSelected(e.detail.id)}
            mapTypeId="terrain" styles="${this._mapStyles}">
        </google-map-custom>

        ${this._renderIntroductionDialog()}
      `
    }

    protected regionSelected(regionid: string) {
      if(regionid) {
        //store.dispatch(selectTopRegion(regionid));
        goToRegionPage(regionid, "home");
      }
    }

    private _addRegions() {
      let map = this.shadowRoot.querySelector("google-map-custom") as GoogleMapCustom;
      if(map && this._regions) {
        let prefRegions = this._regions.filter((region:Region) => 
                region.id === (this._regionid ? this._regionid : this._mainRegion));
        try {
          map.setRegions(this._regions, this._regionid);
          if (prefRegions.length > 0) map.alignMapToRegions(prefRegions);
          this._mapReady = true;
        }
        catch {
          map.addEventListener("google-map-ready", (e) => {
            map.setRegions(this._regions, this._regionid);
            if (prefRegions.length > 0) map.alignMapToRegions(prefRegions);
            this._mapReady = true;
          })
        }
      }
    }

    protected firstUpdated() {
      this._addRegions();
    }

    _renderIntroductionDialog () {
        return html`
        <wl-dialog id="introductionDialog" fixed backdrop blockscrolling size="large" style="--dialog-height-l: 550px;">
            <wl-title slot="header" level="2">
                MINT Documentation and Training Materials
            </wl-title>
            <div slot="content">
                <wl-divider style="margin: 10px 0px;"></wl-divider>
                We recommend going through these documents in sequence:
                <ol>
                    <li><b>QuickStart User Guide:</b> gives a conceptual overview of MINT capabilities</li>
                    <li><b>Training Document:</b> introduces visually the main components of the MINT user interface</li>
                    <li><b>User Interface Walkthrough Video:</b> shows a demo of how to use the MINT user interface</li>
                    <li><b>User Interface Walkthrough Slides:</b>
                        illustrates where the steps and buttons are to do each step in the MINT User Interface</li>
                </ol>
                <wl-title level="3">QuickStart User Guide</wl-title>
                <p>
                    The MINT QuickStart User Guide that gives an introduction and overview of the capabilities 
                    of MINT is available 
                    <a target="_blank" href="https://mintproject.readthedocs.io/en/latest/#mint-quickstart-user-guide">
                        here</a>.
                    It includes a glossary and an FAQ.
                </p>
                <wl-title level="3">Step-by-Step Training Document</wl-title>
                <p>
                    The MINT Training Document that introduces visually the main components of the MINT user
                    interface is available 
                    <a target="_blank" href="https://drive.google.com/file/d/12nx2MkZuZUzKj2pP0ZRz8u3j7_vVfND2/view">here</a>.
                    It includes additional information and pointers in the last page.
                </p>
                <wl-title level="3">User Interface Walkthrough Slides</wl-title>
                <p>A slide deck with a detailed walkthrough of the MINT user interface is available 
                   <a target="_blank" href="https://drive.google.com/open?id=1F9rYnA-goWRhkAUsK0ujR3XWXYm4dt0C">here</a>.
                </p>
                <wl-title level="3">User Interface Walkthrough Video</wl-title>
                <p>A video with a walkthrough of the MINT user interface is available 
                   <a target="_blank" href="https://drive.google.com/file/d/1FENjOdCkbES_Cc8s74tKUrJSEvQXs1zv/view">here</a>.
                </p>
            </div>
            <div slot="footer">
            </div>
        </wl-dialog>`
    }

    // This is called every time something is updated in the store.
    stateChanged(state: RootState) {
        if (state.app && state.app.user) {
            let user : User = state.app.user;
            if (user.region != this._mainRegion) {
                if (!user.region) {
                    this._mainRegion = 'south_sudan';
                } else {
                    this._mainRegion = user.region;
                }
                if (this._regions) this._addRegions();
            }
        }

        if(state.regions && state.regions.regions) {
            if(this._regionids != state.regions.top_region_ids) {
              this._regionids = state.regions.top_region_ids;
              this._regions = this._regionids.map((regionid) => state.regions.regions[regionid]);
              this._addRegions();
            }
        }
        super.setRegionId(state);
    }
}
