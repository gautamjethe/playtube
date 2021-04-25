import * as actionTypes from '../actions/actionTypes';
import { updateObject } from '../../shared/validate';

const initialState = {
    pageInfoData:{}
};

const pageInfoData = ( state, action ) => {
    return updateObject( state, { pageInfoData:action.pageInfoData } );
};

const reducer = ( state = initialState, action ) => {
    switch ( action.type ) {
        case actionTypes.UPDATEPAGEINFODATA: return pageInfoData(state,action);
        default:
            return state;
    }
};

export default reducer;