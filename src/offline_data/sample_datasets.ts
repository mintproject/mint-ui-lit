import { toTimeStamp } from "util/date-utils";

export const EXAMPLE_DATASETS_QUERY = [
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
        resources: [{
            id: "FLDAS_NOAH01_A_EA_D.001.Resource",
            name: "FLDAS_NOAH01_A_EA_D.001.Resource",
            url: "http://path/to/resource"
        }],
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
        time_period: {
            start_date: toTimeStamp("2001-01-01"),
            end_date: toTimeStamp("2018-11-15")
        }
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
        resources: [{
            id: "FLDAS_NOAH01_A_EA_D.001.Resource",
            name: "FLDAS_NOAH01_A_EA_D.001.Resource",
            url: "http://path/to/resource"
        }],
        categories: [
            "Weather",
            "Land Surface"
        ],
        variables: [
            "atmosphere_water__one-day_time_integral_of_precipitation_leq_volume_flux"
        ],
        time_period: {
            start_date: toTimeStamp("2001-01-01"),
            end_date: toTimeStamp("2018-11-15")
        }
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
        resources: [{
            id: "FLDAS_NOAH01_A_EA_D.001.Resource",
            name: "FLDAS_NOAH01_A_EA_D.001.Resource",
            url: "http://path/to/resource"
        }],
        categories: [
            "Weather",
            "Land Surface"
        ],
        variables: [
            "atmosphere_water__one-day_time_integral_of_precipitation_leq_volume_flux"
        ],
        time_period: {
            start_date: toTimeStamp("1979-01-02"),
            end_date: toTimeStamp("2019-05-31")
        }
    },
    {
        id: "GLDAS_NIAH025_3H.2.1",
        name: "GLDAS Noah Land Surface Model L4 3 hourly 0.25 x 0.25 degree V2.1",
        datatype: "GLDAS",
        limitations: "N/A",
        version: "N/A",
        description: "This data set, GLDAS-2.1 Noah 0.25 degree 3-hourly, \
        simulated with the Noah Model 3.3 in Land Information System (LIS) Version 7, \
        contains 36 land surface fields from January 2000 to present.",
        region: "East Africa",
        source: {
            name: "LDAS",            
            url: "https://ldas.gsfc.nasa.gov/fldas/specifications",
            type: "Modeled",
        },
        resources: [{
            id: "FLDAS_NOAH01_A_EA_D.001.Resource",
            name: "FLDAS_NOAH01_A_EA_D.001.Resource",
            url: "http://path/to/resource"
        }],
        categories: [
            "Weather",
            "Land Surface"
        ],
        variables: [
            "atmosphere_water__one-day_time_integral_of_precipitation_leq_volume_flux",
            "land_surface_groundwater__time_integral_of_baseflow_runoff_mass_flux"
        ],
        time_period: {
            start_date: toTimeStamp("2001-01-01"),
            end_date: toTimeStamp("2018-11-15")
        }
    }
]