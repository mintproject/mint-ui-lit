// Patch the SDK's models index so internal API call sites use the patched
// serializer/deserializer. The internal .js modules access functions via
// `require("../models").DatasetSpecificationToJSON`, so we mutate that exact
// object. Patching the top-level package index does NOT propagate, because the
// top-level uses __export copies.
const models = require("@mintproject/modelcatalog_client/dist/models");

const originalToJSON = models.DatasetSpecificationToJSON;
const originalFromJSONTyped = models.DatasetSpecificationFromJSONTyped;
const originalFromJSON = models.DatasetSpecificationFromJSON;

function patchedToJSON(value: any): any {
  const out = originalToJSON(value);
  if (out && value && value.isOptional !== undefined && value.isOptional !== null) {
    out.isOptional = value.isOptional;
  }
  return out;
}

function patchedFromJSONTyped(json: any, ignoreDiscriminator: boolean): any {
  const ds = originalFromJSONTyped(json, ignoreDiscriminator);
  if (ds && json && json.isOptional !== undefined && json.isOptional !== null) {
    ds.isOptional = json.isOptional;
  }
  return ds;
}

function patchedFromJSON(json: any): any {
  return patchedFromJSONTyped(json, false);
}

models.DatasetSpecificationToJSON = patchedToJSON;
models.DatasetSpecificationFromJSONTyped = patchedFromJSONTyped;
models.DatasetSpecificationFromJSON = patchedFromJSON;
