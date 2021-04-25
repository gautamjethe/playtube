let AgoraRTC = ""
if(typeof window != "undefined"){
  AgoraRTC = require('agora-rtc-sdk');

}
import { addView, removeView} from "./common"


export default class RTCClient {
  constructor () {
    this._client = null
    this._joined = false
    this._published = false
    this._localStream = null
    this._remoteStreams = []
    this._params = {}

    this._showProfile = false
    this._liveStreaming = false
  }

  handleEvents() {
    this._client.on('error', (err) => {
      console.log(err,'==== agora start error ====')
    })
    // Occurs when the peer user leaves the channel; for example, the peer user calls Client.leave.
    this._client.on('peer-leave', (evt) => {
      var id = evt.uid
      if (id != this._params.uid) {
        removeView(id)
      }
    })
    // Occurs when the local stream is _published.
    this._client.on('stream-published', (evt) => {
      console.log('Publish local stream successfully')
    })
    // Occurs when the remote stream is added.
    this._client.on('stream-added', (evt) => {  
      
      var remoteStream = evt.stream
      var id = remoteStream.getId()
      if (id !== this._params.uid) {
        this._client.subscribe(remoteStream, (err) => {
          console.log('stream subscribe failed', err)
        })
      }
      console.log('stream-added remote-uid: ', id)
    })
    // Occurs when a user subscribes to a remote stream.
    this._client.on('stream-subscribed', (evt) => {
      const remoteStream = evt.stream
      const id = remoteStream.getId()
      this._remoteStreams.push(remoteStream)
      addView(id, this._showProfile)
      remoteStream.play('remote_video_' + id, {fit: 'cover'})
      console.log('stream-subscribed remote-uid: ', id)
    })
    // Occurs when the remote stream is removed; for example, a peer user calls Client.unpublish.
    this._client.on('stream-removed', (evt) => {
      const remoteStream = evt.stream
      const id = remoteStream.getId()
      remoteStream.stop('remote_video_' + id)
      this._remoteStreams = this._remoteStreams.filter((stream) => {
        return stream.getId() !== id
      })
      removeView(id)
      console.log('stream-removed remote-uid: ', id)
    })
    this._client.on('onTokenPrivilegeWillExpire', () => {
      // After requesting a new token
      // this._client.renewToken(token);
      console.log('onTokenPrivilegeWillExpire')
    })
    this._client.on('onTokenPrivilegeDidExpire', () => {
      // After requesting a new token
      // client.renewToken(token);
      console.log('onTokenPrivilegeDidExpire')
    })
    // Occurs when the live streaming starts.
    this._client.on('liveStreamingStarted', (evt) => {
      this._liveStreaming = true
      console.log('liveStreamingStarted', evt)
    })
    // Occurs when the live streaming fails.
    this._client.on('liveStreamingFailed', (evt) => {
      console.log('liveStreamingFailed', evt)
    })
    // Occurs when the live streaming stops.
    this._client.on('liveStreamingStopped', (evt) => {
      this._liveStreaming = false
      console.log('liveStreamingStopped', evt)
    })
    // Occurs when the live transcoding setting is updated.
    this._client.on('liveTranscodingUpdated', (evt) => {
      console.log('liveTranscodingUpdated', evt)
    })
  }
  join(data) {
    return new Promise((resolve, reject) => {
      if (!this._client) {
        console.error("Your already create client");
        return;
      }
      if (this._joined) {
        console.error("Your already joined");
        return;
      }
      
      // join client
      this._client.setClientRole(data.role, () => {
        console.log(data,' ========== ')
        this._client.join(data.token, data.channel, 0, (uid) => {
          this._params.uid = uid;
          console.log("join channel: " + data.channel + " success, uid: " + uid);
          this._joined = true;
          resolve(true);
        }, (err) => {
          resolve(false);
          console.error("init local stream failed ", err);
        })
      }, function (err) {
        resolve(false);
        console.error("client join failed", err)
      })
    })
  }
  
  uid(){
    return  this._params.uid
  }
  getClient(){
    return this._client
  }
  getLocalStream(){
    return this._localStream
  }
  getdevices(){
    return new Promise((resolve) => {
    AgoraRTC.getDevices((devices) => {
        const [cameraList, microphoneList] = [devices
          .filter((item) => item.kind === 'videoinput')
          .map((item, idx) => ({
            value: item.deviceId,
            label: item.label ? item.label : `Video Input ${idx}`
          })),
          devices
          .filter((item) => item.kind === 'audioinput')
          .map((item, idx) => ({
            value: item.deviceId,
            label: item.label ? item.label : `Audio Input ${idx}`
          }))
        ]
        resolve({cameraList:cameraList,microphoneList:microphoneList});
      })
    })
  }
  init(data) {
    return new Promise((resolve) => {
      
      
      if (this._client) {
        resolve(false)
        return;
      }
      /**
       * A class defining the properties of the config parameter in the createClient method.
       * Note:
       *    Ensure that you do not leave mode and codec as empty.
       *    Ensure that you set these properties before calling Client.join.
       *  You could find more detail here. https://docs.agora.io/en/Video/API%20Reference/web/interfaces/agorartc.clientconfig.html
      **/
     //h264
      this._client = AgoraRTC.createClient({ mode: "live", codec: 'vp8' });
      AgoraRTC.Logger.setLogLevel(AgoraRTC.Logger.NONE); 
      //this._params = data;
     
      // init client
      this._client.init(data.appID, () => {
        // handle AgoraRTC client event
        this.handleEvents();
        resolve(true)
      })
    })
  }

  publish (data) {
    if (!this._client) {
      return
    }
    if (this._published) {
      return
    }
    // create local stream
    let dataStream = {
      streamID: this._params.uid,
      audio: true,
      video: true,
      screen: false,
      
    };
    if(data["microphoneId"]){
      dataStream['microphoneId'] = data.microphoneId
    }
    if(data["cameraId"]){
      dataStream['cameraId'] = data.cameraId
    }
    let localStream = AgoraRTC.createStream(dataStream)
   
    localStream.setVideoProfile('720p_6');
    
    // init local stream
    localStream.init(() => {
      this._localStream = localStream
      // play stream with html element id "local_stream"
      this._localStream.play("local_stream", { fit: "cover" })  
      // publish localStream
      this._published = true
      this._client.publish(this._localStream, (err) => {
        this._published = false        
      })
    }, (err) => {
      console.error(err);
    });
  }


  leave () {
    if (!this._client) {
      return
    }
    if (!this._joined) {
      return
    }
    // leave channel
    this._client.leave(() => {
      // close stream
      if(this._localStream){
        this._localStream.close()
        // stop stream
        this._localStream.stop()
        while (this._remoteStreams.length > 0) {
          const stream = this._remoteStreams.shift()
          const id = stream.getId()
          stream.stop()
          removeView(id)
        }
      }
      this._localStream = null
      this._remoteStreams = []
      this._client = null
      this._published = false
      this._joined = false
    }, (err) => {
      console.error(err)
    })
  }
  
  unpublish () {
    if (!this._client) {
      return
    }
    if (!this._published) {
      return
    }
    const oldState = this._published
    this._client.unpublish(this._localStream, (err) => {
      this._published = oldState
      console.error(err)
    })
    this._published = false
  }
  

  stopLocalStream(){
    this._localStream.close()
    // stop stream
    this._localStream.stop()
    this._localStream = null
  }
  createStream(){
    return new Promise((resolve, reject) => {
      // create local stream
      this._localStream = AgoraRTC.createStream({
        streamID: null,
        audio: true,
        video: true,
        screen: false
      })

      // init local stream
      this._localStream.init(() => {
        // play stream with html element id "local_stream"
        this._localStream.play("local_stream", { fit: "cover" })
        resolve({})

      }, (err) => {
        let errorMessage = {}
        errorMessage.error = err.info
        resolve(errorMessage)
      });
    });
  }
}
 