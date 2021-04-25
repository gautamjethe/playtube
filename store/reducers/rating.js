import * as actionTypes from '../actions/actionTypes';

const initialState = {
    ratingClicked: false,
    ratingData:null
};


let reducer = function (state = initialState, action) {
    switch (action.type) {
        case actionTypes.RATING_STATS:
        return {
          ...state,
          ratingClicked: action.open,
          ratingData:action.data
        }
        default:
          return state;
    }
  };
  
  export default reducer;