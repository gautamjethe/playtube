var forms = require('forms')
var text = require('forms/lib/widgets').text;

exports.file = (options) => {
    var w = text(options);
    //var originalHTML = w.toHTML;
    w.toHTML = function (name, f) {
        //var html = originalHTML(name, f);
        let html = "<div class='form-file'><input  type='file' name='"+options.name+"' id='id_"+options.name+"' onChange='previewImage(this);' class='form-control'>";
        if(options.value){
           html += "<img class='preview' src='"+options.value+"'>"
        }
        html +="</div>"

        return html
    };
    return w;
}
exports.makeClickable = (options) => {
    var w = text(options);
    w.toHTML = function (name, f) {
        var html = options.content
        if(options.replace){
            for(var key in options.replace){
                var obj = options.replace[key];
                html = html.replace(`[${key}]`,obj[key])
            }
        }
        return html
    };
    return w;
}
exports.formValidations = (form) =>  {
    const errors = {};
    for (var key in form.fields) {
        if (form.fields.hasOwnProperty(key)) {
            var val = form.fields[key];
            if(form.fields[key].error){
                errors[key] = form.fields[key].error
            }
        }
    }
    return errors;
}