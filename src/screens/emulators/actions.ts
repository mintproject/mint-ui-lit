import { Action, ActionCreator } from "redux";

export const EMULATORS_LIST = 'EMULATORS_LIST_MODELS';
export const EMULATORS_SELECT_MODEL = 'EMULATORS_SELECT_MODEL';
export const EMULATORS_LIST_EMULATORS_FOR_MODEL = 'EMULATORS_LIST_EMULATORS_FOR_MODEL';

export interface EmulatorsActionListModels extends Action<'EMULATORS_LIST_MODELS'> { 
    models: string[]
};
export interface EmulatorsActionSelectModel extends Action<'EMULATORS_SELECT_MODEL'> { 
    selected_model: string
};
export interface EmulatorsActionListEmulatorsForModel extends Action<'EMULATORS_LIST_EMULATORS_FOR_MODEL'> { 
    model: string,
    emulators: any[]
};

export type EmulatorsAction =  EmulatorsActionListModels | EmulatorsActionListEmulatorsForModel | EmulatorsActionSelectModel;

export const selectEmulatorModel: ActionCreator<EmulatorsActionSelectModel> = (model: string) => {
    return {
        type: EMULATORS_SELECT_MODEL,
        selected_model: model
    }
}