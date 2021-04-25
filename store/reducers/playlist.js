import * as actionTypes from '../actions/actionTypes';

const initialState = {
    playlistClicked: false,
    playlistCloseClicked:false,
    video_id:0
};


let reducer = function (state = initialState, action) {
    switch (action.type) {
        case actionTypes.PLAYLIST_OPEN:
        return {
          ...state,
          playlistCloseClicked:false,
          playlistClicked: action.open,
          video_id:action.video_id
        }
        default:
          return state;
    }
  };
  
  export default reducer;