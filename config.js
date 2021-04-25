
let app_url = `${process.env.PUBLIC_URL}/api/`;
let app_server = `${process.env.PUBLIC_URL}`;

if(typeof window != "undefined"){
  app_url = window.location.protocol+"//"+window.location.host+"/api/"
  app_server = window.location.protocol+"//"+window.location.host;
}

export default {app_url,app_server}