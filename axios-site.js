import axios from "axios";

let app_url = `${process.env.PUBLIC_URL}/`;

if (typeof window != "undefined") {
  app_url = window.location.protocol + "//" + window.location.host + "/"
}

const instance = axios.create({
    baseURL: `${app_url}`
});


export default instance;