/* Modifided script from the simple-page-ordering plugin */
var ajaxurl;
jQuery(function($) {
	$('table.widefat.category-table tbody th, table.category-table tbody tr').css('cursor','move');
	$("table.category-table").sortable({
		items: 'tbody tr:not(.inline-edit-row)',
		cursor: 'move',
		axis: 'y',
		forcePlaceholderSize: true,
		helper: function (e, item) {
			return item.clone();
		},
		opacity: .3,
		placeholder: 'product-cat-placeholder',
		scrollSensitivity: 40,
		start: function(event, ui) {
			ui.placeholder.html(ui.item.html());
			if ( ! ui.item.hasClass('alternate') ) ui.item.css( 'background-color', '#ffffff' );
			ui.item.children('td,th').css('border-bottom-width','0');
			ui.item.css( 'outline', '1px solid #aaa' );
		},
		stop: function(event, ui) {
			ui.item.removeAttr('style');
			ui.item.css('cursor','move');
			ui.item.children('td,th').css('border-bottom-width','1px');
		},
		update: function(event, ui) {
			$('table.category-table tbody th, table.widefat tbody td').css('cursor','default');
			$("table.category-table tbody").sortable('disable');
			var termid = ui.item.find('.check-category-id').val();	// this post id
			var termparent = ui.item.find('.parent').html(); 	// post parent

			var prevtermid = ui.item.prev().find('.check-category-id').val();
			var nexttermid = ui.item.next().find('.check-category-id').val();
			
			// can only sort in same tree
			var prevtermparent = undefined;
			if ( prevtermid != undefined ) {
				var prevtermparent = ui.item.prev().find('.parent').html();
				if ( prevtermparent != termparent) prevtermid = undefined;
			}

			var nexttermparent = undefined;
			if ( nexttermid != undefined ) {
				nexttermparent = ui.item.next().find('.parent').html();
				if ( nexttermparent != termparent) nexttermid = undefined;
			}
			// if previous and next not at same tree level, or next not at same tree level and the previous is the parent of the next, or just moved item beneath its own children
			if ( ( prevtermid == undefined && nexttermid == undefined ) || ( nexttermid == undefined && nexttermparent == prevtermid ) || ( nexttermid != undefined && prevtermparent == termid ) ) {
				$("table.category-table").sortable('cancel');
				return;
			}
			var articleorder="";
			$(".ui-sortable tbody tr").each(function(i) {
        if (articleorder=='')
            articleorder = $(this).attr('data-category-id');
        else
            articleorder += "," + $(this).attr('data-category-id');
    });
			// show spinner
			var imageURL = "/dist/img/spin_light.gif";
			ui.item.find('.check-category-id').hide().after('<img alt="processing" src="'+imageURL+'" class="waiting" style="margin-left: 6px;" />');
			// go do the sorting stuff via ajax
			$.post( ajaxurl, {id: termid, nextid: nexttermid,articleorder:articleorder}, function(response){
				$('table.category-table tbody th, table.category-table tbody td').css('cursor','move');
				$("table.category-table tbody").sortable('enable');
				if ( response == 'children' ) window.location.reload();
				else {
					ui.item.find('.check-category-id').show().siblings('img').remove();
				}
			});
			// fix cell colors
			$( 'table.category-table tbody tr' ).each(function(){
				 jQuery(this).css('cursor','move');
			});
		}
	});

});
