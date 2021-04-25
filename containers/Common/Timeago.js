import React from "react"
import TimeAgo from 'timeago-react'; 
import {register} from 'timeago.js';
import moment from 'moment-timezone';


const Timeago = (props) => {
    var language = props.initialLanguage

    if(typeof window != "undefined"){
        language = $("html").attr("lang");
    }

    if(language != "en"){
        try{
            register(language, require("timeago.js/lib/lang/"+language+".js").default);
        }catch(err){
            //silence
        }
    }
    let dateS = moment(props.children)
    let date = dateS.tz(props.pageData.defaultTimezone ? props.pageData.defaultTimezone : props.pageInfoData.defaultTimezone).format('YYYY-MM-DD HH:mm:ss ZZ')

    return (
        <TimeAgo
            live={false}
            datetime={date}
            locale={language} 
        />
    )
}

export default Timeago