import * as actionTypes from '../actions/actionTypes';

const initialState = {
    contentId: '',
    contentType:"",
    status:false
};


let reducer = function (state = initialState, action) {
    switch (action.type) {
        case actionTypes.REPORT_CONTENT:
        return {
          ...state,
          contentType:action.contentType,
          contentId:action.contentId,
          status:action.status
        }
        default:
          return state;
    }
  };
  
  export default reducer;