import React from "react"
import axios from "../axios-site"
import Router from "next/router"
const { BroadcastChannel } = require('broadcast-channel');

class Logout extends React.Component {
    static async getInitialProps(context) {
        const isServer = !!context.req
        if(isServer){
            context.res.redirect('/');
        }else{
            await axios.get("/logout?data=1");
            const userChannel = new BroadcastChannel('user');
            userChannel.postMessage({
                payload: {
                    type: "LOGOUT"
                }
            });
            Router.push('/')
        }
    }
render() {
    return "Logout"
  }
}

export default Logout