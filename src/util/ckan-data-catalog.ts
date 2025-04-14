import { MINT_PREFERENCES } from "config";
import {
  DataResource,
  Dataset,
  DatasetQueryParameters,
} from "screens/datasets/reducers";
import { DateRange } from "screens/modeling/reducers";
import { Region } from "screens/regions/reducers";
import { BaseDataCatalog, DatasetQuery } from "./data-catalog-adapter";

export class CKANDataCatalog extends BaseDataCatalog {
  public async findDataset(id: string): Promise<Dataset | null> {
    // Implement CKAN-specific dataset search
    let res: any = await BaseDataCatalog.fetchJson(
      `${MINT_PREFERENCES.data_catalog_api}/api/action/package_search`,
      {
        fq: "id:" + id,
      },
    );
    let dses = CKANDataCatalog.convertCkanDatasets(res, {});
    return dses.length > 0 ? dses[0] : null;
  }

  public async findDatasetByVariableName(
    driving_variables: string[],
    region: Region,
    dates?: DateRange,
  ): Promise<Dataset[]> {
    let datasets: Dataset[] = [];

    if (driving_variables.length === 0) {
      let dsQueryData: any = {
        ext_bbox: `${region.bounding_box.xmin},${region.bounding_box.ymin},${region.bounding_box.xmax},${region.bounding_box.ymax}`,
      };
      let res: any = await BaseDataCatalog.fetchJson(
        `${MINT_PREFERENCES.data_catalog_api}/api/action/package_search`,
        dsQueryData,
      );
      datasets = CKANDataCatalog.convertCkanDatasets(res, {
        variables: driving_variables,
      } as DatasetQueryParameters);
    }

    for (const variable of driving_variables) {
      let dsQueryData: any = {
        fq: "tags:stdvar." + variable,
        ext_bbox: `${region.bounding_box.xmin},${region.bounding_box.ymin},${region.bounding_box.xmax},${region.bounding_box.ymax}`,
      };

      let res: any = await BaseDataCatalog.fetchJson(
        `${MINT_PREFERENCES.data_catalog_api}/api/action/package_search`,
        dsQueryData,
      );
      if (!!res && res.result && res.result.count > 0) {
        datasets = [
          ...datasets,
          ...CKANDataCatalog.convertCkanDatasets(res, {
            variables: driving_variables,
          } as DatasetQueryParameters),
        ];
      }
    }
    return datasets;
  }

  public async queryDatasetResources(
    datasetid: string,
    region: Region,
    dates?: DateRange,
  ): Promise<DataResource[]> {
    let resQueryData = {
      fq: "id:" + datasetid,
    };
    let obj: any = await BaseDataCatalog.fetchJson(
      `${MINT_PREFERENCES.data_catalog_api}/api/action/package_search`,
      resQueryData,
    );
    let dses = CKANDataCatalog.convertCkanDatasets(obj, {});
    return dses.length > 0 ? dses[0].resources : [];
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
      } as Dataset;
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
    let datasets = obj.result.results.map((ds) => {
      return CKANDataCatalog.convertCkanDataset(ds, queryParameters);
    });
    return datasets;
  };
}
