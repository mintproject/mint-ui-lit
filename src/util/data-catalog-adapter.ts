import { MintPreferences } from 'app/reducers';
import { getDatasetsFromDCResponse } from 'screens/datasets/actions';
import { Dataset } from 'screens/datasets/reducers';

import * as mintConfig from 'config/config.json';
const prefs = mintConfig["default"] as MintPreferences;

export interface DatasetQuery {
    search_operators?: string;
    dataset_names?: string[];
    dataset_ids?:   string[];
    standard_variable_ids?:  string[];
    standard_variable_names__in?: string[];
    spatial_coverage__intersects?: any;
    start_time?: Date;
    end_time?: Date;
    end_time__lte?: string;
    start_time__gte?: string;
    limit?: number;
}

export class DataCatalogAdapter {
    private static server : string = prefs.data_catalog_api;

    public static async findDataset (query:DatasetQuery) : Promise<Dataset[]> {
        if (query.start_time) {
            query.start_time__gte = query.start_time.toISOString().replace(/\.\d{3}Z$/,'');
            delete query.start_time;
        }
        if (query.end_time) {
            query.end_time__lte = query.end_time.toISOString().replace(/\.\d{3}Z$/,'');
            delete query.end_time;
        }

        query.limit = 100;

        let res : Response = await fetch(DataCatalogAdapter.server + "/datasets/find", {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(query)
        })
        if (res && res.json) {
            let obj : any = await res.json();
            return getDatasetsFromDCResponse(obj, {});
        }
    }
}
