import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState } from "../../app/store";
import { Model, ModelParameter } from "./reducers";

import { Model as MCModel, ModelConfigurationSetup, DatasetSpecification, SoftwareImage, ModelConfiguration, SoftwareVersion } from '@mintproject/modelcatalog_client';
import { sortByPosition, getLabel } from 'model-catalog-api/util';

import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';

import { IdMap } from "app/reducers";

export const MODELS_VARIABLES_QUERY = 'MODELS_VARIABLES_QUERY';

export interface ModelsActionVariablesQuery extends Action<'MODELS_VARIABLES_QUERY'> { 
    variables: string[], 
    models: Model[] | null,
    loading: boolean
};

export type ModelsAction = ModelsActionVariablesQuery;

const parameterToParam = (parameter) => {
    let param: ModelParameter =  {
        id: parameter.id,
        name: parameter.label ? parameter.label[0] : "",
        type: parameter.hasDataType ? parameter.hasDataType[0] : "",
        min: parameter.hasMinimumAcceptedValue ? parameter.hasMinimumAcceptedValue[0] : "",
        max: parameter.hasMaximumAcceptedValue ? parameter.hasMaximumAcceptedValue[0] : "",
        unit: "", //FIXME is not being returned
        default: parameter.hasDefaultValue ? parameter.hasDefaultValue[0] : "",
        description: parameter.description ? parameter.description[0] : "",
        //FIXME: This is not returned right now.
        adjustment_variable: "",//parameter.adjustsVariable ? parameter.adjustsVariable[0] : "",
        position: parameter.position ? parameter.position[0] : 0,
        accepted_values: parameter.hasAcceptedValues ? parameter.hasAcceptedValues[0] : null,
    };
    if (parameter.hasFixedValue)
        param.value = parameter.hasFixedValue[0];
    // Hack to fix FALSE to false
    if(param.value == "FALSE")
        param.value = "false";

    return param;
}

const fixedToValue = (fx) => {
    if (fx.type.includes("SampleCollection")) {
        return {
            id: fx.id,
            resources: []
        }
    } else if (fx.value && fx.value.length > 0) {
        let dataCatalogIdentifier = fx.dataCatalogIdentifier && fx.dataCatalogIdentifier.length > 0 ?
                fx.dataCatalogIdentifier[0] : "";
        let url = fx.value[0];
        let fname = url.replace(/.*[#\/]/, '');
        return {
            id: dataCatalogIdentifier,
            resources: [{
                url: url,
                id: fname,
                name: fname,
                selected: true
            }]
        }
    }
}

const dsSpecToIO = (ds: DatasetSpecification) => {
    if (! ds.type) {
        ds.type = [];
    }
    let types = ds.type.filter((t:string) => t != 'DatasetSpecification');
    let io = {
        id: ds.id,
        name: ds.label ? ds.label[0] : ds.id,
        type: types.join(),
        format: ds.hasFormat ? ds.hasFormat[0] : null,
        position: ds.position ? ds.position[0] : 0,
        variables: [], //TODO does not return hasInput -> hasPresentation -> hasStandarVariable
    }

    if (ds.hasPresentation) {
        let vars : Set<string> = new Set();
        ds.hasPresentation.map(vp => {
            (vp.hasStandardVariable||[]).forEach((sv) => 
                vars.add(sv.label ? sv.label[0] : "")
            )
        })
        io.variables = Array.from(vars);
    }

    if (ds.hasFixedResource) {
        io["value"] = fixedToValue(ds.hasFixedResource[0]);
    }
    return io;
}

// Transform to graphql representation TODO
export const setupToOldModel = (setup: ModelConfigurationSetup,  softwareImages: IdMap<SoftwareImage>) :  Model => {
    let model: Model = {
        id: setup.id,
        localname: setup.id.substr(setup.id.lastIndexOf("/") + 1),
        name: setup.label ? setup.label[0] : "",
        region_name: setup.hasRegion && setup.hasRegion.length > 0 ?
                setup.hasRegion.map(getLabel).join(', ') : "",
        description: setup.description ? setup.description[0] : "",
        category: setup.hasModelCategory && setup.hasModelCategory.length > 0 ?
                setup.hasModelCategory.map(getLabel).join(', ') : "",
        code_url: setup.hasComponentLocation ? setup.hasComponentLocation[0] : "",
        input_files: [],
        input_parameters: [],
        output_files: [],
        model_name: "", //FIXME row["modelName"] || "",
        model_version: "", //FIXME row["versionName"] || "",
        model_configuration: "", //FIXME row["configurationName"] || "",
        software_image: setup.hasSoftwareImage && setup.hasSoftwareImage[0].id && softwareImages[setup.hasSoftwareImage[0].id] ?
                (softwareImages[setup.hasSoftwareImage[0].id].label||[]).join("") : "",
        model_type: (setup.type || [])
            .filter(m => m != "ConfigurationSetup" && m != "ModelConfigurationSetup").join(', ')
            .replace('Model', ' Model'),
        parameter_assignment: setup.parameterAssignmentMethod ? setup.parameterAssignmentMethod[0] : "",
        parameter_assignment_details: "",
        calibration_target_variable: setup.calibrationTargetVariable ?
                setup.calibrationTargetVariable
                        .map((tv:any) => tv.label? tv.label[0] : '')
                        .filter((l:string) => !!l)
                        .join(', ') : "",
        modeled_processes: [], //TODO the API is not returning this. <-----
        dimensionality: "",
        spatial_grid_type: "",
        spatial_grid_resolution: "",
        output_time_interval: "",
        usage_notes: setup.hasUsageNotes ? setup.hasUsageNotes[0] : ""
    };
    
    if (setup.usefulForCalculatingIndex && setup.usefulForCalculatingIndex.length >0) {
        model.indicators = setup.usefulForCalculatingIndex
                .map(index => index.id)
                .map(id => id.split('/').pop())
                .map(name => name.replace('_',' '))
                .map(name => name.length > 0 ? name.charAt(0).toUpperCase() + name.slice(1) : name)
                .join(", ");
    }

    if (setup.hasGrid && setup.hasGrid.length > 0) {
        let grid = setup.hasGrid[0];
        let types = grid.type.filter((t:string) => t!="Grid");
        model.dimensionality =  grid.hasDimension ? grid.hasDimension[0] : "";
        model.spatial_grid_type = types.join(),
        model.spatial_grid_resolution = grid.hasSpatialResolution ? grid.hasSpatialResolution[0] : "";
    }

    if (setup.hasInput)
        model.input_files = setup.hasInput.map(dsSpecToIO).sort(sortByPosition);

    if (setup.hasOutput)
        model.output_files = setup.hasOutput.map(dsSpecToIO).sort(sortByPosition);

    if (setup.hasParameter)
        model.input_parameters = setup.hasParameter.map(parameterToParam).sort(sortByPosition);

    if (setup.hasRegion)
        model.hasRegion = setup.hasRegion;

    return model;
}

// Query Model Catalog By Output? Variables TODO FIXME
type QueryModelsThunkResult = ThunkAction<void, RootState, undefined, ModelsActionVariablesQuery>;
export const queryModelsByVariables: ActionCreator<QueryModelsThunkResult> = (response_variables: string[],
        driving_variables: string[], softwareImages: IdMap<SoftwareImage>) => (dispatch) => {
    let models = [] as Model[];

    dispatch({
        type: MODELS_VARIABLES_QUERY,
        variables: response_variables,
        models: null,
        loading: true
    });

    let variables : string[] = response_variables[0].split(/\s*,\s/);

    let setups : ModelConfigurationSetup[] = [];
    Promise.all(
        variables.map((variable:string) => ModelCatalogApi.myCatalog.modelConfigurationSetup.getSetupsByVariableLabel(variable))
        /*{ FIXME
            let fromvar : string = getVariableProperty(variable, "created_from");
            if(fromvar) {
                variable = fromvar;
            }
            return setupsSearchVariable(variable);
        })*/
    ).then((resp) => {
        setups = resp.reduce((arr:ModelConfigurationSetup[], r:ModelConfigurationSetup[]) => arr.concat(r), []);
        dispatch({
            type: MODELS_VARIABLES_QUERY,
            variables: response_variables,
            models: setups.map((setup) => setupToOldModel(setup, softwareImages)),
            loading: false
        });
    })
};


//THIS SHOULD BE A QUERY ! FIXME
export const fetchModelsFromCatalog = async (
            models: IdMap<Model>, 
            allSoftwareImages: IdMap<SoftwareImage>, 
            allConfigs: IdMap<ModelConfiguration>,
            allVersions: IdMap<SoftwareVersion>,
            allModels: IdMap<MCModel>) =>  {

        // GET all data for the selected models.
        //console.log("getting all info", models);
        return Promise.all(
            Object.keys(models || {}).map((modelid) => ModelCatalogApi.myCatalog.modelConfigurationSetup.getDetailsNoRedux(modelid))
        ).then(async (setups) => {
            let fixedModels = setups.map((setup) => setupToOldModel(setup, allSoftwareImages));
            Object.values(fixedModels).forEach((model) => {
                if (model.hasRegion)
                    delete model.hasRegion;
                Object.values(allConfigs).forEach((cfg:ModelConfiguration) => {
                    if ((cfg.hasSetup || []).some((setup:ModelConfigurationSetup) => setup.id === model.id))
                        model.model_configuration = cfg.id;
                });
                if (model.model_configuration) {
                    Object.values(allVersions).forEach((ver:SoftwareVersion) => {
                        if ((ver.hasConfiguration || []).some((cfg:ModelConfiguration) => cfg.id === model.model_configuration))
                            model.model_version = ver.id;
                    });
                }
                if (model.model_version) {
                    Object.values(allModels).forEach((mod:MCModel) => {
                        if ((mod.hasVersion || []).some((ver:SoftwareVersion) => ver.id === model.model_version))
                            model.model_name = mod.id;
                    });
                }
            });

            return fixedModels;
        });
}
