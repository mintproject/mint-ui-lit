import { html, customElement, css, property } from "lit-element";
import { PageViewElement } from "../../components/page-view-element";

import { SharedStyles } from "../../styles/shared-styles";
import { store, RootState } from "../../app/store";
import { connect } from "pwa-helpers/connect-mixin";
import { Region } from "../regions/reducers";

import { showDialog, hideDialog } from "util/ui_functions";

import "../../components/stats-blurb";
import "../../thirdparty/google-map/src/google-map";
import "../../components/google-map-custom";
import { GoogleMapCustom } from "components/google-map-custom";
import { goToRegionPage } from "app/actions";
import { User } from "app/reducers";
import { mapStyles } from "styles/map-style";
import { MINT_PREFERENCES } from "config";

@customElement("app-home")
export class AppHome extends connect(store)(PageViewElement) {
  @property({ type: Array })
  private _regionids!: string[];

  @property({ type: Array })
  private _regions!: Region[];

  @property({ type: String })
  private _mainRegion: string = "";

  @property({ type: Boolean })
  private _mapReady: boolean = false;

  static get styles() {
    return [
      SharedStyles,
      css`
        .caption {
          font-size: 12px;
        }

        @media (min-width: 1920px) {
          .middle2main {
            height: 1550px;
          }
        }

        @media (min-width: 1680px) and (max-width: 1919px){
          .middle2main {
            height: 1320px;
          }
        }

        @media (min-width: 1200px) and (max-width: 1679px){
          .middle2main {
            height: 1140px;
          }
        }

        @media (min-width: 992px) and (max-width: 1199px){
          .middle2main {
            height: 960px;
          }
        }

        @media (min-width: 768px) and (max-width: 991px) {
          .middle2main {
            height: 720px;
          }
        }

        @media (min-width: 576px) and (max-width: 767px) {
          .middle2main {
            height: 540px;
          }
        }

        .middle2main {
          height: 500px;
        }

        .main-content {
          margin: 60px 0;
        }

        .main-content > p {
          margin-bottom: 5px;
        }

        .main-content > wl-title {
          font-size: 1.75rem;
          font-weight: 900;
          margin-bottom: 40px;
        }

        .concept-card > h4 {
          font-family: "Benton Sans Black";
        }
        
        .concept-card > hr {
          border-bottom: 0px;
          border-color: #484848;
        }

        .concept-grid {
          grid-template-columns: auto 420px;
        }

        @media (min-width: 768px) and (max-width: 991px) {
          .concept-grid {
            grid-template-columns: auto 380px
          }
        }

        @media (max-width: 767px) {
          .concept-grid {
            grid-template-columns: auto;
          }
        }
      `,
    ];
  }

  protected render() {
    //console.log("rendering");
    return html`
      <div class="content-page">
        <div class="main-content">
          <wl-title level="3">${MINT_PREFERENCES.welcome_message} </wl-title>
          <div class="concept-grid">
            <div>
              <p>
                <b>DYNAMO</b> helps analysts seamlessly use advanced simulation models and data to explore the impact of weather
                and climate on water and food availability in selected regions around the world. For instance, an analyst
                can use DYNAMO to assess expected crop yields under different rainfall scenarios, accounting for their
                effects on flooding and drought.
              </p>
              <p>
                <b>DYNAMO</b>'s simulation models are quantitative and embed deep subject-matter expertise. For example, a 
                hydrology model incorporates physical laws that govern how water moves through a river basin.
                It uses data on terrain elevation and soil types to estimate how much water is absorbed into the ground
                and how it flows across land surfaces.
              </p>
              <p>
                Throughout the process, <b>DYNAMO</b> offers guidance to reduce the time and effort needed to build integrated
                models—while maintaining both their accuracy and practical value.
              </p>
              <p>
                Recognizing that analysts bring different expertise and may work with diverse models, <b>DYNAMO</b> supports
                individual user accounts. Each analyst’s actions are tracked under their username, while all users share
                a unified interface. This means that when one analyst completes a task, the results are immediately
                accessible to the entire team.
              </p>
            </div>

            <div class="concept-card">
              <h4>Getting Started</h4>
              <hr></hr>
              <p>
                Start by selecting the main region on the map below. Then, use the top menu to:
                <ul>
                  <li>
                    Explore subregions and areas of interest for modeling, such as river basins, administrative areas, etc.
                  </li>
                  <li>
                    Browse models customized for the main region or any subregion.
                  </li>
                  <li>
                    Run models by setting up initial conditions and input data.
                  </li>
                  <li>
                    Prepare reports to summarize your analyses.
                  </li>
                </ul>
                The selected main region is always visible in the top right. Clicking on it allows you to change it.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="gray-section">
        <div class="content-page">
          <h4>Select a region by hovering over it and clicking.</h4>
          ${!this._mapReady
            ? html`<wl-progress-spinner class="loading"></wl-progress-spinner>`
            : ""}
          <google-map-custom
            class="middle2main"
            api-key="${MINT_PREFERENCES.google_maps_key}"
            .style="visibility: ${this._mapReady ? "visible" : "hidden"}"
            ?disable-default-ui=${true}
            draggable="true"
            @click=${(e: CustomEvent) => this.regionSelected(e.detail.id)}
            mapTypeId="terrain"
            .styles=${mapStyles}
          >
          </google-map-custom>
        </div>
      </div>
    `;
  }

  protected regionSelected(regionid: string) {
    if (regionid) {
      //store.dispatch(selectTopRegion(regionid));
      goToRegionPage(regionid, "home");
    }
  }

  private _addRegions() {
    let map = this.shadowRoot.querySelector(
      "google-map-custom"
    ) as GoogleMapCustom;
    if (map && this._regions) {
      let prefRegions = this._regions.filter(
        (region: Region) =>
          region.id === (this._regionid ? this._regionid : this._mainRegion)
      );
      try {
        map.setRegions(this._regions, this._regionid);
        if (prefRegions.length > 0) map.alignMapToRegions(prefRegions);
        this._mapReady = true;
      } catch {
        map.addEventListener("google-map-ready", (e) => {
          map.setRegions(this._regions, this._regionid);
          if (prefRegions.length > 0) map.alignMapToRegions(prefRegions);
          this._mapReady = true;
        });
      }
    }
  }

  protected firstUpdated() {
    this._addRegions();
  }

  // This is called every time something is updated in the store.
  stateChanged(state: RootState) {
    super.setRegionId(state);

    if (state.app && state.app.user && state.app.user.region) {
      let user: User = state.app.user;
      if (user.region != this._mainRegion) {
        if (!user.region) {
          this._mainRegion = "south_sudan";
        } else {
          this._mainRegion = user.region;
        }
        if (this._regions) this._addRegions();
      }
    }

    if (state.regions && state.regions.regions) {
      if (this._regionids != state.regions.top_region_ids) {
        this._regionids = state.regions.top_region_ids;
        this._regions = this._regionids.map(
          (regionid) => state.regions.regions[regionid]
        );
        this._addRegions();
      }
    }
  }
}
