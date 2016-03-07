"use strict";

(function($) {
	var touchPreferred = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent); //Not set in stone but there's no way to feature detect devices for touchsceens or figure out which is preferred
	
	function init(options){
		options = $.extend({}, $.fn.scroller.defaultOptions, options);
	
		var panel = createHtml(this);
		setCss(panel, options);
		setData(panel, options);
		update.call(this);
		
		return panel;
	}
	
	function createHtml(el){
		el.wrap("<div class='scroll-panel'><div class='scroll-container' /></div>");
		var panel = el.parent().parent().prepend("<div class='scroller'><div class='scroll-track'><a class='scroll-handle'></a></div></div>");
		
		return panel;
	}

	function setCss(panel, options){
		panel.addClass(options.orientation);
		panel.find(".scroll-track").css({ position: "relative" });
		panel.find(".scroll-handle").css({ position : "absolute" });
		panel.find(".scroll-container").css({ position : "relative" });
		panel.find(".scroll-container").children(":first-child").css({ position: "absolute", top: "0px", left: "0px" });
		
		switch(options.orientation){
			case "vertical":
				panel.find(".scroll-handle").css({ top : "0px" });
				break;
			case "horizontal":
				panel.find(".scroll-handle").css({ left : "0px" });
				panel.find(".scroll-container").children(":first-child").css({ "white-space": "nowrap" });
				panel.find(".scroll-container").children(":first-child").children().css({ display: "inline-block" });
				break;
		}
		
		if(touchPreferred){
			panel.addClass("touch-preferred");
		}
		
		if(options.hidden){
			panel.hide();
		}
	}
	
	function setData(panel, options){
		panel.attr("data-orientation", options.orientation);
	}
	
	function attachEvents(panel){
		var scroller = panel.find(".scroller");
		var scrollHandle = panel.find(".scroll-handle");
		var scrollContainer = panel.find(".scroll-container");
		var scrollContainerItems = scrollContainer.children(":first-child");
		var scrollingItems = scrollContainerItems.children();
	
		var scrollerTopLimit = 0;
		var scrollerBottomLimit = scroller.height() - scrollHandle.height();
		var scrollerLeftLimit = 0;
		var scrollerRightLimit = scroller.width() - scrollHandle.width();
		
		var lastMouseDragLocation = { x: 0, y: 0 };
		var lastTouchMoveLocation = { x: 0, y: 0 };
	
		scrollHandle
			.on("mousedown.scroller", mousedown)
			.on("dragstart.scroller", cancel); //prevents default link dragging in some browsers
		panel
			.on("touchstart.scroller", touchstart)
			.on("touchmove.scroller", touchdrag)
			.on("mousewheel.scroller DOMMouseScroll.scroller wheel.scroller", wheel)
		
		function mousedown(e){
			$(document)
				.on("mousemove.scroller", mousedrag)
				.on("mouseup.scroller", mouseup);
			lastMouseDragLocation = { x: e.pageX, y : e.pageY };
		}
		
		function touchstart(e){
			var e = e.originalEvent.targetTouches[0];
			$(document)
				.on("touchmove.scroller", touchdrag)
				.on("touchend.scroller touchcancel.scroller", touchend);
			lastTouchMoveLocation = { x: e.pageX, y : e.pageY };
		}
		
		function wheel(e){
			e = e.originalEvent;
			var direction = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
			var delta = 20 * direction;
			var orientation = $(panel).attr("data-orientation");
			
			var newHandleLocation;
			if(orientation == "vertical"){
				newHandleLocation = {
					x : parsePx(scrollHandle.css("left")),
					y : bound((parsePx(scrollHandle.css("top")) - delta), scrollerBottomLimit, scrollerTopLimit)
				}
			}else{
				newHandleLocation = {
					x : bound((parsePx(scrollHandle.css("left")) + delta), scrollerRightLimit, scrollerLeftLimit),
					y : parsePx(scrollHandle.css("top"))
				}
			}
			
			scrollHandle.css({ left : newHandleLocation.x, top : newHandleLocation.y });
			
			switch(orientation){
				case "vertical":
					var ratio = newHandleLocation.y / scrollerBottomLimit;
					var scrollContainerItemsLocation = ratio * (scrollContainerItems.height() - scrollContainer.height());
					scrollContainerItems.css({ top : (scrollContainerItemsLocation * -1) });
					break;
				case "horizontal":
					var ratio = newHandleLocation.x / scrollerRightLimit;
					var scrollContainerItemsLocation = ratio * (scrollContainerItems.width() - scrollContainer.width());
					scrollContainerItems.css({ left : (scrollContainerItemsLocation * -1) });
					break;
			}
			
			e.preventDefault();	//don't scroll whole page or anything beneath this
			e.stopPropagation();
		}
		
		function mouseup(e){
			$(document)
				.off("mousemove.scroller")
				.off("mouseup.scroller");
		}
		
		function touchend(e){
			$(document)
				.off("touchmove.scroller")
				.off("touchend.scroller");
		}
	
		function mousedrag(e){
			var eventData = e.originalEvent;
			var orientation = $(panel).attr("data-orientation");
			
			var dragOffset = {
				x : eventData.pageX - lastMouseDragLocation.x,
				y : eventData.pageY - lastMouseDragLocation.y
			};
			
			var newHandleLocation;
			if(orientation == "vertical"){
				newHandleLocation = {
					x : parsePx(scrollHandle.css("left")),
					y : bound(parsePx(scrollHandle.css("top")) + dragOffset.y, scrollerBottomLimit, scrollerTopLimit)
				};
			}else{
				newHandleLocation = {
					x : bound(parsePx(scrollHandle.css("left")) + dragOffset.x, scrollerRightLimit, scrollerLeftLimit),
					y : parsePx(scrollHandle.css("top"))
				};
			}
		
			scrollHandle.css({ top : newHandleLocation.y, left : newHandleLocation.x });
			
			switch(orientation){
				case "vertical":
					var ratio = newHandleLocation.y / scrollerBottomLimit;
					var scrollContainerItemsLocation = ratio * (scrollContainerItems.height() - scrollContainer.height());
					scrollContainerItems.css({ top : (scrollContainerItemsLocation * -1) });
					break;
				case "horizontal":
					var ratio = newHandleLocation.x / scrollerRightLimit;
					var scrollContainerItemsLocation = ratio * (scrollContainerItems.width() - scrollContainer.width());
					scrollContainerItems.css({ left : (scrollContainerItemsLocation * -1) });
					break;
			}
			
			lastMouseDragLocation = {
				x : eventData.pageX,
				y : eventData.pageY
			};
		}
		
		function touchdrag(e){
			var eventData = e.originalEvent.targetTouches[0];
			var orientation = $(panel).attr("data-orientation");
			
			var dragOffset = {
				x : eventData.pageX - lastTouchMoveLocation.x,
				y : eventData.pageY - lastTouchMoveLocation.y
			};
			
			var newScrollLocation = { x: 0, y: 0 };
			
			switch(orientation){
				case "vertical":
					newScrollLocation = {
						x : parsePx(scrollContainerItems.css("left")),
						y : bound(parsePx(scrollContainerItems.css("top")) + dragOffset.y, 0, -1 * (scrollContainerItems.height() - scrollContainer.height()))
					};
					break;
				case "horizontal":
					newScrollLocation = {
						x : bound(parsePx(scrollContainerItems.css("left")) + dragOffset.x, 0, -1 * (scrollContainerItems.width() - scrollContainer.width())),
						y : parsePx(scrollContainerItems.css("top"))
					};
					break;
			}
		
			scrollContainerItems.css({
				left : newScrollLocation.x,
				top : newScrollLocation.y
			});
			
			switch(orientation){
				case "vertical":
					var ratio = newScrollLocation.y / (scrollContainerItems.height() - scrollContainer.height());
					var scrollHandleLocation = ratio * scrollerBottomLimit;
					scrollHandle.css({ top : (scrollHandleLocation.y * -1) });
					break;
				case "horizontal":
					var ratio = newScrollLocation.x / (scrollContainerItems.width() - scrollContainer.width());
					var scrollHandleLocation = ratio * scrollerRightLimit;
					scrollHandle.css({ left : scrollHandleLocation.x });
					break;
			}
			
			
			lastTouchMoveLocation = {
				x : eventData.pageX,
				y : eventData.pageY
			};
			
			e.preventDefault();
		}
		
		function cancel(e){
			e.preventDefault();
			e.stopPropagation();
		};
	}
	
	function detachEvents(panel){
		var scrollHandle = panel.find(".scroll-handle");

		$(document).off(".scroller"); //this could cause some edge cases since all scrollers use document-level events when currently dragging
		scrollHandle.off(".scroller");
		panel.off(".scroller");
	}
	
	function update(){
		var panel = this.parent().parent();
		
		for(var i = 0; i < panel.length; i++){
			var thisPanel = panel.eq(i);
			
			var scrollContainer = thisPanel.find(".scroll-container");
			var scrollContainerItems = scrollContainer.children(":first-child");
			var scroller = thisPanel.find(".scroller");
			
			var orientation = thisPanel.attr("data-orientation");
			
			if(orientation == "vertical" && scrollContainerItems.height() <= scrollContainer.height()
				|| orientation == "horizontal" && scrollContainerItems.width() <= scrollContainer.width()){
				detachEvents(thisPanel);
				scroller.css("visibility", "hidden");
			}else{
				scroller.css("visibility", "visible");
				attachEvents(thisPanel);
			}
			
			reset.call(scrollContainerItems);
		}
	}
	
	function reset(){
		var panel = this.parent().parent();
		var scrollContainerItems = panel.find(".scroll-container").children(":first-child");
		var scrollHandle = panel.find(".scroll-handle");
		
		var orientation = $(panel).attr("data-orientation");

		switch(orientation){
			case "vertical":
				scrollContainerItems.css({ top: 0 })
				scrollHandle.css({ top : 0 });
				break;
			case "horizontal":
				scrollContainerItems.css({ left: 0 })
				scrollHandle.css({ left : 0 });
				break;
		}
	}
	
	//---------------------------------------------
	//utility methods
	//---------------------------------------------
	function bound(value, high, low){
		value = Math.max(value, low);
		value = Math.min(value, high);
		return value;
	}
	
	function parsePx(value){
		return parseInt(value.replace("px", ""));
	}
	
	function isFloated(element){
		var floatCss = element.css("float");
		return floatCss == "right" || floatCss == "left";
	}
	
	function isVisible(element){
		return element.css("display") !== "none";
	}
	
	function isVisiblyFloated(element){
		return isFloated(element) && isVisible(element);
	}
	
	function add(value){
		return this + value;
	}
	
	function subtract(value){
		return this - value;
	}
	
	function multiply(value){
		return this * value;
	}
	
	function divideBy(value){
		return this / value;
	}
	
	//executes function on all properties of obj, each object parameter thereafter will have each matching property passed in as an argument to the applied function
	function objectApply(func, obj){
		var args = Array.prototype.slice.call(arguments, 0); //Trivia: arguments are not a real array
		var result = {};

		for(var key in obj){
			var flattenedArgs = [];
			for(var i = 2; i < args.length; i++){
				var arg = args[i][key];
				if(args[i][key] !== undefined){
					flattenedArgs.push(arg);
				}
			}
			result[key] = func.apply(obj[key], flattenedArgs);
		}
	
		return result;
	}
	
	//-----------------------------------------------
	//END utility methods
	//-----------------------------------------------
	
	var publicMethods = {
		init : init,
		update : update, //Use when item CSS or number changes to see if the scroll panel should update itself (eg no scrollbar necessary)
		reset : reset //use to reset scroll bar to beginning
	};

    jQuery.fn.scroller = function(method) {
        if (publicMethods[method]) {
            return publicMethods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return publicMethods.init.apply(this, arguments);
        } else {
            console.error('Method ' + method + ' does not exist on jQuery.scroller');
        }
        return this;
    };
	
	jQuery.fn.scroller.defaultOptions = {
		orientation : "vertical",
		hidden : false
	};
})(jQuery);