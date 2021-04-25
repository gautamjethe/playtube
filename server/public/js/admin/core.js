//form submit ajax
$(document).on('submit','.ajaxForm',function(e) {
    e.preventDefault();
    var options = {};
    if($(this).hasClass('disabled'))
        return;
    
    if($(this).attr('submit')){
        options.beforeSubmit = function (formData, jqForm, options) {
            if(!validateForm(formData)){
                return false;
            }
            showRequestAjaxRequest(formData, jqForm, options);
            eval($(jqForm).attr('submit')+"(formData, jqForm, options)");
            $(jqForm).addClass('disabled');
            $(jqForm).find('button[type=submit]').append('<div class="button-loading"><div></div><div></div><div></div><div></div></div>');
        }
    }else{
        options.beforeSubmit = function (formData, jqForm, options) {
            if(!validateForm(formData)){
                return false;
            }
            showRequestAjaxRequest(formData, jqForm, options);
            $(jqForm).addClass('disabled');
            $(jqForm).find('button[type=submit]').append('<div class="button-loading"><div></div><div></div><div></div><div></div></div>');
        }
    }
    if($(this).attr('success')) {
        options.success = function (responseText, statusText, xhr, $form) {
            $($form).removeClass('disabled');
            $($form).find('button[type=submit]').find('.button-loading').remove();
            eval($($form).attr('success')+"(responseText, statusText, xhr, $form)");
            showResponseAjaxRequest(responseText, statusText, xhr, $form);
        }
    }else{
        options.success = function (responseText, statusText, xhr, $form) {
            $($form).removeClass('disabled');
            $($form).find('button[type=submit]').find('.button-loading').remove();
            showResponseAjaxRequest(responseText, statusText, xhr, $form);
        }
    }
    if($(this).attr('error')) {
        options.error = function (xhr,error1,error,$form) {
            $($form).removeClass('disabled');
            $($form).find('button[type=submit]').find('.button-loading').remove();
            eval($($form).attr('error')+"(xhr,error1,error,$form)");
        }
    }else{
        options.error = function (xhr,error1,error,$form) {
            $($form).removeClass('disabled');
            $($form).find('button[type=submit]').find('.button-loading').remove();
            showErrorAjaxRequest(xhr,error1,error,$form);
        }
    }
    options.timeout = 10000;
    options.type = $(this).attr('method') ? $(this).attr('method') :  "POST" ;
//     var options = {
//         beforeSubmit:  showRequestAjaxRequest,  // pre-submit callback
//         success:       showResponseAjaxRequest,  // post-submit callback
//         error:         showErrorAjaxRequest,
//         // other available options:
//         //url:       url         // override for form's 'action' attribute
//         //type:      type        // 'get' or 'post', override for form's 'method' attribute
//         //dataType:  null        // 'xml', 'script', or 'json' (expected server response type)
//         //clearForm: true        // clear all form fields after successful submit
//         //resetForm: true        // reset the form after successful submit
//         // $.ajax options can be used here too, for example:
//         timeout:   3000
//     };
    // inside event callbacks 'this' is the DOM element so we first
    // wrap it in a jQuery object and then invoke ajaxSubmit
    $(this).ajaxSubmit(options);

    // !!! Important !!!
    // always return false to prevent standard browser submit and page navigation
    return false;
});
// error-submit callback
function showErrorAjaxRequest(xhr,error,$form) {
    alert("Something went wrong, please try again later.");
}
// pre-submit callback
function showRequestAjaxRequest(formData, jqForm, options) {
    // formData is an array; here we use $.param to convert it to a string to display it
    // but the form plugin does this for you automatically when it submits the data
    //var queryString = $.param(formData);
    //console.log(formData)
    //place loading image in submit button


    // jqForm is a jQuery object encapsulating the form element.  To access the
    // DOM element for the form do this:
    // var formElement = jqForm[0];
    //alert('About to submit: \n\n' + queryString);

    // here we could return false to prevent the form from being submitted;
    // returning anything other than false will allow the form submit to continue
    return true;
}
// post-submit callback
function showResponseAjaxRequest(responseText, statusText, xhr, $form)  {
    // for normal html responses, the first argument to the success callback
    // is the XMLHttpRequest object's responseText property
    try {
        var jsonObject = responseText;
        if(jsonObject.errors){
            var errors = jsonObject.errors;
            if(typeof errors == "String"){
                alert(errors);
                return;
            }
            $($form).find('.form-error').remove();
            for(key in errors) {
                //remove all old errors
                if($($form).find('#id_'+key).length){
                    $($form).find('#id_'+key).parent().append('<div class="form-error"><span class="error">'+errors[key]+'</span></div>');
                }
            }
        }else if(jsonObject.url){
            window.location.href = jsonObject.url;
        }else if(jsonObject.refresh){
            window.location.reload();
        }
    }catch (error) {
        //silence is the key
    }
}

function validateForm(data){
    let isValid = true;
    if(data.length  > 0){
        for(i=0;i<data.length;i++){
            if($('#'+data[i].id).closest('.field').hasClass('required')){
                if(!data[i].value){
                    isValid = false;
                    if(!$('#'+data[i].id).closest('.field').find('.form-error').length)
                    $('#'+data[i].id).closest('.field').append('<div class="form-error"><span class="error">This field is required.</span></div>')
                }else{
                    $('#'+data[i].id).closest('.field').find('.form-error').remove();
                }
            }

            //check type validation
            if(isValid){
                if(data[i].type == "email"){
                    var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
                    if (reg.test(data[i].value) == false){
                        isValid = false;
                        $('#'+data[i].id).parent().append('<div class="form-error"><span class="error">Email is not valid.</span></div>')
                    }else{
                        $('#'+data[i].id).parent().find('.form-error').remove();
                    }
                }
            }
         }
    }
    return isValid;
}
var imagePreviewTag;
function previewImage(input) {
    imagePreviewTag = $(input);
    var url = input.value;
    var ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
    imagePreviewTag.parent().find('.preview').remove();
    if (input.files && input.files[0] && (ext == "png" || ext == "jpeg" || ext == "jpg" || ext == 'PNG' || ext == 'JPEG' || ext == 'JPG')){
        var reader = new FileReader();
        reader.onload = function (e) {
            imagePreviewTag.parent().append('<img class="preview" src="'+e.target.result+'">');
        }
        reader.readAsDataURL(input.files[0]);
    }else{
        imagePreviewTag.val('');
	}
  }