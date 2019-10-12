export const VARIABLES = {
    "driving variable": {
        "Agriculture": {
            "var6": {
                "long_name": "Amount of fertilizer added",
                "SVO_name": "land_fertilizer__applied_mass"
            },
            "var7": {
                "long_name": "Amount of weed",
                "SVO_name": "crop__planting_count-per-area_density_fraction"
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
                "SVO_name": "crop__planting_start_time"
            },
            "var5": {
                "long_name": "Day of the year when planting ends",
                "SVO_name": "crop__planting_end_time"
            },
            "var3": {
                "long_name": "Crop Name",
                "SVO_name": "crop__name"
            },
        },
        "Economic": {
            "var1": {
                "long_name": "Fertilizer cost",
                "SVO_name": "fertilizer~nitrogen__usage-cost-per-applied-mass"
            },
            "var2": {
                "long_name": "Crop Prices",
                "SVO_name": "farmer_crop__received_price-per-mass"
            },
            "var3": {
                "long_name": "Land Cost",
                "SVO_name": "land_crop__production_cost-per-area"
            },
        }
    },
    "response variable": {
        "Agriculture": {
            "var1": {
                "long_name": "Potential Crop Production",
                "SVO_name": "grain~dry__mass-per-area_yield"
            },
            "var2": {
                "long_name": "Seasonal Crop Production Index",
                "SVO_name": "crop__production_index"
            },
        },
        "Economic": {
            "var1": {
                "long_name": "Crop Production",
                "SVO_name": "crop__simulated_produced_mass"
            },
        }
    }
};

export const VARIABLES_OLD = {
    "driving variable": {
        "Weather": {
            "var1": {
                "long_name": "Precipitation",
                "SVO_name": "atmosphere_water__one-day_time_integral_of_precipitation_leq_volume_flux"
            },
            "var2": {
                "long_name": "Air Temperature",
                "SVO_name": "air__temperature"
            },
            "var3": {
                "long_name": "Relative Humidity",
                "SVO_name": "atmosphere_air_water~vapor__relative_saturation"
            },
            "var4": {
                "long_name": "Wind Speed",
                "SVO_name": "wind__speed"
            },
            "var5": {
                "long_name": "Wind Speed",
                "SVO_name": "wind__speed"
            }
        },
        "Hydrology": {          
            "var1": {
                "long_name": "Groundwater Head",
                "SVO_name": "groundwater__head"
            },
            "var2": {
                "long_name": "Surface Runoff",
                "SVO_name": "land_surface_water__runoff_mass_flux"
            },
            "var3": {
                "long_name": "Infiltration Rate",
                "SVO_name": "soil_surface_water__infiltration_volume_flux"
            },
            "var4": {
                "long_name": "Surface Water",
                "SVO_name": "land_surface_water__depth"
            },
            "var5": {
                "long_name": "Soil Moisture",
                "SVO_name": "soil_water__volume-per-area_concentration"
            }
        },
        "Agriculture": {
            "var1": {
                "long_name": "Yield Elasticity",
                "SVO_name": "crop_fertilizer~nitrogen__yield_elasticity"
            },
            "var2": {
                "long_name": "Nitrogen Fertilizer Use",
                "SVO_name": "crop_fertilizer~nitrogen__observed_applied_mass"
            },
            "var3": {
                "long_name": "Planting Date",
                "SVO_name": "crop__planting_or_sowing_date"
            },
            "var4": {
                "long_name": "Crop Yields",
                "SVO_name": "land_crop__simulated_mass-per-area_yield"
            },
            "var5": {
                "long_name": "Planting Row Spacing",
                "SVO_name": "crop_row__planting_separation_distance"
            }
        },
        "Economy": {
            "var1": {
                "long_name": "Land Cost",
                "SVO_name": "land_crop__production_cost-per-area"
            },
            "var2": {
                "long_name": "Land Allocation",
                "SVO_name": "land_crop__observed_allocated_area"
            },
            "var3": {
                "long_name": "Fertilizer Cost",
                "SVO_name": "fertilizer~nitrogen__usage-cost-per-applied-mass"
            },
            "var4": {
                "long_name": "Crop Prices",
                "SVO_name": "farmer_crop__received_price-per-mass"
            },
            "var5": {
                "long_name": "Fertilizer Application",
                "SVO_name": "land_fertilizer~nitrogen__simulated_applied_mass-per-area_density"
            }
        }
    },
    "response variable": {
        "Hydrology": {
            "var6": {
                "long_name": "European Flooding Index",
                "SVO_name": "european_flooding_index"
            },            
            "var1": {
                "long_name": "Flood 10cm Exceeding Depth",
                "SVO_name": "Flood 10cm exceeding depth"
            },
            "var2": {
                "long_name": "Surface Runoff",
                "SVO_name": "land_surface_water__runoff_mass_flux"
            },
            "var3": {
                "long_name": "Infiltration Rate",
                "SVO_name": "soil_surface_water__infiltration_volume_flux"
            },
            "var4": {
                "long_name": "Surface Water",
                "SVO_name": "land_surface_water__depth"
            },
            "var5": {
                "long_name": "Soil Moisture",
                "SVO_name": "soil_water__volume-per-area_concentration"
            }
        },
        "Agriculture": {
            "var1": {
                "long_name": "Harvest Yield",
                "SVO_name": "crop~mature~dry__harvest_mass-per-area_yield"
            },
            "var2": {
                "long_name": "Total Plant Biomass",
                "SVO_name": "plant_at-grain-or-forage-harvest-or-death__mass-per-area_density"
            },
            "var3": {
                "long_name": "Grain Yield",
                "SVO_name": "grain~dry__mass-per-area_yield, crop~mature~dry__harvest_mass-per-area_yield"
            },
            "var4": {
                "long_name": "Crop Yields",
                "SVO_name": "land_crop__simulated_mass-per-area_yield"
            },
            "var5": {
                "long_name": "Tops Dry Weight",
                "SVO_name": "crop~mature~dry_tops__mass-per-area_yield"
            }
        },
        "Economy": {
            "var1": {
                "long_name": "Crop Production",
                "SVO_name": "crop__simulated_produced_mass"
            },
            "var3": {
                "long_name": "Land Area",
                "SVO_name": "land_crop__simulated_allocated_area"
            },
            "var4": {
                "long_name": "Nitrogen Fertlizer Application",
                "SVO_name": "land_fertilizer~nitrogen__simulated_applied_mass-per-area_density"
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
                VARIABLE_MAP[stdn] = name;
            });
        })
    })
}

const VARIABLE_MAP = {};
_addToVariableMap(VARIABLES['driving variable']);
_addToVariableMap(VARIABLES['response variable']);

export const getVariableLongName = (stdname: string) => {
    let stdn = stdname.split(/,\s*/)[0];
    return VARIABLE_MAP[stdn];
}
