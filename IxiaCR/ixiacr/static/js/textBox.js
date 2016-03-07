var mobile = {};
mobile.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);

//Clear Textbox button
$(document).ready(function(){
	//TODO: turn off for IE10+
	//if(!mobile.isMobile){
	//	return;
	//}

	var counter = 0;
	var textBoxes = {};
	
	function clearText(e){
        if (e && e.stopPropagation) {
            e.stopPropagation();
        }

		var textBoxHash = $(this).attr("data-textbox-hash");
        var isTextboxDisable = textBoxes[textBoxHash].attr("disabled");

		if(textBoxHash && textBoxes[textBoxHash]){
			var textBox = textBoxes[textBoxHash],
                e;
            if(!isTextboxDisable){  // do not clear text when textbox is disable, just make (x) icon disappeared
			    textBox.val("").change();
                try {
                e = new Event('change');
                } catch (unused) {
                    // Initialize event for IE
                    e = document.createEvent('Event');
                    e.initEvent('change', true, true);
                }
                textBox.get(0).dispatchEvent(e);
                // Fix for ENT-3606 to trigger events bound with .addEventListener()
            }

			textBox.parent().find(".mobile-clear-text-button").remove();
            //Hung Tran- remove error classed when click x
            textBox.removeClass("invalid");
            textBox.parent().find(".validator-message").remove();
			textBox.trigger('input');
			delete textBoxes[textBoxHash];
		}
	}
	
	$("body").on("input keyup focus", "input[type='text']:not(.no-clear-button), input[type='email']", function(){
		var el = $(this),
            value = el.val(),
            $clear_button,
            offset;
		
		if(value == ""){
			el.parent().find(".mobile-clear-text-button").off();
			el.parent().find(".mobile-clear-text-button").remove();
            el.removeClass("invalid");
            el.parent().find(".validator-message").remove();
			return;
		}

		if(el.parent().find(".mobile-clear-text-button").length == 0){
            $clear_button = $("<a class='mobile-clear-text-button' style='position: absolute;'></a>");
			el.parent().append($clear_button);

            offset = el.position();
            // Align to the right, but inside el (check if element has horizontial margin or not- if yes, include horizontial margin)
            var hasHorizontialMargin = (el.outerWidth(true) - el.outerWidth(false)) / 2;
            hasHorizontialMargin > 0 ? (offset.left += el.outerWidth(true) - 22 - hasHorizontialMargin) : (offset.left += el.outerWidth() - 22);
            offset.top += (el.outerHeight() - $clear_button.outerHeight()) / 2; // Center vertically
		
			el.parent().find(".mobile-clear-text-button").css({ left: offset.left, top: offset.top });
			el.parent().find(".mobile-clear-text-button").on("mousedown click touchstart", clearText);
			
			textBoxes[counter] = el;
			el.parent().find(".mobile-clear-text-button").attr("data-textbox-hash", counter);
			counter++;
		}
	});

    $("body").on("blur", "input[type='text'], input[type='email']" ,  function(e){
		var el = $(this);

        el.parent().find(".mobile-clear-text-button").off();
        el.parent().find(".mobile-clear-text-button").remove();

	});
});