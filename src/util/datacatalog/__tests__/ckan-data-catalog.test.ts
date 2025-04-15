import { CKANDataCatalog } from "../ckan-data-catalog";
import { Region } from "screens/regions/reducers";
import { DateRange } from "screens/modeling/reducers";
import { Dataset, DataResource } from "screens/datasets/reducers";
import { MINT_PREFERENCES } from "config";

// Mock fetch
(global as any).fetch = jest.fn();

// Mock MINT_PREFERENCES
jest.mock("config", () => ({
  MINT_PREFERENCES: {
    data_catalog_api: "http://test-api",
    data_catalog_type: "CKAN"
  }
}));

describe("CKANDataCatalog", () => {
  let catalog: CKANDataCatalog;
  const mockRegion: Region = {
    id: "test-region",
    name: "Test Region",
    category_id: "test-category",
    geometries: [],
    bounding_box: {
      xmin: -180,
      ymin: -90,
      xmax: 180,
      ymax: 90
    }
  };

  const mockDateRange: DateRange = {
    start_date: new Date("2020-01-01"),
    end_date: new Date("2020-12-31")
  };

  beforeEach(() => {
    catalog = new CKANDataCatalog();
    (global as any).fetch.mockClear();
  });

  describe("Dataset Conversion", () => {
    it("should properly convert a CKAN dataset with all fields", async () => {
      const mockDataset = {
        result: {
          author: "",
          author_email: "",
          creator_user_id: "e59bc0b9-e11b-4461-8c93-2081716e091b",
          id: "b61d9e2c-6ead-4724-b52e-4b8c69482edf",
          isopen: false,
          license_id: "notspecified",
          license_title: "License not specified",
          maintainer: "",
          maintainer_email: "",
          metadata_created: "2025-04-11T13:38:39.368688",
          metadata_modified: "2025-04-14T15:47:11.380273",
          name: "test",
          notes: "",
          num_resources: 1,
          num_tags: 1,
          organization: {
            id: "1f713240-fd5a-45dc-805a-4d73aa26c547",
            name: "test",
            title: "test",
            type: "organization",
            description: "test",
            image_url: "",
            created: "2025-04-09T14:14:32.258602",
            is_organization: true,
            approval_status: "approved",
            state: "active"
          },
          owner_org: "1f713240-fd5a-45dc-805a-4d73aa26c547",
          private: false,
          state: "active",
          temporal_coverage_end: "2020-10-23",
          temporal_coverage_start: "2000-01-01",
          title: "dataset",
          type: "dataset",
          url: "",
          version: "",
          resources: [
            {
              cache_last_updated: null,
              cache_url: null,
              created: "2025-04-11T13:38:43.867483",
              datastore_active: false,
              description: "",
              format: "",
              hash: "",
              id: "7fc45eb5-b0fb-4e82-85be-bb4af4360f70",
              last_modified: null,
              metadata_modified: "2025-04-14T15:39:13.623878",
              mimetype: null,
              mimetype_inner: null,
              mint_standard_variables: "groundwater_well__recharge_volume_flux",
              name: "test resource",
              package_id: "b61d9e2c-6ead-4724-b52e-4b8c69482edf",
              position: 0,
              resource_type: null,
              size: null,
              state: "active",
              url: "",
              url_type: null
            }
          ],
          tags: [
            {
              display_name: "test",
              id: "09d6ce3b-8db4-49eb-af11-6b24e36182ed",
              name: "test",
              state: "active",
              vocabulary_id: null
            }
          ],
          groups: [],
          relationships_as_subject: [],
          relationships_as_object: []
        }
      };

      (global as any).fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockDataset)
      });

      const result = await catalog.getDataset("b61d9e2c-6ead-4724-b52e-4b8c69482edf");

      expect(result).toBeDefined();
      expect(result?.id).toBe("b61d9e2c-6ead-4724-b52e-4b8c69482edf");
      expect(result?.name).toBe("dataset");
      expect(result?.description).toBe("");
      expect(result?.version).toBe("");
      expect(result?.resource_count).toBe(1);
      expect(result?.time_period.start_date).toEqual(new Date("2000-01-01"));
      expect(result?.time_period.end_date).toEqual(new Date("2020-10-23"));
      expect(result?.resources).toHaveLength(1);
      expect(result?.resources[0].id).toBe("7fc45eb5-b0fb-4e82-85be-bb4af4360f70");
      expect(result?.resources[0].name).toBe("test resource");
    });

    it("should handle missing temporal coverage dates", async () => {
      const mockDataset = {
        result: {
          id: "test-dataset",
          title: "Test Dataset",
          notes: "Test Description",
          version: "1.0",
          resources: []
        }
      };

      (global as any).fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockDataset)
      });

      const result = await catalog.getDataset("test-dataset");

      expect(result?.time_period.start_date).toBeNull();
      expect(result?.time_period.end_date).toBeNull();
    });

    it("should handle missing resources array", async () => {
      const mockDataset = {
        result: {
          id: "test-dataset",
          title: "Test Dataset",
          notes: "Test Description",
          version: "1.0"
        }
      };

      (global as any).fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockDataset)
      });

      const result = await catalog.getDataset("test-dataset");

      expect(result?.resources).toHaveLength(0);
      expect(result?.resource_count).toBe(0);
    });
  });

  describe("getDataset", () => {
    it("should return a dataset when found", async () => {
      const mockDataset = {
        result: {
          id: "test-dataset",
          title: "Test Dataset",
          notes: "Test Description",
          version: "1.0",
          resources: [],
          temporal_coverage_start: "2020-01-01",
          temporal_coverage_end: "2020-12-31",
        },
      };

      (global as any).fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockDataset),
      });

      const result = await catalog.getDataset("test-dataset");
      expect(result).toBeDefined();
      expect(result?.id).toBe("test-dataset");
      expect(result?.name).toBe("Test Dataset");
    });

    it("should return null when dataset not found", async () => {
      (global as any).fetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ result: null }),
      });

      const result = await catalog.getDataset("non-existent-dataset");
      expect(result).toBeNull();
    });
  });

  describe("listDatasetsByRegion", () => {
    it("should return datasets for a given region", async () => {
      const mockResponse = {
        result: {
          results: [
            {
              id: "test-dataset-1",
              title: "Test Dataset 1",
              notes: "Test Description 1",
              version: "1.0",
              resources: [],
              temporal_coverage_start: "2020-01-01",
              temporal_coverage_end: "2020-12-31",
            },
          ],
        },
      };

      (global as any).fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      const result = await catalog.listDatasetsByRegion(mockRegion);
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe("test-dataset-1");
    });
  });

  describe("listDatasetsByVariableNameRegionDates", () => {
    it("should return datasets filtered by variables and date range", async () => {
      const mockResponse = {
        result: {
          results: [
            {
              id: "test-dataset-1",
              title: "Test Dataset 1",
              notes: "Test Description 1",
              version: "1.0",
              resources: [
                {
                  id: "resource-1",
                  name: "Resource 1",
                  mint_standard_variables: ["temperature"],
                },
                {
                  id: "resource-2",
                  name: "Resource 2",
                  mint_standard_variables: ["temperature", "precipitation"],
                },
                {
                  id: "resource-3",
                  name: "Resource 3",
                  mint_standard_variables: ["precipitation", "wind"],
                },
              ],
              temporal_coverage_start: "2020-01-01",
              temporal_coverage_end: "2020-12-31",
            },
            {
              id: "test-dataset-2",
              title: "Test Dataset 2",
              notes: "Test Description 2",
              version: "1.0",
              resources: [],
            },
            {
              id: "test-dataset-3",
              title: "Test Dataset 3",
              notes: "Test Description 3",
              version: "1.0",
              resources: [
                {
                  id: "resource-4",
                  name: "Resource 4",
                  mint_standard_variables: ["precipitation", "wind"],
                },
              ],
            },
          ],
        },
      };

      (global as any).fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      const result = await catalog.listDatasetsByVariableNameRegionDates(
        ["temperature"],
        mockRegion,
        mockDateRange
      );

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe("test-dataset-1");
    });
  });


  describe("listResourcesByDataset", () => {
    it("should return resources for a dataset", async () => {
      const mockResponse = {
        result: {
          id: "test-dataset",
          title: "Test Dataset",
          notes: "Test Description",
          version: "1.0",
          resources: [
            {
              id: "resource-1",
              name: "Resource 1",
              mint_standard_variables: ["temperature"],
            },
          ],
          temporal_coverage_start: "2020-01-01",
          temporal_coverage_end: "2020-12-31",
        },
      };

      (global as any).fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      const result = await catalog.listResourcesByDataset(
        "test-dataset",
        mockRegion,
        mockDateRange,
        ["temperature"]
      );

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe("resource-1");
    });
  });

  describe("convertCkanDataset", () => {
    it("should convert a CKAN dataset to our Dataset format", () => {
      const ckanDataset = {
        author: "",
        author_email: "",
        creator_user_id: "e59bc0b9-e11b-4461-8c93-2081716e091b",
        id: "b61d9e2c-6ead-4724-b52e-4b8c69482edf",
        isopen: false,
        license_id: "notspecified",
        license_title: "License not specified",
        maintainer: "",
        maintainer_email: "",
        metadata_created: "2025-04-11T13:38:39.368688",
        metadata_modified: "2025-04-14T15:47:11.380273",
        name: "test",
        notes: "",
        num_resources: 1,
        num_tags: 1,
        organization: {
          id: "1f713240-fd5a-45dc-805a-4d73aa26c547",
          name: "test",
          title: "test",
          type: "organization",
          description: "test",
          image_url: "",
          created: "2025-04-09T14:14:32.258602",
          is_organization: true,
          approval_status: "approved",
          state: "active"
        },
        owner_org: "1f713240-fd5a-45dc-805a-4d73aa26c547",
        private: false,
        state: "active",
        temporal_coverage_end: "2020-10-23",
        temporal_coverage_start: "2000-01-01",
        title: "dataset",
        type: "dataset",
        url: "",
        version: "",
        resources: [
          {
            cache_last_updated: null,
            cache_url: null,
            created: "2025-04-11T13:38:43.867483",
            datastore_active: false,
            description: "",
            format: "",
            hash: "",
            id: "7fc45eb5-b0fb-4e82-85be-bb4af4360f70",
            last_modified: null,
            metadata_modified: "2025-04-14T15:39:13.623878",
            mimetype: null,
            mimetype_inner: null,
            mint_standard_variables: "groundwater_well__recharge_volume_flux",
            name: "test resource",
            package_id: "b61d9e2c-6ead-4724-b52e-4b8c69482edf",
            position: 0,
            resource_type: null,
            size: null,
            state: "active",
            url: "https://example.com/resource",
            url_type: null
          }
        ],
        tags: [
          {
            display_name: "test",
            id: "09d6ce3b-8db4-49eb-af11-6b24e36182ed",
            name: "test",
            state: "active",
            vocabulary_id: null
          }
        ],
        groups: [],
        relationships_as_subject: [],
        relationships_as_object: []
      };

      const result = CKANDataCatalog.convertCkanDataset(ckanDataset, {});

      expect(result).toBeDefined();
      expect(result.id).toBe("b61d9e2c-6ead-4724-b52e-4b8c69482edf");
      expect(result.name).toBe("dataset");
      expect(result.description).toBe("");
      expect(result.version).toBe("");
      expect(result.resource_count).toBe(1);
      expect(result.time_period.start_date).toEqual(new Date("2000-01-01"));
      expect(result.time_period.end_date).toEqual(new Date("2020-10-23"));
      expect(result.resources).toHaveLength(1);
      expect(result.resources[0].id).toBe("7fc45eb5-b0fb-4e82-85be-bb4af4360f70");
      expect(result.resources[0].name).toBe("test resource");
      expect(result.resources[0].url).toBe("https://example.com/resource");
    });

    it("should handle missing temporal coverage dates", () => {
      const ckanDataset = {
        id: "test-dataset",
        title: "Test Dataset",
        notes: "Test Description",
        version: "1.0",
        resources: []
      };

      const result = CKANDataCatalog.convertCkanDataset(ckanDataset, {});

      expect(result.time_period.start_date).toBeNull();
      expect(result.time_period.end_date).toBeNull();
    });

    it("should handle missing resources array", () => {
      const ckanDataset = {
        id: "test-dataset",
        title: "Test Dataset",
        notes: "Test Description",
        version: "1.0"
      };

      const result = CKANDataCatalog.convertCkanDataset(ckanDataset, {});

      expect(result.resources).toHaveLength(0);
      expect(result.resource_count).toBe(0);
    });
  });
});
