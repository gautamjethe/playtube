import * as actionTypes from '../actions/actionTypes';

const initialState = {
    currentVideoTime: 0,
    relatedVideos:[],
    playlistVideos:[],
    currentVideo:null,
    deleteTitle:"",
    deleteMessage:"",
    liveStreamingURL:""
};


let reducer = function (state = initialState, action) {
    switch (action.type) {
        case actionTypes.UPDATETIME_CONTENT:
        return {
          ...state,
          currentVideoTime:action.time
        }
        case actionTypes.UPDATERELATEDPLAYLIST_CONTENT:
        return {
          ...state,
          relatedVideos:action.relatedVideos,
          playlistVideos:action.playlistVideos,
          currentVideo:action.currentVideo,
          deleteMessage:action.deleteMessage,
          deleteTitle:action.deleteTitle,
          liveStreamingURL:action.liveStreamingURL
        }
        default:
          return state;
    }
  };
  
  export default reducer;