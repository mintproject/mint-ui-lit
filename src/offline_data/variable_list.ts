export const VARIABLES = {
    "adjustment_variables": {
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
    "indicators": {
        "Agriculture": {
            "var1": {
                "long_name": "Potential Crop Production",
                "SVO_name": "grain~dry__mass-per-area_yield"
            },
            "var2": {
                "long_name": "Seasonal Crop Production Index",
                "SVO_name": "crop_production__seasonal_production_index",
                "created_from": [ "grain~dry__mass-per-area_yield" ]
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

export const getVariableProperty = (stdname: string, property: string) => {
    let stdn = stdname.split(/,\s*/)[0];
    return VARIABLE_MAP[stdn][property];
}