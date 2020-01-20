import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState, store } from 'app/store';

import { Configuration, GeoShape, GeoShapeApi } from '@mintproject/modelcatalog_client';
import { idReducer, getStatusConfigAndUser, PREFIX_URI, DEFAULT_GRAPH,
         START_LOADING, END_LOADING, START_POST, END_POST, MCACommon } from './actions';

function debug (...args: any[]) { console.log('OBA:', ...args); }

const str_to_bbox = (bb: string) => {
    let coords = bb.split(/,| /g);
    return { xmin: coords[0], ymin: coords[1], xmax: coords[2], ymax: coords[3] };
}

const fixGeoShape = (gs : any) => {
    if (gs.box && gs.box.length === 1) {
        return { ...gs, bbox: str_to_bbox(gs.box[0]) };
    } else {
        return gs;
    }
}

export const ALL_GEO_SHAPES = 'ALL_GEO_SHAPES'

export const GEO_SHAPES_GET = "GEO_SHAPES_GET";
interface MCAGeoShapesGet extends Action<'GEO_SHAPES_GET'> { payload: any };
export const geoShapesGet: ActionCreator<ModelCatalogGeoShapeThunkResult> = () => (dispatch) => {
    let state: any = store.getState();
    if (state.modelCatalog && (state.modelCatalog.loadedAll[ALL_GEO_SHAPES] || state.modelCatalog.loading[ALL_GEO_SHAPES])) {
        console.log('All geoShapes are already in memory or loading')
        return;
    }

    debug('Fetching all geoShape');
    dispatch({type: START_LOADING, id: ALL_GEO_SHAPES});

    let api : GeoShapeApi = new GeoShapeApi();
    let req = api.geoshapesGet({username: DEFAULT_GRAPH});
    req.then((data) => {
        data = data.map(fixGeoShape);
        dispatch({
            type: GEO_SHAPES_GET,
            payload: data.reduce(idReducer, {})
        });
        dispatch({type: END_LOADING, id: ALL_GEO_SHAPES});
    });
    req.catch((err) => {console.log('Error on GET geoShapes', err)});
}

export const GEO_SHAPE_GET = "GEO_SHAPE_GET";
export interface MCAGeoShapeGet extends Action<'GEO_SHAPE_GET'> { payload: any };
export const geoShapeGet: ActionCreator<ModelCatalogGeoShapeThunkResult> = ( uri:string ) => (dispatch) => {
    debug('Fetching geoShape', uri);
    let id : string = uri.split('/').pop();
    let api : GeoShapeApi = new GeoShapeApi();
    let req = api.geoshapesIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp) => {
        let data = {};
        data[uri] = resp;
        dispatch({
            type: GEO_SHAPE_GET,
            payload: data
        });
    })
    req.catch((err) => {console.log('Error on getGeoShape', err)});
}

export const GEO_SHAPE_POST = "GEO_SHAPE_POST";
interface MCAGeoShapePost extends Action<'GEO_SHAPE_POST'> { payload: any };
export const geoShapePost: ActionCreator<ModelCatalogGeoShapeThunkResult> = (geoShape:GeoShape, identifier:string) => (dispatch) => {
    debug('creating new geoShape', geoShape);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        dispatch({type: START_POST, id: identifier});
        geoShape.id = undefined;
        let api : GeoShapeApi = new GeoShapeApi(cfg);
        let req = api.geoshapesPost({user: DEFAULT_GRAPH, geoShape: geoShape}) // This should be my username on prod.
        req.then((resp) => {
            console.log('Response for POST geoShape:', resp);
            //Its returning the ID without the prefix
            let uri = PREFIX_URI + resp.id;
            let data = {};
            data[uri] = resp;
            resp.id = uri;
            dispatch({
                type: GEO_SHAPE_GET,
                payload: data
            });
            dispatch({type: END_POST, id: identifier, uri: uri});
        });
        req.catch((err) => {console.log('Error on POST geoShape', err)});
    } else {
        console.error('TOKEN ERROR:', status);
    }
}

export const GEO_SHAPE_PUT = "GEO_SHAPE_PUT";
interface MCAGeoShapePut extends Action<'GEO_SHAPE_PUT'> { payload: any };
export const geoShapePut: ActionCreator<ModelCatalogGeoShapeThunkResult> = ( geoShape: GeoShape ) => (dispatch) => {
    debug('updating geoShape', geoShape.id);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        dispatch({type: START_LOADING, id: geoShape.id});
        let api : GeoShapeApi = new GeoShapeApi(cfg);
        let id : string = geoShape.id.split('/').pop();
        let req = api.geoshapesIdPut({id: id, user: DEFAULT_GRAPH, geoShape: geoShape}) // This should be my username on prod.
        req.then((resp) => {
            console.log('Response for PUT geoShape:', resp);
            let data = {};
            data[geoShape.id] = resp;
            dispatch({
                type: GEO_SHAPE_GET,
                payload: data
            });
            dispatch({type: END_LOADING, id: geoShape.id});
        });
        req.catch((err) => {console.log('Error on PUT geoShape', err)});
    } else {
        console.error('TOKEN ERROR:', status);
    }
}

export const GEO_SHAPE_DELETE = "GEO_SHAPE_DELETE";
interface MCAGeoShapeDelete extends Action<'GEO_SHAPE_DELETE'> { uri: string };
export const geoShapeDelete: ActionCreator<ModelCatalogGeoShapeThunkResult> = ( uri: string ) => (dispatch) => {
    debug('deleting geoShape', uri);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        let api : GeoShapeApi = new GeoShapeApi(cfg);
        let id : string = uri.split('/').pop();
        let req = api.geoshapesIdDelete({id: id, user: DEFAULT_GRAPH}); // This should be my username on prod.
        req.then((resp) => {
            dispatch({
                type: GEO_SHAPE_DELETE,
                uri: uri
            });
            /*console.log('Response for DELETE geoShape:', resp);
            let data = {};
            data[geoShape.id] = resp;
            dispatch({
                type: GEO_SHAPE_GET,
                payload: data
            });
            dispatch({type: END_LOADING, id: geoShape.id});*/
        });
        req.catch((err) => {console.log('Error on DELETE geoShape', err)});
    } else {
        console.error('TOKEN ERROR:', status);
    }
}

export type ModelCatalogGeoShapeAction =  MCACommon | MCAGeoShapesGet | MCAGeoShapeGet | MCAGeoShapePost | MCAGeoShapePut |
                                        MCAGeoShapeDelete;
type ModelCatalogGeoShapeThunkResult = ThunkAction<void, RootState, undefined, ModelCatalogGeoShapeAction>;
