//Menu
(function($) {
    var defaults={
        sm : 540,
        md : 720,
        lg : 960,
        xl : 1140,
        navbar_expand: 'lg'
    };
    $.fn.bootnavbar = function() {

        var screen_width = $(document).width();

        if(screen_width >= defaults.lg){
            $(this).find('.dropdown').click(function() {
                $(this).addClass('show');
                $(this).find('.dropdown-menu').first().addClass('show').addClass('animated fadeIn').one('animationend oAnimationEnd mozAnimationEnd webkitAnimationEnd', function () {
                    $(this).removeClass('animated fadeIn');
                });
            }, function() {
                $(this).removeClass('show');
                $(this).find('.dropdown-menu').first().removeClass('show');
            });
        }

        $('.dropdown-menu a.dropdown-toggle').on('click', function(e) {
          if (!$(this).next().hasClass('show')) {
            $(this).parents('.dropdown-menu').first().find('.show').removeClass("show");
          }
          var $subMenu = $(this).next(".dropdown-menu");
          $subMenu.toggleClass('show');

          $(this).parents('li.nav-item.dropdown.show').on('hidden.bs.dropdown', function(e) {
            $('.dropdown-submenu .show').removeClass("show");
          });

          return false;
        });
    };
})(jQuery);

$(function () {
    $('#main_navbar').bootnavbar();
})

// Search bar
$(document).ready(function(e){
    $('.search-panel .dropdown-menu').find('a').click(function(e) {
		e.preventDefault();
		var param = $(this).attr("href").replace("#","");
		var concept = $(this).html();
		$('.search-panel span#search_concept').html(concept);
		$('.input-group #search_param').val(param);
	});
});

//login
$(document).ready(function(){
    loginModal();
});

//Banner Slider
    function banner_carousel() {
        var owl = $(".snglFullWdth");
        owl.owlCarousel({
            loop: true,
            margin: 0,
            responsiveClass: true,
            navigation: true,
            navText: ["<i class='fa fa-angle-left'></i>", "<i class='fa fa-angle-right'></i>"],
            nav: false,
            items: 1,
            smartSpeed: 900,
            dots: true,
            autoplay: true,
            autoplayTimeout: 4000,
            center: false,
            animateIn: 'fadeIn',
            animateOut: 'fadeOut',
            responsive: {
                0: {
                    items: 1
                },
                480: {
                    items: 1
                },
                760: {
                    items: 1
                }
            }
        });
    }
    banner_carousel();

  // Top videos slider
  function top_videos_carousel() {
    var owl = $(".topvideos");
    owl.owlCarousel({
        loop: true,
        margin: 20,
        responsiveClass: true,
        navigation: true,
        navText: ["<i class='fas fa-arrow-left'></i>", "<i class='fas fa-arrow-right'></i>"],
        nav: false,
        items: 4,
        smartSpeed: 1000,
        dots: false,
        autoplay: false,
        autoplayTimeout: 4000,
        center: false,
        responsive: {
            0: {
                items: 1
            },
            480: {
                items: 1
            },
            760: {
                items: 3
            },
            992: {
                items: 4
            },
        }
    });
}
top_videos_carousel();

// Latest videos
function latestvideos_carousel() {
        var owl = $(".LatestvideosSld-carousel");
        owl.owlCarousel({
            loop: true,
            margin: 20,
            responsiveClass: true,
            navigation: true,
            navText: ["<i class='fas fa-angle-left'></i>", "<i class='fas fa-angle-right'></i>"],
            nav: true,
            items: 1,
            smartSpeed: 1000,
            dots: false,
            autoplay: false,
            autoplayTimeout: 4000,
            center: false,
            responsive: {
                0: {
                    items: 1
                },
                480: {
                    items: 1
                },
                760: {
                    items: 3
                },
                992: {
                    items: 1
                },
            }
        });
    }
    latestvideos_carousel();

/* Funny slider */
    function funnyvideos_carousel() {
        var owl = $(".funny-carousel");
        owl.owlCarousel({
            loop: true,
            margin: 20,
            responsiveClass: true,
            navigation: true,
            navText: ["<i class='fas fa-angle-left'></i>", "<i class='fas fa-angle-right'></i>"],
            nav: true,
            items: 4,
            smartSpeed: 1000,
            dots: false,
            autoplay: false,
            autoplayTimeout: 4000,
            center: false,
            responsive: {
                0: {
                    items: 1
                },
                480: {
                    items: 1
                },
                760: {
                    items: 3
                },
                992: {
                    items: 4
                },
            }
        });
    }
    funnyvideos_carousel();

    /* Sports slider */
    function sportsvideos_carousel() {
        var owl = $(".sports-carousel");
        owl.owlCarousel({
            loop: true,
            margin: 20,
            responsiveClass: true,
            navigation: true,
            navText: ["<i class='fas fa-angle-left'></i>", "<i class='fas fa-angle-right'></i>"],
            nav: true,
            items: 4,
            smartSpeed: 1000,
            dots: false,
            autoplay: false,
            autoplayTimeout: 4000,
            center: false,
            responsive: {
                0: {
                    items: 1
                },
                480: {
                    items: 1
                },
                760: {
                    items: 3
                },
                992: {
                    items: 4
                },
            }
        });
    }
    sportsvideos_carousel();

    /* Channels slider */
    function channels_carousel() {
        var owl = $(".channels-carousel");
        owl.owlCarousel({
            loop: true,
            margin: 20,
            responsiveClass: true,
            navigation: true,
            navText: ["<i class='fas fa-angle-left'></i>", "<i class='fas fa-angle-right'></i>"],
            nav: true,
            items: 4,
            smartSpeed: 1000,
            dots: false,
            autoplay: false,
            autoplayTimeout: 4000,
            center: false,
            responsive: {
                0: {
                    items: 1
                },
                480: {
                    items: 1
                },
                760: {
                    items: 3
                },
                992: {
                    items: 4
                },
            }
        });
    }
    channels_carousel();

    /* Playlist slider */
    function playlist_carousel() {
        var owl = $(".playlist-carousel");
        owl.owlCarousel({
            loop: true,
            margin: 20,
            responsiveClass: true,
            navigation: true,
            navText: ["<i class='fas fa-angle-left'></i>", "<i class='fas fa-angle-right'></i>"],
            nav: true,
            items: 4,
            smartSpeed: 1000,
            dots: false,
            autoplay: false,
            autoplayTimeout: 4000,
            center: false,
            responsive: {
                0: {
                    items: 1
                },
                480: {
                    items: 1
                },
                760: {
                    items: 3
                },
                992: {
                    items: 4
                },
            }
        });
    }
    playlist_carousel();

/* Latest Bolgs */
    function Latestblogs_carousel() {
        var owl = $(".blogs-carousel");
        owl.owlCarousel({
            loop: true,
            margin: 20,
            responsiveClass: true,
            navigation: true,
            navText: ["<i class='fas fa-angle-left'></i>", "<i class='fas fa-angle-right'></i>"],
            nav: true,
            items: 1,
            smartSpeed: 1000,
            dots: false,
            autoplay: false,
            autoplayTimeout: 4000,
            center: false,
            responsive: {
                0: {
                    items: 1
                },
                480: {
                    items: 1
                },
                760: {
                    items: 1
                },
                992: {
                    items: 1
                },
            }
        });
    }
    Latestblogs_carousel();
/* Related video slider */
function Relatedvideo_carousel() {
    var owl = $(".Relatedvideo-carousel");
    owl.owlCarousel({
        loop: true,
        margin: 20,
        responsiveClass: true,
        navigation: true,
        navText: ["<i class='fas fa-angle-left'></i>", "<i class='fas fa-angle-right'></i>"],
        nav: true,
        items: 4,
        smartSpeed: 1000,
        dots: false,
        autoplay: false,
        autoplayTimeout: 4000,
        center: false,
        responsive: {
            0: {
                items: 1
            },
            480: {
                items: 1
            },
            760: {
                items: 3
            },
            992: {
                items: 4
            },
        }
    });
}
Relatedvideo_carousel();

// button animation
const button = document.querySelector('.buttonAnim');
const submit = document.querySelector('.submit');

function toggleClass() {
	this.classList.toggle('active');
}

function addClass() {
	this.classList.add('finished');
}

button.addEventListener('click', toggleClass);
button.addEventListener('transitionend', toggleClass);
button.addEventListener('transitionend', addClass);

/*------------------------
video sidebar
--------------------------*/
function myFunction() {
    document.getElementsByClassName(".videoSidebar").style.marginTop = "50px";
}



$(document).ready(function() {
    var divHeight = $('.videoHeight').height(); 
    $('.videoSidebar').css('height', divHeight+'px');
});  


$(document).ready(function(){
    $('#menu').slicknav();
});