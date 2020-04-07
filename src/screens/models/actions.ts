import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState } from "../../app/store";
import { Model, ModelParameter } from "./reducers";
import { Dataset } from "../datasets/reducers";

import { setupsSearchVariable, setupGetAll, variablePresentationGetProm } from 'model-catalog/actions';
import { ModelConfigurationSetup, DatasetSpecification } from '@mintproject/modelcatalog_client';
import { sortByPosition } from './configure/util';

import { getVariableProperty } from "offline_data/variable_list";

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
    let dataCatalogIdentifier = fx.dataCatalogIdentifier ? fx.dataCatalogIdentifier[0] : "";
    let resources = [];
    if (fx.value) {
        let url = fx.value[0];
        let fname = url.replace(/.*[#\/]/, '');
        resources.push({
            url: url,
            id: fname,
            name: fname,
            selected: true
        });
    }

    if (fx.hasPart) {
        fx.hasPart.forEach((part:any) => {
            let partVal = fixedToValue(part)
            if (!dataCatalogIdentifier)
                dataCatalogIdentifier = partVal.id;
            if (partVal.resources.length > 0)
                resources = resources.concat(partVal.resources);
        })
    }

    return {
        id: dataCatalogIdentifier,
        resources: resources
    }
}

const dsSpecToIO = (ds: DatasetSpecification) => {
    let types = ds.type.filter((t:string) => t != 'DatasetSpecification');
    let io = {
        id: ds.id,
        name: ds.label ? ds.label[0] : ds.id,
        type: types.join(),
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

const setupToOldModel = (setup: ModelConfigurationSetup) :  Model => {
    let model: Model = {
        id: setup.id,
        localname: setup.id.substr(setup.id.lastIndexOf("/") + 1),
        name: setup.label ? setup.label[0] : "",
        calibrated_region: setup.hasRegion ?
                setup.hasRegion.map((r:any) => r.label[0]).join(', ') : "",
        description: setup.description ? setup.description[0] : "",
        category: setup.hasModelCategory ? setup.hasModelCategory[0] : "",
        wcm_uri: setup.hasComponentLocation ? setup.hasComponentLocation[0] : "",
        input_files: [],
        input_parameters: [],
        output_files: [],
        original_model: "", //FIXME row["modelName"] || "",
        model_version: "", //FIXME row["versionName"] || "",
        model_configuration: "", //FIXME row["configurationName"] || "",
        model_type: "",
        parameter_assignment: setup.parameterAssignmentMethod ? setup.parameterAssignmentMethod[0] : "",
        parameter_assignment_details: "",
        target_variable_for_parameter_assignment: setup.calibrationTargetVariable ?
                setup.calibrationTargetVariable
                        .map((tv:any) => tv.label? tv.label[0] : '')
                        .filter((l:string) => !!l)
                        .join(', ') : "",
        modeled_processes: [""], //TODO the API is not returning this.
        dimensionality: "",
        spatial_grid_type: "",
        spatial_grid_resolution: "",
        minimum_output_time_interval: "",
        usage_notes: setup.hasUsageNotes ? setup.hasUsageNotes[0] : ""
    };

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

// Query Model Catalog By Output? Variables
type QueryModelsThunkResult = ThunkAction<void, RootState, undefined, ModelsActionVariablesQuery>;
export const queryModelsByVariables: ActionCreator<QueryModelsThunkResult> = (response_variables: string[],
        driving_variables: string[]) => (dispatch) => {
    let models = [] as Model[];
    //console.log('queryModelsByVariables(', response_variables, ',', driving_variables, ')');

    dispatch({
        type: MODELS_VARIABLES_QUERY,
        variables: response_variables,
        models: null,
        loading: true
    });

    let variables : string[] = response_variables[0].split(/\s*,\s/);

    let setups : ModelConfigurationSetup[] = [];
    //console.log('let variables =', variables);
    Promise.all(
        variables.map((variable:string) => {
            let fromvar : string = getVariableProperty(variable, "created_from");
            if(fromvar) {
                variable = fromvar;
            }
            return setupsSearchVariable(variable);
        })
    ).then((resp) => {
        setups = resp.reduce((arr:ModelConfigurationSetup[], r:ModelConfigurationSetup[]) => arr.concat(r), []);
        //let models = setups.map(setupToOldModel);
        //console.log('>>', models);
        Promise.all(
            setups.map((s:ModelConfigurationSetup) => setupGetAll(s.id))
        ).then((setups) => {
            dispatch({
                type: MODELS_VARIABLES_QUERY,
                variables: response_variables,
                models: setups.map(setupToOldModel),
                loading: false
            });
        })
    })
};
