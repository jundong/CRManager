"use strict";

(function($) {
	var touchPreferred = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent); //Not set in stone but there's no way to feature detect devices for touchsceens or figure out which is preferred
	var internal = {};
	
	internal.init = function(options){
		options = $.extend({}, $.fn.scroller.defaultOptions, options);
	
		var panel = internal.createHtml(this);
		internal.setCss(panel, options);
		internal.setData(panel, options);
		internal.update.call(this);
		
		return panel;
	}
	
	internal.createHtml = function(el){
		var panel = el
			.wrap("<div class='scroll-panel'><div class='scroll-container' /></div>")
			.parent()
			.parent()
			.prepend("<div class='scroller'><div class='scroll-track'><a class='scroll-handle'></a></div></div>").prepend("<div class='scroll-fader-left'></div><div class='scroll-fader-right'></div>");
		
		return panel;
	}

	internal.setCss = function(panel, options){
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
	
	internal.setData = function(panel, options){
		panel.attr("data-orientation", options.orientation);
	}
	
	internal.attachEvents = function(panel){
		var scroller = panel.find(".scroller");
		var scrollHandle = panel.find(".scroll-handle");
		var scrollContainer = panel.find(".scroll-container");
		var scrollContainerItems = scrollContainer.children(":first-child");
		var scrollingItems = scrollContainerItems.children();
	
		var scrollerTopLimit = 0;
		var scrollerBottomLimit = scroller.height() - scrollHandle.height();
		var scrollerLeftLimit = 0;
		var scrollerRightLimit = scroller.width() - scrollHandle.width();
		
		internal.lastMouseDragLocation = { x: 0, y: 0 };
		internal.lastTouchMoveLocation = { x: 0, y: 0 };
	
		scrollHandle
			.on("mousedown.scroller", internal.mousedown.bind(panel))
			.on("dragstart.scroller", internal.cancel); //prevents default link dragging in some browsers
		panel
			.on("touchstart.scroller", internal.touchstart.bind(panel))
			.on("touchmove.scroller", internal.touchdrag.bind(panel))
			.on("mousewheel.scroller DOMMouseScroll.scroller wheel.scroller", internal.wheel.bind(panel))
	}
	
	internal.mousedown = function(e){
		$(document)
			.on("mousemove.scroller", internal.mousedrag.bind(this))
			.on("mouseup.scroller", internal.mouseup);
		internal.lastMouseDragLocation = { x: e.pageX, y : e.pageY };
		// Prevent whatever behavior FF is trying to use...
		if($.browser.mozilla){
			e.preventDefault();
		}
	};
		
	internal.touchstart = function(e){
		var e = e.originalEvent.targetTouches[0];
		$(document)
			.on("touchmove.scroller", internal.touchdrag.bind(this))
			.on("touchend.scroller touchcancel.scroller", internal.touchend);
		internal.lastTouchMoveLocation = { x: e.pageX, y : e.pageY };
	};
		
	internal.wheel = function(e){
		e = e.originalEvent;
		
		var panel = this;
		var scrollHandle = panel.find(".scroll-handle");
		var scroller = panel.find(".scroller");
		var scrollContainer = panel.find(".scroll-container");
		var scrollContainerItems = scrollContainer.children(":first-child");
		
		var direction = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
		var delta = 20 * direction;
		var orientation = $(panel).attr("data-orientation");
		var scrollLimit = internal.getScrollLimit(orientation, scrollHandle, scroller);
		
		var newHandleLocation;
		if(orientation == "vertical"){
			newHandleLocation = {
				x : internal.parsePx(scrollHandle.css("left")),
				y : internal.bound((internal.parsePx(scrollHandle.css("top")) - delta), scrollLimit, 0)
			}
		}else{
			newHandleLocation = {
				x : internal.bound((internal.parsePx(scrollHandle.css("left")) + delta), scrollLimit, 0),
				y : internal.parsePx(scrollHandle.css("top"))
			}
		}
		
		scrollHandle.css({ left : newHandleLocation.x, top : newHandleLocation.y });
		
		switch(orientation){
			case "vertical":
				var ratio = newHandleLocation.y / scrollLimit;
				var scrollContainerItemsLocation = ratio * (scrollContainerItems.height() - scrollContainer.height());
				scrollContainerItems.css({ top : (scrollContainerItemsLocation * -1) });
				break;
			case "horizontal":
				var ratio = newHandleLocation.x / scrollLimit;
				var scrollContainerItemsLocation = ratio * (scrollContainerItems.width() - scrollContainer.width());
				scrollContainerItems.css({ left : (scrollContainerItemsLocation * -1) });
				break;
		}
		
		e.preventDefault();	//don't scroll whole page or anything beneath this
		e.stopPropagation();
	};
	
	internal.getScrollLimit = function(orientation, handle, scroller){
		return orientation == "vertical" ? scroller.height() - handle.height() : scroller.width() - handle.width();
	}
	
	internal.mouseup = function(e){
		$(document)
			.off("mousemove.scroller")
			.off("mouseup.scroller");
	};
	
	internal.touchend = function(e){
		$(document)
			.off("touchmove.scroller")
			.off("touchend.scroller");
	};
	
	internal.mousedrag = function(e){
		var eventData = e.originalEvent;
		
		var panel = this;
		var scrollHandle = panel.find(".scroll-handle");
		var scroller = panel.find(".scroller");
		var scrollContainer = panel.find(".scroll-container");
		var scrollContainerItems = scrollContainer.children(":first-child");
		
		var orientation = $(panel).attr("data-orientation");
		
		var scrollLimit = internal.getScrollLimit(orientation, scrollHandle, scroller);
		
		var dragOffset = {
			x : eventData.pageX - internal.lastMouseDragLocation.x,
			y : eventData.pageY - internal.lastMouseDragLocation.y
		};
		
		var newHandleLocation;
		if(orientation == "vertical"){
			newHandleLocation = {
				x : internal.parsePx(scrollHandle.css("left")),
				y : internal.bound(internal.parsePx(scrollHandle.css("top")) + dragOffset.y, scrollLimit, 0)
			};
		}else{
			newHandleLocation = {
				x : internal.bound(internal.parsePx(scrollHandle.css("left")) + dragOffset.x, scrollLimit, 0),
				y : internal.parsePx(scrollHandle.css("top"))
			};
		}
	
		scrollHandle.css({ top : newHandleLocation.y, left : newHandleLocation.x });
		
		switch(orientation){
			case "vertical":
				var ratio = newHandleLocation.y / scrollLimit;
				var scrollContainerItemsLocation = ratio * (scrollContainerItems.height() - scrollContainer.height());
				scrollContainerItems.css({ top : (scrollContainerItemsLocation * -1) });
				break;
			case "horizontal":
				var ratio = newHandleLocation.x / scrollLimit;
				var scrollContainerItemsLocation = ratio * (scrollContainerItems.width() - scrollContainer.width());
				scrollContainerItems.css({ left : (scrollContainerItemsLocation * -1) });
				break;
		}
		
		internal.lastMouseDragLocation = {
			x : eventData.pageX,
			y : eventData.pageY
		};
		
		eventData.preventDefault();
	};
		
	internal.touchdrag = function(e){
		var eventData = e.originalEvent.targetTouches[0];
		
		var panel = this;
		var scrollHandle = panel.find(".scroll-handle");
		var scroller = panel.find(".scroller");
		var scrollContainer = panel.find(".scroll-container");
		var scrollContainerItems = scrollContainer.children(":first-child");
		
		var orientation = $(panel).attr("data-orientation");
		
		var scrollerTopLimit = 0;
		var scrollerBottomLimit = scroller.height() - scrollHandle.height();
		var scrollerLeftLimit = 0;
		var scrollerRightLimit = scroller.width() - scrollHandle.width();
		
		var dragOffset = {
			x : eventData.pageX - internal.lastTouchMoveLocation.x,
			y : eventData.pageY - internal.lastTouchMoveLocation.y
		};
		
		var newScrollLocation = { x: 0, y: 0 };
		
		switch(orientation){
			case "vertical":
				newScrollLocation = {
					x : internal.parsePx(scrollContainerItems.css("left")),
					y : internal.bound(internal.parsePx(scrollContainerItems.css("top")) + dragOffset.y, 0, -1 * (scrollContainerItems.height() - scrollContainer.height()))
				};
				break;
			case "horizontal":
				newScrollLocation = {
					x : internal.bound(internal.parsePx(scrollContainerItems.css("left")) + dragOffset.x, 0, -1 * (scrollContainerItems.width() - scrollContainer.width())),
					y : internal.parsePx(scrollContainerItems.css("top"))
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
		
		
		internal.lastTouchMoveLocation = {
			x : eventData.pageX,
			y : eventData.pageY
		};
		
		e.preventDefault();
	};
	
	internal.cancel = function(e){
		e.preventDefault();
		e.stopPropagation();
	};
	
	internal.detachEvents = function(panel){
		var scrollHandle = panel.find(".scroll-handle");

		$(document).off(".scroller"); //this could cause some edge cases since all scrollers use document-level events when currently dragging
		scrollHandle.off(".scroller");
		panel.off(".scroller");
	}
	
	internal.update = function(){
		var panel = this.parent().parent();
		
		for(var i = 0; i < panel.length; i++){
			var thisPanel = panel.eq(i);
			
			var scrollContainer = thisPanel.find(".scroll-container");
			var scrollContainerItems = scrollContainer.children(":first-child");
			var scroller = thisPanel.find(".scroller");
			
			var orientation = thisPanel.attr("data-orientation");
			
			if((orientation == "vertical" && scrollContainerItems.height() <= scrollContainer.height())
				|| (orientation == "horizontal" && scrollContainerItems.width() <= scrollContainer.width())){
				internal.detachEvents(thisPanel);
				scroller.css("visibility", "hidden");
			}else{
				scroller.css("visibility", "visible");
				internal.detachEvents(thisPanel);
				internal.attachEvents(thisPanel);
			}
			
			internal.reset.call(scrollContainerItems);
		}
	}
	
	internal.reset = function(){
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
	internal.bound = function(value, high, low){
		value = Math.max(value, low);
		value = Math.min(value, high);
		return value;
	};
	
	internal.parsePx = function(value){
		return parseInt(value.replace("px", ""));
	};
	
	//-----------------------------------------------
	//END utility methods
	//-----------------------------------------------
	
	internal.publicMethods = {
		init : internal.init,
		update : internal.update, //Use when item CSS or number changes to see if the scroll panel should update itself (eg no scrollbar necessary)
		reset : internal.reset //use to reset scroll bar to beginning
	};

    jQuery.fn.scroller = function(method) {
        if (internal.publicMethods[method]) {
            return internal.publicMethods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return internal.publicMethods.init.apply(this, arguments);
        } else {
            console.error('Method ' + method + ' does not exist on jQuery.scroller');
        }
        return this;
    };
	
	jQuery.fn.scroller.defaultOptions = {
		orientation : "vertical",
		hidden : false
	};
	
	//-----------------------------------------------
	// Internals (Used for exposing methods during unit tests)
	//-----------------------------------------------
	window.internals = window.internals || {};
	window.internals.jQueryScroller = function(){
		console.log("Requesting jQuery.Scroller internal methods.  Are you debugging?");
		return internal;
	}
})(jQuery);