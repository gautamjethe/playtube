$(document).ready(function () {

    // Scroll spy
    $('body').scrollspy({
        target: "#side"
    });
    
    // Navbar fade
    changeNavbar();
    
    $(window).scroll(function () {
        changeNavbar();
    });
    
    function changeNavbar() {
        var navbar = $("#side");
        if ($(this).scrollTop() >= 100) {
            navbar.addClass("active").removeClass("bg-transparent");
        } else if ($(this).scrollTop() < 100) {
            navbar.removeClass("active").addClass("bg-transparent");
        }
    }
    });

    $(document).ready(function() {
        $('.imgPopup').magnificPopup({type:'image'});
      });