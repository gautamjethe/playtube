export default function test(input) {
    const pattern =  /^[0-9]\d*((\.\d{0,2})?)$/;
    if(!input){
        return true;
    }
    if(!pattern.test( input )){
        return false
    }
    return true;
 }