import { Configuration, TapisApp } from "@mintproject/modelcatalog_client";
import { DefaultReduxApi } from "./default-redux-api";

import {
  CausalDiagram,
  ConfigurationSetup,
  DataTransformation,
  DataTransformationSetup,
  DatasetSpecification,
  EmpiricalModel,
  Emulator,
  Equation,
  FundingInformation,
  GeoCoordinates,
  GeoShape,
  Grid,
  HybridModel,
  Image,
  Intervention,
  Model,
  ModelConfiguration,
  ModelConfigurationSetup,
  NumericalIndex,
  Organization,
  Parameter,
  Person,
  PointBasedGrid,
  Process,
  Region,
  SampleCollection,
  SampleExecution,
  SampleResource,
  Software,
  SoftwareConfiguration,
  SoftwareImage,
  SoftwareVersion,
  SourceCode,
  SpatialResolution,
  SpatiallyDistributedGrid,
  StandardVariable,
  TheoryGuidedModel,
  TimeInterval,
  Unit,
  Variable,
  VariablePresentation,
  Visualization,
  CatalogIdentifier,
  CoupledModel,
  ModelCategory,
  Constraint,
} from "@mintproject/modelcatalog_client";

import {
  CausalDiagramApi,
  ConfigurationSetupApi,
  DataTransformationApi,
  DataTransformationSetupApi,
  DatasetSpecificationApi,
  EmpiricalModelApi,
  EmulatorApi,
  EquationApi,
  FundingInformationApi,
  GeoCoordinatesApi,
  GeoShapeApi,
  GridApi,
  HybridModelApi,
  ImageApi,
  InterventionApi,
  ModelApi,
  ModelConfigurationApi,
  ModelConfigurationSetupApi,
  NumericalIndexApi,
  OrganizationApi,
  ParameterApi,
  PersonApi,
  PointBasedGridApi,
  ProcessApi,
  RegionApi,
  SampleCollectionApi,
  SampleExecutionApi,
  SampleResourceApi,
  SoftwareApi,
  SoftwareConfigurationApi,
  SoftwareImageApi,
  SoftwareVersionApi,
  SourceCodeApi,
  SpatialResolutionApi,
  SpatiallyDistributedGridApi,
  StandardVariableApi,
  TheoryGuidedModelApi,
  TimeIntervalApi,
  UnitApi,
  VariableApi,
  VariablePresentationApi,
  VisualizationApi,
  CatalogIdentifierApi,
  CoupledModelApi,
  ModelCategoryApi,
  ConstraintApi,
  TapisAppApi,
} from "@mintproject/modelcatalog_client";

import { CustomModelApi } from "./custom-apis/model";
import { CustomSoftwareVersionApi } from "./custom-apis/software-version";
import { CustomModelConfigurationApi } from "./custom-apis/model-configuration";
import { CustomModelConfigurationSetupApi } from "./custom-apis/model-configuration-setup";
import { CustomRegionApi } from "./custom-apis/region";
import { CustomParameterApi } from "./custom-apis/parameter";

export class UserCatalog {
  private configuration: Configuration;
  private username: string;

  public constructor(user: string, config?: Configuration) {
    this.username = user;
    if (config) this.configuration = config;
  }

  //APIs:
  private _catalogIdentifierApi: DefaultReduxApi<
    CatalogIdentifier,
    CatalogIdentifierApi
  >;
  private _causalDiagramApi: DefaultReduxApi<CausalDiagram, CausalDiagramApi>;
  private _constraintApi: DefaultReduxApi<Constraint, ConstraintApi>;
  private _configurationSetupApi: DefaultReduxApi<
    ConfigurationSetup,
    ConfigurationSetupApi
  >;
  private _coupledModelApi: DefaultReduxApi<CoupledModel, CoupledModelApi>;
  private _dataTransformationApi: DefaultReduxApi<
    DataTransformation,
    DataTransformationApi
  >;
  private _dataTransformationSetupApi: DefaultReduxApi<
    DataTransformationSetup,
    DataTransformationSetupApi
  >;
  private _datasetSpecificationApi: DefaultReduxApi<
    DatasetSpecification,
    DatasetSpecificationApi
  >;
  private _empiricalModelApi: DefaultReduxApi<
    EmpiricalModel,
    EmpiricalModelApi
  >;
  private _emulatorApi: DefaultReduxApi<Emulator, EmulatorApi>;
  private _equationApi: DefaultReduxApi<Equation, EquationApi>;
  private _fundingInformationApi: DefaultReduxApi<
    FundingInformation,
    FundingInformationApi
  >;
  private _geoCoordinatesApi: DefaultReduxApi<
    GeoCoordinates,
    GeoCoordinatesApi
  >;
  private _geoShapeApi: DefaultReduxApi<GeoShape, GeoShapeApi>;
  private _gridApi: DefaultReduxApi<Grid, GridApi>;
  private _hybridModelApi: DefaultReduxApi<HybridModel, HybridModelApi>;
  private _imageApi: DefaultReduxApi<Image, ImageApi>;
  private _interventionApi: DefaultReduxApi<Intervention, InterventionApi>;
  private _modelApi: CustomModelApi;
  private _modelCategoryApi: DefaultReduxApi<ModelCategory, ModelCategoryApi>;
  private _modelConfigurationApi: DefaultReduxApi<
    ModelConfiguration,
    ModelConfigurationApi
  >;
  private _modelConfigurationSetupApi: CustomModelConfigurationSetupApi;
  private _numericalIndexApi: DefaultReduxApi<
    NumericalIndex,
    NumericalIndexApi
  >;
  private _organizationApi: DefaultReduxApi<Organization, OrganizationApi>;
  private _parameterApi: CustomParameterApi;
  private _personApi: DefaultReduxApi<Person, PersonApi>;
  private _pointBasedGridApi: DefaultReduxApi<
    PointBasedGrid,
    PointBasedGridApi
  >;
  private _processApi: DefaultReduxApi<Process, ProcessApi>;
  private _regionApi: CustomRegionApi;
  private _sampleCollectionApi: DefaultReduxApi<
    SampleCollection,
    SampleCollectionApi
  >;
  private _sampleExecutionApi: DefaultReduxApi<
    SampleExecution,
    SampleExecutionApi
  >;
  private _sampleResourceApi: DefaultReduxApi<
    SampleResource,
    SampleResourceApi
  >;
  private _softwareApi: DefaultReduxApi<Software, SoftwareApi>;
  private _softwareConfigurationApi: DefaultReduxApi<
    SoftwareConfiguration,
    SoftwareConfigurationApi
  >;
  private _softwareImageApi: DefaultReduxApi<SoftwareImage, SoftwareImageApi>;
  private _softwareVersionApi: DefaultReduxApi<
    SoftwareVersion,
    SoftwareVersionApi
  >;
  private _sourceCodeApi: DefaultReduxApi<SourceCode, SourceCodeApi>;
  private _spatialResolutionApi: DefaultReduxApi<
    SpatialResolution,
    SpatialResolutionApi
  >;
  private _spatiallyDistributedGridApi: DefaultReduxApi<
    SpatiallyDistributedGrid,
    SpatiallyDistributedGridApi
  >;
  private _standardVariableApi: DefaultReduxApi<
    StandardVariable,
    StandardVariableApi
  >;
  private _tapisAppApi: DefaultReduxApi<TapisApp, TapisAppApi>;
  private _theoryGuidedModelApi: DefaultReduxApi<
    TheoryGuidedModel,
    TheoryGuidedModelApi
  >;
  private _timeIntervalApi: DefaultReduxApi<TimeInterval, TimeIntervalApi>;
  private _unitApi: DefaultReduxApi<Unit, UnitApi>;
  private _variableApi: DefaultReduxApi<Variable, VariableApi>;
  private _variablePresentationApi: DefaultReduxApi<
    VariablePresentation,
    VariablePresentationApi
  >;
  private _visualizationApi: DefaultReduxApi<Visualization, VisualizationApi>;

  //APIs that can be defined
  //public get catalogIdentifier () : DefaultReduxApi<CatalogIdentifier,CatalogIdentifierApi> {};
  //public get causalDiagram () : DefaultReduxApi<CausalDiagram,CausalDiagramApi> {};
  //public get configurationSetup () : DefaultReduxApi<ConfigurationSetup,ConfigurationSetupApi> {};
  //public get coupledModel () : DefaultReduxApi<CoupledModel,CoupledModelApi> {};

  public get constraint(): DefaultReduxApi<Constraint, ConstraintApi> {
    if (!this._constraintApi)
      this._constraintApi = new DefaultReduxApi<Constraint, ConstraintApi>(
        ConstraintApi,
        this.username,
        this.configuration
      );
    return this._constraintApi;
  }

  public get dataTransformation(): DefaultReduxApi<
    DataTransformation,
    DataTransformationApi
  > {
    if (!this._dataTransformationApi)
      this._dataTransformationApi = new DefaultReduxApi<
        DataTransformation,
        DataTransformationApi
      >(DataTransformationApi, this.username, this.configuration);
    return this._dataTransformationApi;
  }

  public get dataTransformationSetup(): DefaultReduxApi<
    DataTransformationSetup,
    DataTransformationSetupApi
  > {
    if (!this._dataTransformationSetupApi)
      this._dataTransformationSetupApi = new DefaultReduxApi<
        DataTransformationSetup,
        DataTransformationSetupApi
      >(DataTransformationSetupApi, this.username, this.configuration);
    return this._dataTransformationSetupApi;
  }

  public get datasetSpecification(): DefaultReduxApi<
    DatasetSpecification,
    DatasetSpecificationApi
  > {
    if (!this._datasetSpecificationApi)
      this._datasetSpecificationApi = new DefaultReduxApi<
        DatasetSpecification,
        DatasetSpecificationApi
      >(DatasetSpecificationApi, this.username, this.configuration);
    return this._datasetSpecificationApi;
  }

  //public get empiricalModel () : DefaultReduxApi<EmpiricalModel,EmpiricalModelApi> {};
  //public get emulator () : DefaultReduxApi<Emulator,EmulatorApi> {};
  //public get equation () : DefaultReduxApi<Equation,EquationApi> {};
  public get fundingInformation(): DefaultReduxApi<
    FundingInformation,
    FundingInformationApi
  > {
    if (!this._fundingInformationApi)
      this._fundingInformationApi = new DefaultReduxApi<
        FundingInformation,
        FundingInformationApi
      >(FundingInformationApi, this.username, this.configuration);
    return this._fundingInformationApi;
  }

  //public get geoCoordinates () : DefaultReduxApi<GeoCoordinates,GeoCoordinatesApi> {};
  public get geoShape(): DefaultReduxApi<GeoShape, GeoShapeApi> {
    if (!this._geoShapeApi)
      this._geoShapeApi = new DefaultReduxApi<GeoShape, GeoShapeApi>(
        GeoShapeApi,
        this.username,
        this.configuration
      );
    return this._geoShapeApi;
  }

  public get grid(): DefaultReduxApi<Grid, GridApi> {
    if (!this._gridApi)
      this._gridApi = new DefaultReduxApi<Grid, GridApi>(
        GridApi,
        this.username,
        this.configuration
      );
    return this._gridApi;
  }

  //public get hybridModel () : DefaultReduxApi<HybridModel,HybridModelApi> {};
  public get image(): DefaultReduxApi<Image, ImageApi> {
    if (!this._imageApi)
      this._imageApi = new DefaultReduxApi<Image, ImageApi>(
        ImageApi,
        this.username,
        this.configuration
      );
    return this._imageApi;
  }

  public get intervention(): DefaultReduxApi<Intervention, InterventionApi> {
    if (!this._interventionApi)
      this._interventionApi = new DefaultReduxApi<
        Intervention,
        InterventionApi
      >(InterventionApi, this.username, this.configuration);
    return this._interventionApi;
  }

  public get model(): CustomModelApi {
    if (!this._modelApi) {
      this._modelApi = new CustomModelApi(
        ModelApi,
        this.username,
        this.configuration
      );
    }
    return this._modelApi;
  }

  public get modelCategory(): DefaultReduxApi<ModelCategory, ModelCategoryApi> {
    if (!this._modelCategoryApi)
      this._modelCategoryApi = new DefaultReduxApi<
        ModelCategory,
        ModelCategoryApi
      >(ModelCategoryApi, this.username, this.configuration);
    return this._modelCategoryApi;
  }

  public get modelConfiguration(): DefaultReduxApi<
    ModelConfiguration,
    ModelConfigurationApi
  > {
    if (!this._modelConfigurationApi)
      this._modelConfigurationApi = new CustomModelConfigurationApi(
        ModelConfigurationApi,
        this.username,
        this.configuration
      );
    return this._modelConfigurationApi;
  }

  public get modelConfigurationSetup(): CustomModelConfigurationSetupApi {
    if (!this._modelConfigurationSetupApi)
      this._modelConfigurationSetupApi = new CustomModelConfigurationSetupApi(
        ModelConfigurationSetupApi,
        this.username,
        this.configuration
      );
    return this._modelConfigurationSetupApi;
  }

  public get numericalIndex(): DefaultReduxApi<
    NumericalIndex,
    NumericalIndexApi
  > {
    if (!this._numericalIndexApi)
      this._numericalIndexApi = new DefaultReduxApi<
        NumericalIndex,
        NumericalIndexApi
      >(NumericalIndexApi, this.username, this.configuration);
    return this._numericalIndexApi;
  }

  public get organization(): DefaultReduxApi<Organization, OrganizationApi> {
    if (!this._organizationApi)
      this._organizationApi = new DefaultReduxApi<
        Organization,
        OrganizationApi
      >(OrganizationApi, this.username, this.configuration);
    return this._organizationApi;
  }

  public get parameter(): CustomParameterApi {
    if (!this._parameterApi)
      this._parameterApi = new CustomParameterApi(
        ParameterApi,
        this.username,
        this.configuration
      );
    return this._parameterApi;
  }

  public get person(): DefaultReduxApi<Person, PersonApi> {
    if (!this._personApi)
      this._personApi = new DefaultReduxApi<Person, PersonApi>(
        PersonApi,
        this.username,
        this.configuration
      );
    return this._personApi;
  }

  //public get pointBasedGrid () : DefaultReduxApi<PointBasedGrid,PointBasedGridApi> {};
  public get process(): DefaultReduxApi<Process, ProcessApi> {
    if (!this._processApi)
      this._processApi = new DefaultReduxApi<Process, ProcessApi>(
        ProcessApi,
        this.username,
        this.configuration
      );
    return this._processApi;
  }

  public get region(): CustomRegionApi {
    if (!this._regionApi)
      this._regionApi = new CustomRegionApi(
        RegionApi,
        this.username,
        this.configuration
      );
    return this._regionApi;
  }

  public get sampleCollection(): DefaultReduxApi<
    SampleCollection,
    SampleCollectionApi
  > {
    if (!this._sampleCollectionApi)
      this._sampleCollectionApi = new DefaultReduxApi<
        SampleCollection,
        SampleCollectionApi
      >(SampleCollectionApi, this.username, this.configuration);
    return this._sampleCollectionApi;
  }

  //public get sampleExecution () : DefaultReduxApi<SampleExecution,SampleExecutionApi> {};
  public get sampleResource(): DefaultReduxApi<
    SampleResource,
    SampleResourceApi
  > {
    if (!this._sampleResourceApi)
      this._sampleResourceApi = new DefaultReduxApi<
        SampleResource,
        SampleResourceApi
      >(SampleResourceApi, this.username, this.configuration);
    return this._sampleResourceApi;
  }

  //public get software () : DefaultReduxApi<Software,SoftwareApi> {};
  //public get softwareConfiguration () : DefaultReduxApi<SoftwareConfiguration,SoftwareConfigurationApi> {};
  public get softwareImage(): DefaultReduxApi<SoftwareImage, SoftwareImageApi> {
    if (!this._softwareImageApi)
      this._softwareImageApi = new DefaultReduxApi<
        SoftwareImage,
        SoftwareImageApi
      >(SoftwareImageApi, this.username, this.configuration);
    return this._softwareImageApi;
  }

  public get softwareVersion(): DefaultReduxApi<
    SoftwareVersion,
    SoftwareVersionApi
  > {
    if (!this._softwareVersionApi)
      this._softwareVersionApi = new CustomSoftwareVersionApi(
        SoftwareVersionApi,
        this.username,
        this.configuration
      );
    return this._softwareVersionApi;
  }

  public get sourceCode(): DefaultReduxApi<SourceCode, SourceCodeApi> {
    if (!this._sourceCodeApi)
      this._sourceCodeApi = new DefaultReduxApi<SourceCode, SourceCodeApi>(
        SourceCodeApi,
        this.username,
        this.configuration
      );
    return this._sourceCodeApi;
  }

  //public get spatialResolution () : DefaultReduxApi<SpatialResolution,SpatialResolutionApi> {};
  //public get spatiallyDistributedGrid () : DefaultReduxApi<SpatiallyDistributedGrid, SpatiallyDistributedGridApi> {};
  public get standardVariable(): DefaultReduxApi<
    StandardVariable,
    StandardVariableApi
  > {
    if (!this._standardVariableApi)
      this._standardVariableApi = new DefaultReduxApi<
        StandardVariable,
        StandardVariableApi
      >(StandardVariableApi, this.username, this.configuration);
    return this._standardVariableApi;
  }

  public get tapisApp(): DefaultReduxApi<TapisApp, TapisAppApi> {
    if (!this._tapisAppApi)
      this._tapisAppApi = new DefaultReduxApi<TapisApp, TapisAppApi>(
        TapisAppApi,
        this.username,
        this.configuration
      );
    return this._tapisAppApi;
  }

  //public get theoryGuidedModel () : DefaultReduxApi<TheoryGuidedModel,TheoryGuidedModelApi> {};
  public get timeInterval(): DefaultReduxApi<TimeInterval, TimeIntervalApi> {
    if (!this._timeIntervalApi)
      this._timeIntervalApi = new DefaultReduxApi<
        TimeInterval,
        TimeIntervalApi
      >(TimeIntervalApi, this.username, this.configuration);
    return this._timeIntervalApi;
  }

  public get unit(): DefaultReduxApi<Unit, UnitApi> {
    if (!this._unitApi)
      this._unitApi = new DefaultReduxApi<Unit, UnitApi>(
        UnitApi,
        this.username,
        this.configuration
      );
    return this._unitApi;
  }

  //public get variable () : DefaultReduxApi<Variable,VariableApi> {};
  public get variablePresentation(): DefaultReduxApi<
    VariablePresentation,
    VariablePresentationApi
  > {
    if (!this._variablePresentationApi)
      this._variablePresentationApi = new DefaultReduxApi<
        VariablePresentation,
        VariablePresentationApi
      >(VariablePresentationApi, this.username, this.configuration);
    return this._variablePresentationApi;
  }

  public get visualization(): DefaultReduxApi<Visualization, VisualizationApi> {
    if (!this._visualizationApi)
      this._visualizationApi = new DefaultReduxApi<
        Visualization,
        VisualizationApi
      >(VisualizationApi, this.username, this.configuration);
    return this._visualizationApi;
  }
}
