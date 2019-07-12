import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState } from "../store";
import { Model, ModelDetail } from "../reducers/models";
import { matchVariables } from "../util/state_functions";

export const MODELS_QUERY = 'MODELS_QUERY';
export const MODELS_DETAIL = 'MODELS_DETAIL';

export interface ModelsActionQuery extends Action<'MODELS_QUERY'> { variables: string[], models: Model[] };
export interface ModelsActionDetail extends Action<'MODELS_DETAIL'> { model: ModelDetail };

export type ModelsAction = ModelsActionQuery |  ModelsActionDetail ;

//const MODEL_CATALOG_URI = "https://query.mint.isi.edu/api/mintproject/MINT-ModelCatalogQueries";

const EXAMPLE_MODEL_QUERY = [
    {
        id: "PIHM_v22_Pongo_Basin_Configuration",
        name: "PIHM v2.2 - Pongo Basin Configuration",
        original_model: "PIHM",
        calibrated_region: "Pongo Basin (South Sudan)",
        category: "Hydrology",
        model_type: "Simulation", // DataDriven, Emulation, Hybrid
        parameter_assignment: "Expert-configured", //Auto-tuned, Expert-tuned, Trained
        target_variable_for_parameter_assignment: "Streamflow",
        parameter_assignment_details: "",
        modeled_processes: [
            "Evapo-transpiration, infiltration, channel flow, ground water, overland flow"
        ],
        dimensionality: 2,
        spatial_grid_type: "Spatially distributed",
        spatial_grid_resolution: "50m-200m",
        minimum_output_time_interval: "Hourly",

        input_files: [
            {
                id: "fldas_input",
                name: "Precipitation Input File",
                type: "FLDAS_Daily",
                variables: [
                    "atmosphere_water__one-day_time_integral_of_precipitation_leq_volume_flux"
                ]
            }
        ],
        input_parameters: [
            {
                id: "precipitation_adjustment",
                name: "Adjustment to precipitation",
                type: "percentage",
                min: "-20",
                max: "20",
                default: "0"
            },
            {
                id: "temperature_adjustment",
                name: "Adjustment to temperature",
                type: "percentage",
                min: "-20",
                max: "20",
                default: "0"
            },
        ],
        output_files: [
            {
                id: "flooding_index",
                name: "Flooding Index",
                variables: [
                    "european_flooding_index",
                ]
            }
        ]
    },
    {
        id: "PIHM_v22_Pongo_Basin_Calibration",
        name: "PIHM v2.2 - Pongo Basin Calibration",
        original_model: "PIHM",
        calibrated_region: "Pongo Basin (South Sudan)",
        category: "Hydrology",
        model_type: "Simulation", // DataDriven, Emulation, Hybrid
        parameter_assignment: "Calibrated", //Auto-tuned, Expert-tuned, Trained
        target_variable_for_parameter_assignment: "Streamflow",
        parameter_assignment_details: "The model was configured using Srtm topo data, ISRIc soils data, \
        Univ of MD land use data and fldas forcing from data catalog. The model was calibrated from regional data for \
        expected runoff/Precipitation long term mean value",
        modeled_processes: [
            "Evapo-transpiration, infiltration, channel flow, ground water, overland flow"
        ],
        dimensionality: 2,
        spatial_grid_type: "Spatially distributed",
        spatial_grid_resolution: "50m-200m",
        minimum_output_time_interval: "Hourly",

        input_files: [
            {
                id: "fldas_input",
                name: "Precipitation Input File",
                type: "FLDAS_Daily",
                variables: [
                    "atmosphere_water__one-day_time_integral_of_precipitation_leq_volume_flux"
                ]
            }
        ],
        input_parameters: [
            {
                id: "precipitation_adjustment",
                name: "Adjustment to precipitation",
                type: "percentage",
                min: "-20",
                max: "20",
                default: "0"
            },
            {
                id: "temperature_adjustment",
                name: "Adjustment to temperature",
                type: "percentage",
                min: "-20",
                max: "20",
                default: "0"
            },
        ],
        output_files: [
            {
                id: "flooding_index",
                name: "Flooding Index",
                variables: [
                    "european_flooding_index",
                ]
            }
        ]
    },
    {
        id: "TopoFlow_35_Pongo_Basin_Configuration",
        name: "TopoFlow 3.5 - Pongo Basin Configuration",
        original_model: "TOPOFLOW",
        calibrated_region: "Pongo Basin (South Sudan)",
        category: "Hydrology",
        model_type: "Simulation", // DataDriven, Emulation, Hybrid
        parameter_assignment: "Expert-configured", //Auto-tuned, Expert-tuned, Trained
        parameter_assignment_details: "",
        target_variable_for_parameter_assignment: "Streamflow",
        modeled_processes: [
            "Evapo-transpiration, infiltration, channel flow"
        ],
        dimensionality: 2,
        spatial_grid_type: "Spatially distributed",
        spatial_grid_resolution: "100x100m",
        minimum_output_time_interval: "Minutes",

        input_files: [
            {
                id: "fldas_input",
                name: "Precipitation Input File",
                type: "FLDAS_Daily",
                variables: [
                    "atmosphere_water__one-day_time_integral_of_precipitation_leq_volume_flux"
                ]
            }
        ],
        input_parameters: [
            {
                id: "precipitation_adjustment",
                name: "Adjustment to precipitation",
                type: "percentage",
                min: "-20",
                max: "20",
                default: "0"
            },
            {
                id: "soil_moisture_adjustment",
                name: "Adjustment to initial soil moisture",
                type: "percentage",
                min: "-20",
                max: "20",
                default: "0"
            },
            {
                id: "channel_water_depth_adjustment",
                name: "Adjustment to initial channel water depth",
                type: "percentage",
                min: "-20",
                max: "20",
                default: "0"
            },
        ],
        output_files: [
            {
                id: "flooding_index",
                name: "Flooding Index",
                variables: [
                    "european_flooding_index",
                ]
            }
        ]
    },    
    {
        id: "Aggregate_crop_supply_response_model_v2_simple",
        name: "Aggregate crop supply response model v2.0 - Simple Configuration",
        original_model: "ECONOMIC_AGGREGATE_CROP_SUPPLY",
        calibrated_region: "Pongo Basin",
        category: "Economy",
        model_type: "Simulation", // DataDriven, Emulation, Hybrid
        parameter_assignment: "Calibration", //Auto-tuned, Expert-tuned, Trained
        target_variable_for_parameter_assignment: "Fertilizer & Land Use",
        parameter_assignment_details: "",
        modeled_processes: [
            "Constrained maximization of net revenue"
        ],
        dimensionality: 0,
        spatial_grid_type: "Point model",
        spatial_grid_resolution: "N/A",
        minimum_output_time_interval: "Harvest Cycles/year",

        input_files: [],
        input_parameters: [],
        output_files: [
            {
                id: "crop_production",
                name: "Crop Production",
                variables: [
                    "crop__simulated_produced_mass",
                ]
            }
        ]
    },
    {
        id: "Aggregate_crop_supply_response_model_v2_advanced",
        name: "Aggregate crop supply response model v2.0 - Advanced Configuration",
        original_model: "ECONOMIC_AGGREGATE_CROP_SUPPLY",
        calibrated_region: "Pongo Basin",
        category: "Economy",
        model_type: "Simulation", // DataDriven, Emulation, Hybrid
        parameter_assignment: "Calibration", //Auto-tuned, Expert-tuned, Trained
        parameter_assignment_details: "",
        target_variable_for_parameter_assignment: "Fertilizer & Land Use",
        modeled_processes: [
            "Constrained maximization of net revenue"
        ],
        dimensionality: 0,
        spatial_grid_type: "Point model",
        spatial_grid_resolution: "N/A",
        minimum_output_time_interval: "Harvest Cycles/year",

        input_files: [],
        input_parameters: [
            {
                id: "crop_price_adjustment",
                name: "Adjustment to crop price",
                type: "percentage",
                min: "-50",
                max: "50",
                default: "0"
            },
            {
                id: "land_cost_adjustment",
                name: "Adjustment to land cost",
                type: "percentage",
                min: "-50",
                max: "50",
                default: "0"
            },
            {
                id: "fertilizer_cost_adjustment",
                name: "Adjustment to fertilizer cost",
                type: "percentage",
                min: "-50",
                max: "50",
                default: "0"
            }
        ],
        output_files: [
            {
                id: "crop_production",
                name: "Crop Production",
                variables: [
                    "crop__simulated_produced_mass",
                ]
            }
        ]
    },  
]

// Query Model Catalog
type QueryModelsThunkResult = ThunkAction<void, RootState, undefined, ModelsActionQuery>;
export const queryModels: ActionCreator<QueryModelsThunkResult> = (response_variables: string[]) => (dispatch) => {
    let models = [] as Model[];
    //console.log(driving_variables);
    /*
    fetch(MODEL_CATALOG_URI + "/getModelConfigurationsForVariable?std=" + response_variable).then((response) => {
        console.log(response.json);
    });
    */
    EXAMPLE_MODEL_QUERY.map((model) => {
        let i=0;
        for(;i<model.output_files.length; i++) {
            let output = model.output_files[i];
            if(matchVariables(output.variables, response_variables, true)) // Do a full match
                models.push(model as Model);
        }
    });
    dispatch({
        type: MODELS_QUERY,
        variables: response_variables,
        models: models
    });
};

// Query Model Details
type QueryModelDetailThunkResult = ThunkAction<void, RootState, undefined, ModelsActionDetail>;
export const queryModelDetail: ActionCreator<QueryModelDetailThunkResult> = (modelid: string) => (dispatch) => {
    if(modelid) {
        let model = {
            id: modelid,
            name: modelid
        } as ModelDetail;
        dispatch({
            type: MODELS_DETAIL,
            model: model
        });        
    }
};