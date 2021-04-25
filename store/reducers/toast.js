import * as actionTypes from '../actions/actionTypes';

const initialState = {
    message: "",
    type:"success"
};


let reducer = function (state = initialState, action) {
    switch (action.type) {
        case actionTypes.TOAST_OPEN:
        return {
          ...state,
          message: action.message,
          type:action.typeMessage
        }
        default:
          return state;
    }
  };
  
  export default reducer;