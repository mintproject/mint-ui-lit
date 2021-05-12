import { Reducer } from "redux";
import { RootAction } from "app/store";
import { MODEL_CATALOG_ADD, MODEL_CATALOG_DELETE } from './actions'

import { CausalDiagram, ConfigurationSetup, DataTransformation, DataTransformationSetup, DatasetSpecification,
         EmpiricalModel, Emulator, Equation, FundingInformation, GeoCoordinates, GeoShape, Grid, HybridModel,
         Image, Intervention, Model, ModelConfiguration, ModelConfigurationSetup, NumericalIndex, Organization,
         Parameter, Person, PointBasedGrid, Process, Region, SampleCollection, SampleExecution, SampleResource,
         Software, SoftwareConfiguration, SoftwareImage, SoftwareVersion, SourceCode, SpatialResolution,
         SpatiallyDistributedGrid, StandardVariable, TheoryGuidedModel, TimeInterval, Unit, Variable,
         VariablePresentation, Visualization, CatalogIdentifier, CoupledModel, ModelCategory, Constraint
        } from '@mintproject/modelcatalog_client';
import { IdMap } from 'app/reducers'

export type ModelCatalogTypes = keyof ModelCatalogState;

//Needs to be updated if we add new classes to the ontology.
export interface ModelCatalogState {
    catalogidentifier:          IdMap<CatalogIdentifier>;
    causaldiagram:              IdMap<CausalDiagram>;
    configurationsetup:         IdMap<ConfigurationSetup>;
    coupledmodel:               IdMap<CoupledModel>;
    constraint:                 IdMap<Constraint>;
    datatransformation:         IdMap<DataTransformation>;
    datatransformationsetup:    IdMap<DataTransformationSetup>;
    datasetspecification:       IdMap<DatasetSpecification>;
    empiricalmodel:             IdMap<EmpiricalModel>;
    emulator:                   IdMap<Emulator>;
    equation:                   IdMap<Equation>;
    fundinginformation:         IdMap<FundingInformation>;
    geocoordinates:             IdMap<GeoCoordinates>;
    geoshape:                   IdMap<GeoShape>;
    grid:                       IdMap<Grid>;
    hybridmodel:                IdMap<HybridModel>;
    image:                      IdMap<Image>;
    intervention:               IdMap<Intervention>;
    model:                      IdMap<Model>;
    modelcategory:              IdMap<ModelCategory>;
    modelconfiguration:         IdMap<ModelConfiguration>;
    modelconfigurationsetup:    IdMap<ModelConfigurationSetup>;
    numericalindex:             IdMap<NumericalIndex>;
    organization:               IdMap<Organization>;
    parameter:                  IdMap<Parameter>;
    person:                     IdMap<Person>;
    pointbasedgrid:             IdMap<PointBasedGrid>;
    process:                    IdMap<Process>;
    region:                     IdMap<Region>;
    samplecollection:           IdMap<SampleCollection>;
    sampleexecution:            IdMap<SampleExecution>;
    sampleresource:             IdMap<SampleResource>;
    software:                   IdMap<Software>;
    softwareconfiguration:      IdMap<SoftwareConfiguration>;
    softwareimage:              IdMap<SoftwareImage>;
    softwareversion:            IdMap<SoftwareVersion>;
    sourcecode:                 IdMap<SourceCode>;
    spatialresolution:          IdMap<SpatialResolution>;
    spatiallydistributedgrid:   IdMap<SpatiallyDistributedGrid>;
    standardvariable:           IdMap<StandardVariable>;
    theoryguidedmodel:          IdMap<TheoryGuidedModel>;
    timeinterval:               IdMap<TimeInterval>;
    unit:                       IdMap<Unit>;
    variable:                   IdMap<Variable>;
    variablepresentation:       IdMap<VariablePresentation>;
    visualization:              IdMap<Visualization>;
}

const INITIAL_STATE: ModelCatalogState = { 
    catalogidentifier:          {} as IdMap<CatalogIdentifier>,
    causaldiagram:              {} as IdMap<CausalDiagram>,
    configurationsetup:         {} as IdMap<ConfigurationSetup>,
    coupledmodel:               {} as IdMap<CoupledModel>,
    constraint:                 {} as IdMap<Constraint>,
    datatransformation:         {} as IdMap<DataTransformation>,
    datatransformationsetup:    {} as IdMap<DataTransformationSetup>,
    datasetspecification:       {} as IdMap<DatasetSpecification>,
    empiricalmodel:             {} as IdMap<EmpiricalModel>,
    emulator:                   {} as IdMap<Emulator>,
    equation:                   {} as IdMap<Equation>,
    fundinginformation:         {} as IdMap<FundingInformation>,
    geocoordinates:             {} as IdMap<GeoCoordinates>,
    geoshape:                   {} as IdMap<GeoShape>,
    grid:                       {} as IdMap<Grid>,
    hybridmodel:                {} as IdMap<HybridModel>,
    image:                      {} as IdMap<Image>,
    intervention:               {} as IdMap<Intervention>,
    model:                      {} as IdMap<Model>,
    modelcategory:              {} as IdMap<ModelCategory>,
    modelconfiguration:         {} as IdMap<ModelConfiguration>,
    modelconfigurationsetup:    {} as IdMap<ModelConfigurationSetup>,
    numericalindex:             {} as IdMap<NumericalIndex>,
    organization:               {} as IdMap<Organization>,
    parameter:                  {} as IdMap<Parameter>,
    person:                     {} as IdMap<Person>,
    pointbasedgrid:             {} as IdMap<PointBasedGrid>,
    process:                    {} as IdMap<Process>,
    region:                     {} as IdMap<Region>,
    samplecollection:           {} as IdMap<SampleCollection>,
    sampleexecution:            {} as IdMap<SampleExecution>,
    sampleresource:             {} as IdMap<SampleResource>,
    software:                   {} as IdMap<Software>,
    softwareconfiguration:      {} as IdMap<SoftwareConfiguration>,
    softwareimage:              {} as IdMap<SoftwareImage>,
    softwareversion:            {} as IdMap<SoftwareVersion>,
    sourcecode:                 {} as IdMap<SourceCode>,
    spatialresolution:          {} as IdMap<SpatialResolution>,
    spatiallydistributedgrid:   {} as IdMap<SpatiallyDistributedGrid>,
    standardvariable:           {} as IdMap<StandardVariable>,
    theoryguidedmodel:          {} as IdMap<TheoryGuidedModel>,
    timeinterval:               {} as IdMap<TimeInterval>,
    unit:                       {} as IdMap<Unit>,
    variable:                   {} as IdMap<Variable>,
    variablepresentation:       {} as IdMap<VariablePresentation>,
    visualization:              {} as IdMap<Visualization>
} as ModelCatalogState;

const modelCatalog: Reducer<ModelCatalogState, RootAction> = (state = INITIAL_STATE, action) => {
    let newState : ModelCatalogState;
    let newMap : IdMap<any>;
    switch (action.type) {
        case MODEL_CATALOG_ADD:
            newState = { ...state };
            newMap = { ...state[action.kind], ...action.payload };
            newState[action.kind] = newMap;
            return newState;
        case MODEL_CATALOG_DELETE:
            newState = { ...state };
            newMap = { ...state[action.kind] };
            delete newMap[action.uri];
            newState[action.kind] = newMap;
            return newState;
        default:
            return state;
    }
}

export default modelCatalog;
