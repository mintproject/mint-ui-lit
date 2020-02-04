/*
export const queryDatasetsByVariables
        (modelid: string, inputid: string, driving_variables: string[], dates: DateRange, region: Region, 
            prefs:MintPreferences ) 
export const queryGeneralDatasets:
        (queryParameters: DatasetQueryParameters, prefs: MintPreferences )

export const queryDatasetResources:
        (dsid: string, region: Region, prefs: MintPreferences)
export const queryDatasetResourcesAndSave:
        (dsid: string, region: Region, prefs: MintPreferences)
export const queryDatasetsByRegion:
        (region: Region, prefs: MintPreferences)

export function loadResourcesForDataset (datasetid:string, dates:DateRange, region:Region, prefs:MintPreferences)


export interface DatasetQueryParameters {
    spatialCoverage?: BoundingBox,
    dateRange?: DateRange,
    name?: string,
    variables?: string[]
}
*/

import { IdNameObject } from "app/reducers";
import { DateRange } from "screens/modeling/reducers";
import { toTimeStamp, fromTimeStampToString, fromTimeStampToString2 } from "util/date-utils";

export interface Source {
    name: string,
    url: string,
    type: string
}

export interface Dataset extends IdNameObject {
    description:        string,
    //From metadata:
    datatype:           string,
    source:             Source,
    time_period:        DateRange,
    version:            string,
    license:            string, /**/
    reference:          string, /**/
    limitations:        string,
    resource_count?:    number,
    is_cached?:         boolean,
    categories?:        string[], //category or category_tags ?
    resource_repr?:     any, //only 2
    dataset_repr?:      any, // 0
    //Require get_dataset_info TODO: we need a flag for this?
    spatial_coverage?:  any,
    //Required?
    variables:          string[],
    //LOAD on demand 
    resources:          DataResource[],
    resources_loaded?:  boolean,
};

export interface DataResource extends IdNameObject {
    url: string
    time_period?: DateRange,
    spatial_coverage?: any
    selected? : boolean
}

//---
export const DCResponseToDataset = (ds: any) => {
    return {
        id: ds['dataset_id'],
        name: ds['dataset_name'] || '',
        description: ds['dataset_description'] || '',
        ...DCMetaToDataset(ds['dataset_metadata']),
        // from get resources
        resources: []            
    }
}

const DCMetaToDataset = (meta: any) => {
    return {
        version:    meta['version'] || '',
        datatype:   meta['datatype'] || meta['data_type'] || '',
        license:    meta['license'],
        reference:  meta['reference'],
        limitations:meta['limitations'] || '',
        categories: meta['category_tags'] || meta['hydrology'] ? [meta['hydrology']] : [],
        is_cached:  meta['is_cached'] || false,
        source: {
            name: meta['source'] || '',
            url:  meta['source_url'] || '',
            type: meta['source_type'] || ''
        },
        time_period: meta['temporal_coverage'] ? {
            start_date: (meta['temporal_coverage']['start_time'] ?
                toTimeStamp(meta['temporal_coverage']['start_time']) : null),
            end_date: (meta['temporal_coverage']['end_time'] ?
                toTimeStamp(meta['temporal_coverage']['end_time']) : null),
        } : null,
        resource_count: meta['resource_count'] || 0,
        resource_repr:  meta['resource_repr'] || null,
        dataset_repr:   meta['dataset_repr'] || null,
        // from get info
        spatial_coverage: meta['dataset_spatial_coverage'] || null,
    }
}
