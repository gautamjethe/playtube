import * as actionTypes from '../actions/actionTypes';

const initialState = {
    searchValue: '',
    searchChanged:false,
    searchClicked:false,
    menuOpen:false
};


let reducer = function (state = initialState, action) {
    switch (action.type) {
        case actionTypes.SEARCH_VALUE:
        return {
          ...state,
          searchValue:action.value
        }
        case actionTypes.SEARCH_CHANGED:
        return {
          ...state,
          searchChanged:action.status
        }
        case actionTypes.SEARCHCLICKED:
        return {
          ...state,
          searchClicked:action.status
        }
        case actionTypes.MENUOPENED:
        return {
          ...state,
          menuOpen:action.status
        }
        default:
          return state;
    }
  };
  
  export default reducer;