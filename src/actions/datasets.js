export const DATASETS_QUERY = 'DATASETS_QUERY';
export const DATASETS_DETAIL = 'DATASETS_DETAIL';
;
;
const EXAMPLE_DATASETS_QUERY = [
    {
        id: "FLDAS_NOAH01_A_EA_D.001",
        name: "FLDAS_NOAH01_A_EA_D.001",
        datatype: "FLDAS",
        limitations: "N/A",
        description: "This FLDAS dataset was obtained using the NOAH Model\
        (NOAH), forced with GDAS and RFE2 data for Eastern Africa at a resolution of 0.25degrees\
        with a daily timescale",
        version: "LIS 7 Regional daily runs",
        region: "East Africa",
        source: {
            name: "FLDAS",
            url: "https://ldas.gsfc.nasa.gov/fldas/specifications",
            type: "Model, reanalysis",
        },
        categories: [
            "Weather",
            "Land Surface"
        ],
        variables: [
            "atmosphere_water__one-day_time_integral_of_precipitation_leq_volume_flux"
        ],
        time_period: "2001-01-01 to 2018-11-15"
    },
    {
        id: "FLDAS_VIC025_A_EA_D.001",
        name: "FLDAS_VIC025_A_EA_D.001",
        datatype: "FLDAS",
        limitations: "N/A",
        version: "LIS 7 Regional daily runs",
        description: "This FLDAS dataset was obtained using the Variable Infiltration Capacity Model\
        #(VIC), forced with GDAS and RFE2 data for Eastern Africa at a resolution of 0.25degrees\
        #with a daily timescale",
        region: "East Africa",
        source: {
            name: "FLDAS",
            url: "https://ldas.gsfc.nasa.gov/fldas/specifications",
            type: "Model, reanalysis",
        },
        categories: [
            "Weather",
            "Land Surface"
        ],
        variables: [
            "atmosphere_water__one-day_time_integral_of_precipitation_leq_volume_flux"
        ],
        time_period: "2001-01-01 to 2018-11-15"
    },
    {
        id: "GLDAS_NOAH10SUBP_3H.001",
        name: "GLDAS_NOAH10SUBP_3H.001",
        datatype: "GLDAS",
        limitations: "N/A",
        version: "N/A",
        description: "This GLDAS dataset was obtained using the NOAH model,\
         forced with multiple datasets derived from satellite measurements and \
         atmospheric analyses at a resolution of 1degree every 3hours.",
        region: "East Africa",
        source: {
            name: "LDAS",
            url: "https://ldas.gsfc.nasa.gov/fldas/specifications",
            type: "Modeled",
        },
        categories: [
            "Weather",
            "Land Surface"
        ],
        variables: [
            "atmosphere_water__one-day_time_integral_of_precipitation_leq_volume_flux"
        ],
        time_period: "1979-01-02 to 2019-05-31"
    }
];
export const queryDatasets = (modelid, inputid, driving_variables) => (dispatch) => {
    let datasets = [];
    //console.log(driving_variables);
    EXAMPLE_DATASETS_QUERY.map((ds) => {
        let i = 0;
        for (; i < driving_variables.length; i++) {
            if (ds.variables.indexOf(driving_variables[i]) >= 0) {
                datasets.push(ds);
                break;
            }
        }
    });
    if (driving_variables.length > 0) {
        dispatch({
            type: DATASETS_QUERY,
            modelid: modelid,
            inputid: inputid,
            datasets: datasets
        });
    }
};
export const queryDatasetDetail = (datasetid) => (dispatch) => {
    if (datasetid) {
        let dataset = {
            id: datasetid,
            name: datasetid
        };
        dispatch({
            type: DATASETS_DETAIL,
            dataset: dataset
        });
    }
};
