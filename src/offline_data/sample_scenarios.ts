import { Goal, SubGoal, Pathway } from "../screens/modeling/reducers";
import { IdMap } from "../app/reducers";
import { Region } from "../screens/regions/reducers";
import { toTimeStamp } from "util/date-utils";

export const EXAMPLE_REGION_DATA = {
    "south_sudan": {
        "id": "south_sudan",
        "name": "South Sudan",
        "geojson": "http://mint-ui.org/server/common/geo/south_sudan"
    } as Region,
    "ethiopia": {
        "id": "ethiopia",
        "name": "Ethiopia",
        "geojson": "https://raw.githubusercontent.com/glynnbird/countriesgeojson/master/ethiopia.geojson"
    } as Region
};

export const EXAMPLE_SCENARIOS_LIST_DATA = {
    "scenarioids": [ "scenario1", "scenario2", "scenario3", "scenario4", "scenario5" ],
    "scenarios": {
        "scenario1": {
            "id": "scenario1",
            "name": "Check on Food Security in South Sudan",
            "regionid": "south_sudan",
            "dates": {
                "start_date": toTimeStamp(new Date().toDateString()),
                "end_date": toTimeStamp(new Date().toDateString()),
            }
        },
        "scenario2": {
            "id": "scenario2",
            "name": "Check up on Flooding issues in South Sudan",
            "regionid": "south_sudan",
            "dates": {
                "start_date": toTimeStamp(new Date().toDateString()),
                "end_date": toTimeStamp(new Date().toDateString()),
            }
        },
        "scenario3": {
            "id": "scenario3",
            "name": "Investigate the evolving refugee crisis in Ethipia",
            "regionid": "ethiopia",
            "dates": {
                "start_date": toTimeStamp(new Date().toDateString()),
                "end_date":toTimeStamp (new Date().toDateString()),
            }
        },
        "scenario4": {
            "id": "scenario4",
            "name": "Check up on Flooding issues in Ethiopia",
            "regionid": "ethiopia",
            "dates": {
                "start_date": toTimeStamp(new Date().toDateString()),
                "end_date": toTimeStamp(new Date().toDateString()),
            }
        },
        "scenario5": {
            "id": "scenario5",
            "name": "Check up on Flooding issues in Ethiopia",
            "regionid": "ethiopia",
            "dates": {
                "start_date":toTimeStamp(new Date().toDateString()),
                "end_date":toTimeStamp(new Date().toDateString()),
            }
        }
    }
}

export const EXAMPLE_SCENARIO_DETAILS = {
    "id": "scenario1",
    "name": "Check on Food Security in South Sudan",
    "regionid": "south_sudan",
    "dates": {
        "start_date": toTimeStamp("2017-01-01"),
        "end_date": toTimeStamp("2018-01-01")
    },
    "goals": {
        "goal1": {
            "id": "goal1",
            "name": "Forecast crop production for lean season of 2017",
            "subgoalids": ["subgoal1", "subgoal2"]
        },
        "goal2": {
            "id": "goal2",
            "name": "Check for transportation blockages if there is increased rainfall",
            "subgoalids": ["subgoal3"]
        },
    } as IdMap<Goal>,
    "subgoals": {
        "subgoal1": {
            "id": "subgoal1",
            "name": "View historical precipitation data",
            "pathwayids": [ "pathway1" ]
        },
        "subgoal2": {
            "id": "subgoal2",
            "name": "Forecast crop production details",
            "pathwayids": [ "pathway2" ]
        },
        "subgoal3": {
            "id": "subgoal3",
            "name": "Check transportation map",
            "pathwayids": [ "pathway3" ]
        },
    } as IdMap<SubGoal>,
    "pathways": {
        "pathway1": {
            "id": "pathway1",
            "driving_variables": [],
            "response_variables": ["crop__simulated_produced_mass"],
            "model_ensembles": {
                "Aggregate_crop_supply_response_model_v2_simple": {

                },
                "Aggregate_crop_supply_response_model_v2_advanced": {
                    
                }
            },
            "models": {
                "Aggregate_crop_supply_response_model_v2_simple": {
                    id: "Aggregate_crop_supply_response_model_v2_simple",
                    name: "Aggregate crop supply response model v2.0 - Simple Configuration",
                    original_model: "ECONOMIC_AGGREGATE_CROP_SUPPLY",
                    calibrated_region: "Pongo Basin",
                    category: "Economy",
                    model_type: "Simulation", // DataDriven, Emulation, Hybrid
                    parameter_assignment: "Calibration", //Auto-tuned, Expert-tuned, Trained
                    target_variable_for_parameter_assignment: "Fertilizer & Land Use",
                    parameter_assignment_details: "The model was configured using FAO production data, WFP price data and \
                    estimated elasticities from related literatures. The model was calibrated from national/regional observed \
                    data on land use and crop production level for behavior parameters, to produce optimal simulation outputs \
                    under various adjustment to variables within the model",
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
                "Aggregate_crop_supply_response_model_v2_advanced": {
                    id: "Aggregate_crop_supply_response_model_v2_advanced",
                    name: "Aggregate crop supply response model v2.0 - Advanced Configuration",
                    original_model: "ECONOMIC_AGGREGATE_CROP_SUPPLY",
                    calibrated_region: "Pongo Basin",
                    category: "Economy",
                    model_type: "Simulation", // DataDriven, Emulation, Hybrid
                    parameter_assignment: "Calibration", //Auto-tuned, Expert-tuned, Trained
                    parameter_assignment_details: "The model was configured using FAO production data, WFP price data and \
                    estimated elasticities from related literatures. The model was calibrated from national/regional observed \
                    data on land use and crop production level for behavior parameters, to produce optimal simulation outputs \
                    under various adjustment to variables within the model",
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
                            max: "50"
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
            },
            "datasets": {}
        },
        "pathway2": {
            "id": "pathway1",
            "driving_variables": [],
            "response_variables": [],
            "models": {},
            "datasets": {}
        },
        "pathway3": {
            "id": "pathway1",
            "driving_variables": [],
            "response_variables": [],
            "models": {},
            "datasets": {}
        },
    } as IdMap<Pathway>
}
