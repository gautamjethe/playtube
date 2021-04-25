var is_date = function(input) {
   if ( Object.prototype.toString.call(input) === "[object Date]" ) 
     return true;
   return false;   
};
export default function validate(input,key) {
   
   if(!input){
      return false
   }else if(typeof input.name != "undefined"){
      return true
   }else if(is_date(input)){
      return true  
   }else if(!input.length){
      return false
   }
   return true;
}