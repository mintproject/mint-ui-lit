export const EXAMPLE_MODEL_QUERY = [
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
        id: "Cycles_v9_4_0_alpha_Advanced_Configuration",
        name: "Cycles v9.4.0-alpha - Advanced Configuration",
        original_model: "CYCLES",
        calibrated_region: "Pongo Basin (South Sudan)",
        category: "Agriculture",
        model_type: "Simulation", // DataDriven, Emulation, Hybrid
        parameter_assignment: "Expert-Configured", //Auto-tuned, Expert-tuned, Trained
        target_variable_for_parameter_assignment: "N/A",
        parameter_assignment_details: "ISRIc soils data, GLDAS forcing, expert configured agricultural management",
        modeled_processes: [
            "Agricultural management practices, energy balance, water balance, \
            nitrogen and other nutrients cycling including soil carbon"
        ],
        dimensionality: 1,
        spatial_grid_type: "Point model",
        spatial_grid_resolution: "N/A",
        minimum_output_time_interval: "Daily",

        input_files: [
            {
                id: "gldas_input",
                name: "Precipitation Input File",
                type: "GLDAS_Daily",
                variables: [
                    "atmosphere_water__one-day_time_integral_of_precipitation_leq_volume_flux"
                ]
            }
        ],
        input_parameters: [
            {
                id: "planting_date_adjustment",
                name: "Adjustment to planting date",
                type: "days",
                min: "-20",
                max: "20",
                default: "0"
            },
            {
                id: "fertilizer_level_adjustment",
                name: "Adjustment to fertilizer level",
                type: "percentage",
                min: "-20",
                max: "20",
                default: "0"
            },
            {
                id: "weed_fractions_adjustment",
                name: "Adjustment to weed fractions",
                type: "percentage",
                min: "-20",
                max: "20",
                default: "0"
            },
            {
                id: "crops_adjustment",
                name: "Adjustment to crops",
                type: "percentage",
                min: "-20",
                max: "20",
                default: "0"
            },
        ],
        output_files: [
            {
                id: "grain_yields",
                name: "Grain Yields",
                variables: [
                    "grain~dry__mass-per-area_yield",
                ]
            }
        ]
    },
    {
        id: "Cycles_v9_4_0_alpha_Simple_Configuration",
        name: "Cycles v9.4.0-alpha - Simple Configuration",
        original_model: "CYCLES",
        calibrated_region: "Pongo Basin (South Sudan)",
        category: "Agriculture",
        model_type: "Simulation", // DataDriven, Emulation, Hybrid
        parameter_assignment: "Expert-Configured", //Auto-tuned, Expert-tuned, Trained
        target_variable_for_parameter_assignment: "N/A",
        parameter_assignment_details: "ISRIc soils data, GLDAS forcing, expert configured agricultural management",
        modeled_processes: [
            "Agricultural management practices, energy balance, water balance, \
            nitrogen and other nutrients cycling including soil carbon"
        ],
        dimensionality: 1,
        spatial_grid_type: "Point model",
        spatial_grid_resolution: "N/A",
        minimum_output_time_interval: "Daily",

        input_files: [
            {
                id: "gldas_input",
                name: "Precipitation Input File",
                type: "GLDAS_Daily",
                variables: [
                    "atmosphere_water__one-day_time_integral_of_precipitation_leq_volume_flux"
                ]
            }
        ],
        input_parameters: [],
        output_files: [
            {
                id: "grain_yields",
                name: "Grain Yields File",
                variables: [
                    "grain~dry__mass-per-area_yield",
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
    {
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