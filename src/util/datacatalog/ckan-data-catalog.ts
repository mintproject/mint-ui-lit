import { MINT_PREFERENCES } from "config";
import {
  DataResource,
  Dataset,
  DatasetQueryParameters,
} from "screens/datasets/reducers";
import { DateRange } from "screens/modeling/reducers";
import { Region } from "screens/regions/reducers";
import { IDataCatalog } from "./data-catalog-adapter";

export class CKANDataCatalog implements IDataCatalog {

  private static async request(url: string, query: any): Promise<any> {
    const res: Response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });
    return await res.json();
  }

  public async getDatasetRaw(id: string): Promise<any> {
    return await CKANDataCatalog.request(
      `${MINT_PREFERENCES.data_catalog_api}/api/action/package_show`,
      {
        id: id,
      },
    );
  }

  public async getDataset(id: string): Promise<Dataset | null> {
    const res: any = await this.getDatasetRaw(id);
    return CKANDataCatalog.convertCkanDataset(res, {});
  }


  public async getResourcesByDatasetId(id: string): Promise<DataResource[]> {
    let res: any = await CKANDataCatalog.request(
      `${MINT_PREFERENCES.data_catalog_api}/api/action/package_show`,
      {
        id: id,
      },
    );
    return res.result.resources;
  }

  public async findDatasetsByRegionDates(region: Region, dates: DateRange): Promise<Dataset[]> {
    let res: any = await CKANDataCatalog.request(
      `${MINT_PREFERENCES.data_catalog_api}/api/action/package_search`,
      {
        ext_bbox: `${region.bounding_box.xmin},${region.bounding_box.ymin},${region.bounding_box.xmax},${region.bounding_box.ymax}`,
      },
    );

    return CKANDataCatalog.convertCkanDatasets(res, {}).filter((ds) => {
      return ds.time_period.start_date >= dates.start_date && ds.time_period.end_date <= dates.end_date;
    });

  }

  public async listDatasetsByRegion(region: Region): Promise<Dataset[]> {
    let res: any = await CKANDataCatalog.request(
      `${MINT_PREFERENCES.data_catalog_api}/api/action/package_search`,
      {
        ext_bbox: `${region.bounding_box.xmin},${region.bounding_box.ymin},${region.bounding_box.xmax},${region.bounding_box.ymax}`,
      },
    );
    return CKANDataCatalog.convertCkanDatasets(res, {});
  }

  public async findDatasetByVariableNameRegionDates(
    driving_variables: string[],
    region: Region,
    dates?: DateRange,
  ): Promise<Dataset[]> {
    let datasets: Dataset[] = [];

    let dsQueryData: any = {
      ext_bbox: `${region.bounding_box.xmin},${region.bounding_box.ymin},${region.bounding_box.xmax},${region.bounding_box.ymax}`,
    };
    let datasetResponse: any = await CKANDataCatalog.request(
      `${MINT_PREFERENCES.data_catalog_api}/api/action/package_search`,
      dsQueryData,
    );
    datasetResponse.result.results = datasetResponse.result.results.filter((ckanDataset: any) => {
      const dataSetStartDate = new Date(ckanDataset.temporal_coverage_start);
      const dataSetEndDate = new Date(ckanDataset.temporal_coverage_end);
      return dataSetStartDate <= dates.end_date && dataSetEndDate >= dates.start_date;
    });

    //Filter datasets by resources datasets[].resources[] contains mint_standard_variables === variable
    for (const dataset of datasetResponse.result.results) {
      dataset.resources = dataset.resources.filter((resource: any) => {
        const resourceVariables = resource.mint_standard_variables;
        // Check if resourceVariables exists and handle different types
        if (!resourceVariables) {
          return false;
        }
        if (typeof resourceVariables === 'string') {
          return driving_variables.includes(resourceVariables);
        }
        if (Array.isArray(resourceVariables)) {
          return resourceVariables.some((variable: string) =>
            driving_variables.includes(variable)
          );
        }
        return false; // Handle any other unexpected types
      });
    }

    datasets = CKANDataCatalog.convertCkanDatasets(datasetResponse, {
      variables: driving_variables,
    } as DatasetQueryParameters);

    return datasets;
  }

  public async queryDatasetResources(
    datasetid: string,
    region: Region,
    dates?: DateRange,
    variableNames?: string[]
  ): Promise<DataResource[]> {
    const response = await this.getDatasetRaw(datasetid);
    const dataset = response.result;
    if (variableNames) {
      dataset.resources = dataset.resources.filter((resource: any) => {
        const resourceVariables = resource.mint_standard_variables;
        // Check if resourceVariables exists and handle different types
      if (!resourceVariables) {
        return false;
      }
      if (typeof resourceVariables === 'string') {
        return variableNames.includes(resourceVariables);
      }
      if (Array.isArray(resourceVariables)) {
        return resourceVariables.some((variable: string) =>
          variableNames.includes(variable)
        );
      }
        return false; // Handle any other unexpected types
      });
    }
    return CKANDataCatalog.convertCkanDataset(dataset, {}).resources;
  }

  private static convertCkanDataset = (
    ds: any,
    queryParameters: DatasetQueryParameters,
  ) => {
      let newds = {
        id: ds["id"],
        name: ds["title"] || "",
        region: "",
        variables: queryParameters.variables,
        description: ds["notes"] || "",
        version: ds["version"] || "",
        is_cached: false,
        resource_repr: null,
        dataset_repr: null,
        resources_loaded: true,
        resource_count: ds["resources"].length || 0,
        spatial_coverage: null,
        source: {},
        resources: [],
        time_period: {
          start_date: null,
          end_date: null,
        },
      } as Dataset;
      if (ds["temporal_coverage_start"]) {
        newds.time_period.start_date = new Date(ds["temporal_coverage_start"]);
      }
      if (ds["temporal_coverage_end"]) {
        newds.time_period.end_date = new Date(ds["temporal_coverage_end"]);
      }
      if ("extras" in ds) {
        for (let e of ds["extras"]) {
          if (e["key"] == "spatial") {
            newds["spatial_coverage"] = JSON.parse(e["value"]);
          }
        }
      }
      newds.resources = ds["resources"].map((r) => {
        return {
          id: r["id"],
          name: r["name"],
          url: r["name"],
          selected: true,
          spatial_coverage: newds["spatial_coverage"],
          time_period: {
            start_date: null,
            end_date: null,
          },
        };
      });
    return newds;
  }

  private static convertCkanDatasets = (
    obj: any,
    queryParameters: DatasetQueryParameters,
  ) => {
    console.log(obj);
    let datasets = obj.result.results.map((ds) => {
      return CKANDataCatalog.convertCkanDataset(ds, queryParameters);
    });
    return datasets;
  };


  private static convertCkanResources = (obj: any) => {
    let resources = [];
    obj.resources.map((row: any) => {
      let rmeta = row["resource_metadata"];
      let tcover = rmeta["temporal_coverage"];
      let scover = rmeta["spatial_coverage"];
      let tcoverstart = tcover ? new Date(tcover["start_time"]) : null;
      let tcoverend = tcover ? new Date(tcover["end_time"]) : null;

      resources.push({
        id: row["resource_id"],
        name: row["resource_name"],
        url: row["resource_data_url"],
        time_period: {
          start_date: tcoverstart,
          end_date: tcoverend,
        },
        spatial_coverage: scover,
        selected: true,
      });
    });
    return resources;
  };
}
