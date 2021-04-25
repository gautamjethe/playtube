import moment from 'moment-timezone';
const Timeago = (props) => {
    var language = props.initialLanguage
    if(typeof window != "undefined"){
        language = $("html").attr("lang");
    }
    let dateS = moment(props.creation_date).locale(language)
    return dateS.tz(props.defaultTimezone).format(props.format ? props.format : 'dddd, MMMM Do YYYY')
}

export default Timeago