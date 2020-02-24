
import { html, customElement, css, property } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { listTopRegions, calculateMapDetails } from '../regions/actions';
import { Region, RegionMap } from '../regions/reducers';
import { GOOGLE_API_KEY } from '../../config/google-api-key';

import { showDialog, hideDialog } from 'util/ui_functions';

import "../../components/stats-blurb";
import "../../thirdparty/google-map/src/google-map";
import "../../components/google-map-custom";
import { selectTopRegion } from '../../app/ui-actions';
import { GoogleMapCustom } from 'components/google-map-custom';
import { BASE_HREF, goToPage, goToRegionPage } from 'app/actions';

@customElement('app-home')
export class AppHome extends connect(store)(PageViewElement) {
    @property({type: Array})
    private _regionids!: string[];

    @property({type: Object})
    private _regions!: Region[];

    @property({type: String})
    private _preferredRegion : string = '';

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
            /*height: calc(100% - 110px);*/
            height: calc(100% - 240px);
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
                <a @click="${() => { showDialog("modelOverview", this.shadowRoot) }}" style="cursor:pointer;">
                  <b>An overview of the modeling capabilities in MINT is available here.</b>
                </a>
              </li>
              <li>
                <!--a target="_blank" href="http://bit.ly/MINT-indicators"-->
                <a @click="${() => { showDialog("indicatorsOverview", this.shadowRoot) }}" style="cursor:pointer;">
                  <b>An overview of the indicators generated by MINT models is available here.</b>
                </a>
              </li>
              <li>
                <!--a target="_blank" href="http://bit.ly/MINT-Interventions"-->
                <a @click="${() => { showDialog("intervetionsOverview", this.shadowRoot) }}" style="cursor:pointer;">
                  <b>An overview of the interventions that can be explored with MINT.</b>
                </a>
              </li>              
            </ul>
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
        ${this._renderModelingOverview()}
        ${this._renderIndicatorsOverview()}
        ${this._renderInterventionsOverview()}
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
        let prefRegions = this._regions.filter((region:Region) => region.id === this._preferredRegion);
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
                    of MINT is available <a>here</a>. It includes a glossary and an FAQ.
                </p>
                <wl-title level="3">Step-by-Step Training Document</wl-title>
                <p>
                    The MINT Training Document that introduces visually the main components of the MINT user
                    interface is available <a>here</a>. It includes additional information and pointers in the last page.
                </p>
                <wl-title level="3">User Interface Walkthrough Slides</wl-title>
                <p>A slide deck with a detailed walkthrough of the MINT user interface is available <a>here</a>.</p>
                <wl-title level="3">User Interface Walkthrough Video</wl-title>
                <p>A video with a walkthrough of the MINT user interface is available <a>here</a>.</p>
            </div>
            <div slot="footer">
            </div>
        </wl-dialog>`
    }

    _renderModelingOverview () {
        return html`
        <wl-dialog id="modelOverview" fixed backdrop blockscrolling size="large" style="--dialog-height-l: 550px;">
            <wl-title slot="header" level="2">
                MINT Modeling Status
            </wl-title>
            <div slot="content">
                <wl-divider style="margin: 10px 0px;"></wl-divider>
                <wl-title level="3">South Sudan</wl-title>
                <wl-title level="4">Backcasting</wl-title>
                <p><b>Regions:</b>
                    Focus on Pongo region (other regions by first approximation based on Pongo)
                </p>
                <p><b>Time period supported:</b> any period between 2000-2017</p>
                <p><b>Agriculture modeling for potential crop production (Cycles model):</b>
                <ul>
                    <li>Model is manually tuned for agriculture areas within Pongo region</li>
                    <li>For other regions in South Sudan, the model can be tuned by hand and used</li>
                </ul>
                <p><b>Economic modeling for crop production (EACS model):</b>
                <ul>
                    <li>Model is calibrated for areas within the Pongo region</li>
                    <li>For other regions of South Sudan, the Pongo calibration of the model could
                        be used as a first approximation</li>
                </ul>
                </p>
                <p><b>Hydrology modeling for flooding (PIHM model):</b>
                <ul>
                    <li>Only available as an emulator, for Pongo region only</li>
                </ul>
                </p>

                <wl-title level="4">Forecasting</wl-title>
                <p><b>Regions:</b>
                    Focus on Pongo region (other regions by first approximation based on Pongo)
                </p>
                <p><b>Time period supported:</b>
                    2018 (weather forecasting available for different percentiles).
                    Forecasting is based on historical precipitation within Pongo Basin.
                    A primer on forecasting in MINT is available 
                    <a target="_blank" 
                       href="https://drive.google.com/file/d/1FtgmknPZdTKyKauC3VPPiI7ZIfkPYAM8/view">here</a>.
                </p>
                <p><b>Agriculture modeling for crop yield (Cycles model):</b>
                <ul>
                    <li>Model is manually tuned for agriculture areas within Pongo region</li>
                    <li>For other regions in South Sudan, the model can be tuned by hand and used</li>
                </ul>
                </p>
                <p><b>Economic modeling for crop production (EACS model):</b>
                <ul>
                    <li>Model is calibrated for areas within the Pongo region</li>
                    <li>For other regions of South Sudan, the Pongo calibration of the model could be used 
                        as a first approximation</li>
                </ul>
                </p>
                <p><b>Hydrology modeling:</b> Not available for forecasting.</p>

                <wl-title level="3">Ethiopia</wl-title>
                <wl-title level="4">Backcasting</wl-title>
                <p><b>Regions:</b>
                    Focus on Gambella region and Baro river (other regions by first approximation)
                </p>
                <p><b>Time period supported:</b> any period between 2000-2017</p>
                <p><b>Agriculture modeling for crop yield (Cycles model):</b>
                <ul>
                    <li>Model is tuned for agriculture areas within the Gambella region</li>
                    <li>For other regions in Ethiopia, the model can be calibrated by hand and used</li>
                </ul>
                <p><b>Economic modeling for crop production (EACS model):</b>
                <ul>
                    <li>Model is calibrated for areas within the Gambella region</li>
                    <li>For other regions of Ethiopia,
                        the Gambella calibration of the model could be used as a first approximation</li>
                </ul>
                </p>
                <p><b>Hydrology modeling for river discharge/flooding (PIHM model):</b>
                <ul>
                    <li>Model is available for Baro region only</li>
                </ul>
                </p>

                <wl-title level="4">Forecasting</wl-title>
                <p><b>Regions:</b>
                    Focus on Gambella region and Baro river (other regions by first approximation)
                </p>
                <p><b>Time period supported:</b>
                    Time period supported: 2018 (weather forecasting available for different percentiles).
                    Forecasting is based on historical precipitation within Baro Basin. 
                    A primer on forecasting in MINT is available
                    <a target="_blank" 
                       href="https://drive.google.com/file/d/1FtgmknPZdTKyKauC3VPPiI7ZIfkPYAM8/view">here</a>.
                </p>
                <p><b>Agriculture modeling for crop yield (Cycles model):</b>
                <ul>
                    <li>Model is manually tuned for agriculture areas within the Gambella region</li>
                    <li>For other regions in Ethiopia, the model can be calibrated by hand and used</li>
                </ul>
                </p>
                <p><b>Economic modeling for crop production (EACS model):</b>
                <ul>
                    <li>Model is calibrated for areas within the Gambella region</li>
                    <li>For other regions of Ethiopia, the Gambella calibration of the model could be
                        used as a first approximation</li>
                </ul>
                </p>
                <p><b>Hydrology modeling for river discharge/flooding (TopoFlow model):</b>
                    <ul><li>Model is available for Baro region only</li></ul>
                </p>
            </div>
            <div slot="footer">
            </div>
        </wl-dialog>`
    }

    _renderIndicatorsOverview () {
        return html`
        <wl-dialog id="indicatorsOverview" fixed backdrop blockscrolling size="large" style="--dialog-height-l: 600px;">
            <wl-title slot="header" level="2">
                An Overview of Indicators Generated by MINT
            </wl-title>
            <div slot="content">
                <wl-divider style="margin: 10px 0px;"></wl-divider>
                <p>
                    The rest of this document gives an overview of the indicators for each subject,
                    and their importance for the region.
                </p>
                <wl-title level="3">Agriculture Indicators</wl-title>

                <p>
                    The <b>Potential Crop Production</b> is generated using the Cycles model,
                    which reports outputs for maize, sorghum, sesame and peanuts for all of South Sudan.
                    The focus of these simulations is the first growing season (planting March through May),
                    which leads to the late June through August harvest.
                    The crop yields and other variables reported, correspond spatially to a climate grid (4 x 4 km)
                    covering all of South Sudan.
                    At each grid point we simulated a full combinatorial matrix of 7 planting dates (from early to late planting),
                    5 nitrogen fertilization rates and 3 weed pressure levels.
                    That provides a full range of potential situations that should encompass production conditions.
                    We provide the model outputs, which are admittedly overwhelming and we are working on visualizations to facilitate understanding.
                </p>

                <p>
                    The <b>Seasonal Crop Production Index</b> also generated using the Cycles model, provides a fast
                    and robust way of reporting normalized yields for a given grid point or region. The goal of the
                    index is to easily segment “years” or “seasons” that can be problematic for food production, and
                    to provide an intuitive sense of the magnitude of the problem. While the raw yield outputs might
                    be difficult to interpret for the non-expert, the index is more transparent. It is based on the ratio
                    of the yield of a given combination of planting date, fertilization and weed pressure to the
                    median yield under such conditions across years. An <b>index = 1</b> means that the year resembles
                    the median years, and it is assumed that it represents a neutral condition (neither local excess
                    or shortage of food supply). An <b>index &gt; 1</b> means that the local food supply may exceed the
                    median, and the larger the number the better off the location. The caveat here is that flooding
                    damage might be underestimated. As we refine our simulations this limitation will be lifted. An
                    <b>index &lt; 1</b> means a situation worse than normal, and the lower the value the worse the situation.
                    It is safe to assume that this is a reliable indicator of local food shortage. We are working on
                    visualizations that map this index, to give an analyst a sense of the geographical variation of the
                    index. The figure below shows a summary for this index for maize for one grid point in the
                    Pongo Basin.
                </p>

                <p>
                    What additional information can complement this raw index? It would be important to have an
                    indicator of both the technology level of a given system and the dependence of a region on the
                    season’s harvest. The higher the technology and the lesser the dependence, the lesser the risk
                    of an index below 1, and conversely, the closer to technology to low-input subsistence
                    agriculture and the higher the dependence on local food supply the more severe the risk.
                    In other words, the index may draw the eyes quickly to the areas at risk (index &lt; 1),
                    but context is needed for a more granular interpretation.
                </p>

                <p>
                    Figure 1 shows the Variation of the Seasonal Crop Production Index for maize for one agricultural
                    grid point in the Pongo Basin. The nitrogen rates represent from low to high fertilization 
                    (for the agronomy minded, 78 to 1250 kg/ha of raw fertilizer with 32% nitrogen).
                    The 0.4 in the legend indicates the weed pressure (medium).
                    The planting dates are not shown here, but an analyst can easily explore their impact by expanding
                    the data selection. Clearly, years 2011, 2016 and 2017 in particular were problematic.
                </p>

                <div style="width: 80%; margin: 0 auto; display: block; text-align: center;">
                    <img style="width:100%;" src="images/indicators/3_1_avg_prod_index.png"/>
                    <div style="margin-bottom: 1em;"><b>Figure 1.</b>
                        Variation of the Seasonal Crop Production Index for maize for one agricultural grid point in
                        the Pongo Basin.
                    </div>
                </div>

                <p>
                    <b>Crop Production</p> is estimated using an economic model of decisions by agricultural
                    households about the use of inputs (e.g., land and fertilizer) to produce a set of crops
                    currently grown in the study region.
                    The economic model consists of a numerical simulation of a non-linear constrained optimization
                    problem that is calibrated to reflect observed decision-making in the study region.
                    The calibration approach uses Positive Mathematical Programming (PMP), which ensures that the
                    simulation model reflects unobserved constraints (e.g., access to credit, labor availability,
                    crop rotation practices) that affect decisions about agricultural production.
                    By varying related parameters (prices, land/fertilizer cost) one at a time between -50 and 50
                    (increment by 10) for each crop (cassava,  sorghum, maize, groundnuts, and sesame) within MINT,
                    simulated crop production results are generated to predict how farmers react to potential
                    economic condition changes.
                </p>

                <p>
                    The model is aggregate and represents decision-making by all agricultural households in the study region.
                    The model predicts agricultural production, taking into account the behavioral response of
                    farming households to changes in environmental, economic, and policy drivers.
                    Output variables include the total amount of land in agricultural production,
                    the amount of land and fertilizer used per unit area in the cultivation of each of the region’s crops,
                    average crop yields, and net revenues earned in agricultural production.
                    For the Pongo Basin in South Sudan, the model generates these output variables for maize, cassava,
                    sorghum, groundnuts, and sesame seed crops.
                </p>

                <wl-title level="3">Agriculture Indicators</wl-title>
                <p>
                    We use the PIHM and TopoFlow models to generate hydrology indicators.
                    These models require a large number of spatially-distributed input variables that describe various
                    properties of the topography (e.g. elevation, slope, flow direction, total contributing area),
                    the meteorology (rainfall rate, relative humidity, air temperature, surface temperature, etc.)
                    and the soil (including many intrinsic and hydraulic properties).
                    The models also require information about the bankfull widths, depths and bed roughness of all
                    the channels within the river networks themselves, which are parameterized with empirical formulas.
                </p>

                <p>
                    <b>Geospatial Flood Exceedance index</b> are generated using the PIHM hydrological model.
                    PIHM uses results from a large number of runs over time to compute statistical indexes that
                    characterize the likelihood and potential magnitude of flooding at individual locations in a
                    region (i.e. for every model grid cell).
                    In this case the inundation or flooding potential is determined for 2017 as the simulated average
                    depth of water over a given month with higher values indicating a greater likelihood of flooding.
                    In the long term this index will be based on the full historical record allowing a probabilistic
                    measure of flooding.
                </p>

                <p>
                    We are focused on modeling the hydrologic response to individual storms.
                    This means computing geospatial grids that vary in time (like a movie), for the channel depths,
                    flood depths, velocities and discharges of rivers.  This type of output shows the areas where
                    flooding occurs, as well as how long before the flooding subsides and many other related aspects 
                    of river response to given storms or droughts.
                    We provide raw model output, as well as the data we used for the visualization below.
                </p>

                <p>
                    Figure 2 shows this index for the Lol-Kuru rivers with the outlet defined at the location just
                    upstream of where the Pongo river enters the Lol.
                    The visualization shows the parts of the basin where the model points to areas that are most
                    likely candidates for flooding, crop disruption and potential migration.
                    Higher values have a higher likelihood of flooding.
                    In this example the sample size is too small to be reliable but future analyses will use several
                    decades of simulation results to improve the reliability of the results including ensemble simulations.
                </p>

                <div style="width: 80%; margin: 0 auto; display: block; text-align: center;">
                    <img style="width:100%;" src="images/indicators/3_2_flood_exc_lol_kuru.png"/>
                    <div style="margin-bottom: 1em;"><b>Figure 2.</b>
                        Snapshots of the Geospatial Flood Exceedance index for Lol-Kuru (Pongo) region show that 
                        different areas are affected over time.  A movie is available in the MINT indicators spreadsheet.
                    </div>
                </div>

                <p>
                    The <b>Streamflow - Duration Index (SDI)</b>, also called a flow-duration-curve (FDC),
                    represents the relationship between the magnitude and frequency of daily streamflow for
                    a particular river basin, and provides an estimate of the percentage of time a given 
                    streamflow was equaled or exceeded over the historical record of the data.
                    An SDI provides a simple, yet comprehensive, graphical view of the overall historical
                    variability associated with streamflow in a river basin.
                    SDI is the complement of the cumulative distribution function (CDF) of daily streamflow.
                    Each value of discharge Q has a corresponding exceedance probability, and an SDI is simply
                    a plot Qpversus the pthquantile or percentile of daily streamflow versus exceedance 
                    probability p = 1-Prob[Q&lt;= Qp]. 
                </p>

                <p>
                    The SDI was computed for the simulated Lol-Kuru rivers with the outlet defined at the location just
                    upstream of where the Pongo river enters the Lol. The simulation was for 2001-2017 daily climate data.
                    The model was manually calibrated and inputs and outputs of the simulation can be found in the table. 
                </p>
 
                <p>
                    Figure 3 below is the simulated runoff at the basin outlet and Figure 4 is the SDI for the basin.
                    The daily streamflow record mirrors the seasonality of rainfall, although the peak or maximum annual
                    daily flows show extreme fluctuations in both  magnitude and frequency of occurrence.
                    The impact of frequency-magnitude variability on food security is that droughts and floods tend to
                    occur in clusters with memory or duration lasting several years.
                    In addition the question of non-stationarity or time varying statistics may have to be addressed
                    in future analyses. 
                </p>

                <div style="width: 80%; margin: 0 auto; display: block; text-align: center;">
                    <img style="width:100%;" src="images/indicators/3_3_streamflow.png"/>
                    <div style="margin-bottom: 1em;"><b>Figure 3.</b>
                        The 2001-2017 daily streamflow in the Lol-Kuru catchment (Pongo), used to compute the SDI indicator
                    </div>
                </div>

                <div style="width: 80%; margin: 0 auto; display: block; text-align: center;">
                    <img style="width:100%;" src="images/indicators/3_4_sdi.png"/>
                    <div style="margin-bottom: 1em;"><b>Figure 4.</b>
                        The Streamflow duration index (SDI) for the Lol-Kuru catchment (Pongo).
                        The SDI represents the magnitude-frequency for historical daily streamflow.
                        Annual average flows less than the median (0.5 Exceedance) represent likely drought conditions
                        while annual average flow greater than .001 exceedance frequency are likely associated with flooding conditions.
                    </div>
                </div>
                
                <p>
                    We report the <b>River Discharge</b> and <b>River Flood Depth</b> computed with the TopoFlow hydrologic model
                    for the Baro River basin draining to the town of Gambela, Ethiopia.
                    The spatial extent of the basin in shown in Figure 5.
                </p>

                <div style="width: 80%; margin: 0 auto; display: block; text-align: center;">
                    <img style="width:100%;" src="images/indicators/3_4_shaded_relief.png"/>
                    <div style="margin-bottom: 1em;"><b>Figure 5.</b>
                        Shaded relief image for the Baro River basin draining to the town of Gambela,
                        Ethiopia, with overlaid basin boundary and extracted channel network.
                        The spatial extent of this image matches that of the 2 movies for River Discharge
                        and River Flood Depth, with links in the spreadsheet, computed with the TopoFlow hydrologic model.
                    </div>
                </div>
            </div>
            <div slot="footer">
            </div>
        </wl-dialog>`
    }

    _renderInterventionsOverview() {
        return html`
        <wl-dialog id="intervetionsOverview" fixed backdrop blockscrolling size="large" style="--dialog-height-l: 550px;">
            <wl-title slot="header" level="2">
                Overview of Interventions Currently Supported in MINT
            </wl-title>
            <div slot="content">
                <wl-divider style="margin: 10px 0px;"></wl-divider>
                <p>
                    Interventions in MINT reflect human actions that can change the course of a system’s behavior.
                    Currently, the models in MINT supports an analyst to explore three kinds of interventions: fertilizer
                    subsidies, planting windows, and weed control methods.
                </p>

                <p>
                    In MINT, an intervention is linked to an adjustable parameter of a model.
                    The table below summarizes the interventions that MINT currently supports.
                </p>

<style type="text/css">
.tg  {border-collapse:collapse;border-spacing:0;}
.tg td{font-family:Arial, sans-serif;font-size:14px;padding:10px 5px;border-style:solid;border-width:1px;overflow:hidden;word-break:normal;border-color:black;}
.tg th{font-family:Arial, sans-serif;font-size:14px;font-weight:normal;padding:10px 5px;border-style:solid;border-width:1px;overflow:hidden;word-break:normal;border-color:black;}
.tg .tg-cly1{text-align:left;vertical-align:middle}
.tg .tg-juju{font-family:"Courier New", Courier, monospace !important;;text-align:left;vertical-align:top}
.tg .tg-sn55{font-weight:bold;font-style:italic;text-align:left;vertical-align:middle}
.tg .tg-6t3r{font-weight:bold;font-style:italic;text-align:left;vertical-align:top}
.tg .tg-0lax{text-align:left;vertical-align:top}
</style>
<table class="tg">
  <tr>
    <th class="tg-sn55">Intervention</th>
    <th class="tg-sn55">Description</th>
    <th class="tg-6t3r">Model</th>
    <th class="tg-6t3r">Adjustable Parameter(s)</th>
  </tr>
  <tr>
    <td class="tg-cly1">Fertilizer subsidies</td>
    <td class="tg-cly1">Interventions concerning fertilizer<br>subsidies can be expressed in this model<br>as a percentage of fertilizer prices</td>
    <td class="tg-0lax">EACS</td>
    <td class="tg-juju">sesame-fertilizer-cost-adjustment,<br>cassava-fertilizer-cost-adjustment,<br>maize-fertilizer-cost-adjustment,<br>sorghum-fertilizer-cost-adjustment,<br>groundnuts-fertilizer-cost-adjustment</td>
  </tr>
  <tr>
    <td class="tg-0lax">Planting windows</td>
    <td class="tg-0lax">Interventions that force specific target<br>planting windows can be expressed in<br>this model as start and end planting<br>dates</td>
    <td class="tg-0lax">Cycles</td>
    <td class="tg-juju">start-planting-day, end-planting-day</td>
  </tr>
  <tr>
    <td class="tg-0lax">Weed control</td>
    <td class="tg-0lax">Interventions concerning weed control<br>and weed management practices can be<br>reflected in this model by indicating the<br>fraction of weeds that will remain after<br>the weed treatments applied by farmers</td>
    <td class="tg-0lax">Cycles</td>
    <td class="tg-juju">weed-fraction</td>
  </tr>
</table>
                <p>There are two specific places in the MINT user interface where interventions can be seen:
                    <ul>
                        <li>The MINT Model Catalog. There is documentation about interventions under the Parameters
                        and Inputs tab. The parameters table has a column called “Relevant Interventions”, and
                        hovering over the intervention shows its description.</li>
                        <li>The Modeling Task Editor. When an adjustable variable is chosen that has an associated
                        intervention there is a description of the intervention shown.</li>
                        <li>The Setup step in the Use Models tab. When the adjustable parameters are edited, the
                        documentation shows when an intervention can be considered.</li>
                    </ul>
                </p>

                <p>
                    For example, an intervention that could be explored is providing fertilizer subsidies to farmers.
                    This can be explored with the EACS economic model by adjusting the parameters concerning the cost of
                    fertilizers for each crop type. The maize fertilizer price adjustment parameter reflect the percentage
                    change in the unit cost of nitrogen fertilizer as an input into the production of maize, where a reduction
                    in the unit cost of nitrogen fertilizer for maize can be interpreted as a fertilizer subsidy for maize. The
                    range of this parameter is from -50 to 50. So a value of this parameter of -10 reflects a moderate
                    subsidy. The model takes into account farmer’s behaviors when fertilizer cost is lower, and will adjust
                    crop production accordingly.
                </p>
            </div>
            <div slot="footer">
            </div>
        </wl-dialog>`
    }

    // This is called every time something is updated in the store.
    stateChanged(state: RootState) {
        if (state.app && state.app.prefs && state.app.prefs.profile) {
            let profile = state.app.prefs.profile;
            if (profile.preferredRegion != this._preferredRegion) {
                this._preferredRegion = profile.preferredRegion;
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
