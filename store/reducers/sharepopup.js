import * as actionTypes from '../actions/actionTypes';

const initialState = {
    status: false,
    data:{}
};

let reducer = function (state = initialState, action) {
    switch (action.type) {
        case actionTypes.SHARE_POPUP:
        return {
          ...state,
          status:action.status,
          data:action.data,
        }
        default:
          return state;
    }
  };
  
  export default reducer;