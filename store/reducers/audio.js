import * as actionTypes from '../actions/actionTypes';

const initialState = {
    song_id:0,
    audios:[],
    passwordText:"Enter Password",
    submitText:"Submit",

};


let reducer = function (state = initialState, action) {
    switch (action.type) {
        case actionTypes.UPDATEAUDIO_CONTENT:
        return {
          ...state,
          song_id:action.song_id,
          audios:action.audios,
          pausesong_id:action.pausesong_id,
          submitText:action.submitText,
          passwordText:action.passwordText
        }
        default:
          return state;
    }
  };
  
  export default reducer;