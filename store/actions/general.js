import * as actionTypes from './actionTypes';

let actions = {
    setPageInfoData(data){
        return {
            type: actionTypes.UPDATEPAGEINFODATA,
            pageInfoData: data
        };
    },
    ratingStats(open,data){
        return {
            type: actionTypes.RATING_STATS,
            open:open,
            data:data
        }
    },
    changeSearchText(value) {
        return{
            type:actionTypes.SEARCH_VALUE,
            value:value
        }
    },
    setSearchChanged(status){
        return{
            type:actionTypes.SEARCH_CHANGED,
            status:status
        }
    },
    setMenuOpen(status){
        return{
            type: actionTypes.MENUOPENED,
            status:status
        }
    },
    setSearchClicked(status){
        return{
            type: actionTypes.SEARCHCLICKED,
            status:status
        }
    },
    openPlaylist (open,video_id){
        return {
            type: actionTypes.PLAYLIST_OPEN,
            open:open,
            video_id:video_id
        }
    },
    openReport(status,contentId,contentType){
        return {
            type: actionTypes.REPORT_CONTENT,
            status:status,
            contentId:contentId,
            contentType:contentType
        }
    },
    openSharePopup (status,data){
        return {
            type: actionTypes.SHARE_POPUP,
            status:status,
            data:data
        }
    },
    openToast (message,typeMessage){
        return {
            type: actionTypes.TOAST_OPEN,
            message:message,
            typeMessage:typeMessage
        }
    },
    upatePlayerTime (time){
        return {
            type: actionTypes.UPDATETIME_CONTENT,
            time:time
        }
    },
    updatePlayerData (relatedVideos,playlistVideos,currentVideo,deleteMessage,deleteTitle,liveStreamingURL){
        return {
            type: actionTypes.UPDATERELATEDPLAYLIST_CONTENT,
            relatedVideos:relatedVideos,
            playlistVideos:playlistVideos,
            currentVideo:currentVideo,
            deleteMessage:deleteMessage,
            deleteTitle:deleteTitle,
            liveStreamingURL:liveStreamingURL
            
        }
    },
    updateAudioData (audios,song_id,pausesong_id,submitText,passwordText){
        return {
            type: actionTypes.UPDATEAUDIO_CONTENT,
            audios:audios,
            song_id:song_id,
            pausesong_id:pausesong_id,
            submitText:submitText,
            passwordText:passwordText
        }
    }
  };
  
  module.exports = actions;