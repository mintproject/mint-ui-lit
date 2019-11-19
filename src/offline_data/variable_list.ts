export const VARIABLES = {
    "adjustment_variables": {
        "Agriculture": {
            "var6": {
                "long_name": "Amount of fertilizer added",
                "SVO_name": "land_fertilizer__applied_mass"
            },
            "var7": {
                "long_name": "Amount of weed",
                "SVO_name": "crop__planting_count-per-area_density_fraction",
                "intervention": {
                    "id": "weed_control",
                    "name": "Weed control",
                    "description": "Interventions concerning weed control and weed management practices can be reflected in the model by indicating the fraction of weeds that will remain after the weed treatments applied by farmers"
                }
            },
            "var1": {
                "long_name": "Start year for the simulation",
                "SVO_name": "model__simulation_start_time"
            },
            "var2": {
                "long_name": "End year for the simulation",
                "SVO_name": "model__simulation_end_time"
            },
            "var4": {
                "long_name": "Day of the year when planting starts",
                "SVO_name": "crop__planting_start_time",
                "intervention": {
                    "id": "planting_windows",
                    "name": "Planting windows",
                    "description": "Interventions that force specific target planting windows can be expressed in this model as start and end planting dates"
                }
            },
            "var5": {
                "long_name": "Day of the year when planting ends",
                "SVO_name": "crop__planting_end_time",
                "intervention": {
                    "id": "planting_windows",
                    "name": "Planting windows",
                    "description": "Interventions that force specific target planting windows can be expressed in this model as start and end planting dates"
                }
            },
            "var3": {
                "long_name": "Crop Name",
                "SVO_name": "crop__name"
            },
        },
        "Economic": {
            "var1": {
                "long_name": "Fertilizer cost",
                "SVO_name": "fertilizer~nitrogen__usage-cost-per-applied-mass",
                "intervention": {
                    "id": "fertilizer_subsidies",
                    "name": "Fertilizer Subsidies",
                    "description": "Interventions concerning fertilizer subsidies can be expressed in this model as a percentage of fertilizer prices"
                }                
            },
            "var2": {
                "long_name": "Crop Prices",
                "SVO_name": "farmer_crop__received_price-per-mass"
            },
            "var3": {
                "long_name": "Land Cost",
                "SVO_name": "land_crop__production_cost-per-area"
            },
        },
        "Hydrology": {
            
        }
    },
    "indicators": {
        "Agriculture": {
            "var1": {
                "long_name": "Potential Crop Production",
                "SVO_name": "grain~dry__mass-per-area_yield"
            }
        },
        "Economic": {
            "var1": {
                "long_name": "Crop Production",
                "SVO_name": "crop__simulated_produced_mass"
            },
        },
        "Hydrology": {
            "var4": {
                "long_name": "River Discharge",
                "SVO_name": "downstream_volume_flow_rate"
            },
            "var7": {
                "long_name": "Overbank Flood Depth",
                "SVO_name": "land_surface_water__flood_inundation_depth"
            },
            "var5": {
                "long_name": "Streamflow Duration Index",
                "SVO_name": "channel~stream_water__flow_duration_index"
            },
            "var6": {
                "long_name": "Recharge Volume Flux",
                "SVO_name": "recharge_volume_flux"
            },
            "var1": {
                "long_name": "Water table level",
                "SVO_name": "water_table__level_height"
            },
            "var2": {
                "long_name": "Streamflow Location",
                "SVO_name": "streamflow_location"
            },
            "var3": {
                "long_name": "Total Water Storage",
                "SVO_name": "total_water_storage"
            }            
        }
    }
};


const _addToVariableMap = (vars: Object) => {
    Object.keys(vars).map((categoryname) => {
        let category = vars[categoryname];
        Object.keys(category).map((varid) => {
            let stdname = category[varid]["SVO_name"].split(/,\s*/);
            let name = category[varid]["long_name"];
            stdname.forEach((stdn) => {
                VARIABLE_MAP[stdn] = category[varid];
            });
        })
    })
}

const VARIABLE_MAP = {};
_addToVariableMap(VARIABLES['adjustment_variables']);
_addToVariableMap(VARIABLES['indicators']);

export const getVariableLongName = (stdname: string) => {
    return getVariableProperty(stdname, "long_name");
}

export const getVariableIntervention = (stdname: string) => {
    if(stdname)
        return getVariableProperty(stdname, "intervention");
}

export const getVariableProperty = (stdname: string, property: string) => {
    let stdn = stdname.split(/,\s*/)[0];
    return VARIABLE_MAP[stdn][property];
}