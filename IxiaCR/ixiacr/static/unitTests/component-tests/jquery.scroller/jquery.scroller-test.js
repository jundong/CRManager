//Sinon uses fake timer by default, messes up ajax tests.
sinon.config.useFakeTimers = false
//Qunit will run async tests out of order, this can mess up test
QUnit.config.reorder = false;

module("jQuery fn.scroller");

test("Calls Method", function(){
	var scroller = window.internals.jQueryScroller();
	
	this.stub(scroller.publicMethods);
	
	jQuery.fn.scroller("init");
	
	ok(scroller.publicMethods.init.calledOnce);
});

test("Calls Method With Args", function(){
	var scroller = window.internals.jQueryScroller();
	
	this.stub(scroller.publicMethods);
	
	jQuery.fn.scroller("update", "arg1", "arg2");
	
	ok(scroller.publicMethods.update.calledWith("arg1", "arg2"));
});

module("Init");

test("Inits Scroller", function(){
	var scroller = window.internals.jQueryScroller();

	var htmlPanel = {};
	var options = {};
	
	this.stub($, "extend").returns(options);
	this.stub(scroller, "createHtml").returns(htmlPanel);
	this.stub(scroller, "setCss");
	this.stub(scroller, "setData");
	this.stub(scroller, "update");
	
	var fakeContext = { ctx : "fake" };
	
	scroller.init.call(fakeContext);
	
	ok($.extend.calledWith({}, $.fn.scroller.defaultOptions), "extends options");
	ok(scroller.createHtml.calledWith(fakeContext), "creates html");
	ok(scroller.setCss.calledWith(htmlPanel, options), "sets sss");
	ok(scroller.setData.calledWith(htmlPanel, options), "sets data");
	ok(scroller.update.calledOn(fakeContext), "updates");
});

test("Inits Scroller With Options", function(){
	var scroller = window.internals.jQueryScroller();

	var htmlPanel = {};
	var options = { orienation : "horizontal" };
	
	this.stub($, "extend").returns(options);
	this.stub(scroller, "createHtml").returns(htmlPanel);
	this.stub(scroller, "setCss");
	this.stub(scroller, "setData");
	this.stub(scroller, "update");
	
	var fakeContext = { ctx : "fake" };
	
	scroller.init.call(fakeContext, options);
	
	ok($.extend.calledWith({}, $.fn.scroller.defaultOptions, options), "extends options");
	ok(scroller.createHtml.calledWith(fakeContext), "creates html");
	ok(scroller.setCss.called, "sets sss");
	ok(scroller.setData.called, "sets data");
	ok(scroller.update.calledOn(fakeContext), "updates");
});

module("CreateHtml");

test("Creates Scroll Panel", function(){
	var scroller = window.internals.jQueryScroller();
	
	var element = $("<div />");
	
	var panel = scroller.createHtml(element);
	
	ok(panel.hasClass("scroll-panel"), "wraps element in panel");
	ok(panel.find("div.scroll-container").length > 0, "wraps element in container");
	ok(panel.find("div.scroller").length > 0, "adds scroller");
	ok(panel.find("div.scroller > div.scroll-track").length > 0, "adds scroller track");
	ok(panel.find("div.scroller > div.scroll-track > a.scroll-handle").length > 0, "adds scroller handle");
});

module("SetCss");

test("Sets Css", function(){
	var scroller = window.internals.jQueryScroller();
	
	var options = {
		orientation : "vertical"
	};
	
	var panel = $('<div class="scroll-panel vertical" data-orientation="vertical"><div class="scroller"><div class="scroll-track"><a class="scroll-handle"></a></div></div><div class="scroll-container"><ul></ul</div></div>');
	
	scroller.setCss(panel, options);
	
	ok(panel.hasClass(options.orientation), "sets orientation class");
	equal(panel.find(".scroll-track").css("position"), "relative", "sets track positioning");
	equal(panel.find(".scroll-handle").css("position"), "absolute", "sets handle positioning");
	equal(panel.find(".scroll-container").css("position"), "relative", "sets container positioning");
	equal(panel.find(".scroll-container ul").css("position"), "absolute", "sets item positioning");
	equal(panel.find(".scroll-container ul").css("top"), "0px", "sets item positioning top");
	equal(panel.find(".scroll-container ul").css("left"), "0px", "sets item positioning left");
});

test("Sets Css For Vertical", function(){
	var scroller = window.internals.jQueryScroller();
	
	var options = {
		orientation : "vertical"
	};
	
	var panel = $('<div class="scroll-panel vertical" data-orientation="vertical"><div class="scroller"><div class="scroll-track"><a class="scroll-handle"></a></div></div><div class="scroll-container"><ul></ul</div></div>');
	
	scroller.setCss(panel, options);

	equal(panel.find(".scroll-handle").css("top"), "0px", "sets handle top");
});

test("Sets Css For Horizontal", function(){
	var scroller = window.internals.jQueryScroller();
	
	var options = {
		orientation : "horizontal"
	};
	
	var panel = $('<div class="scroll-panel vertical" data-orientation="vertical"><div class="scroller"><div class="scroll-track"><a class="scroll-handle"></a></div></div><div class="scroll-container"><ul><li></li></ul</div></div>');
	
	scroller.setCss(panel, options);

	equal(panel.find(".scroll-handle").css("left"), "0px", "sets handle top");
	equal(panel.find(".scroll-container ul").css("white-space"), "nowrap", "prevents horizontal breaking");
	equal(panel.find(".scroll-container ul li").css("display"), "inline-block", "positions sub-elements");
});

test("Hides Panel", function(){
	var scroller = window.internals.jQueryScroller();
	
	var options = {
		orientation : "horizontal",
		hidden : true
	};
	
	var panel = $('<div class="scroll-panel vertical"><div class="scroller"><div class="scroll-track"><a class="scroll-handle"></a></div></div><div class="scroll-container"><ul><li></li></ul</div></div>');
	
	scroller.setCss(panel, options);
	
	equal(panel.css("display"), "none", "hides panel");
});

module("SetData");

test("Sets Data", function(){
	var scroller = window.internals.jQueryScroller();
	
	var options = {
		orientation : "horizontal"
	}
	
	var panel = $('<div class="scroll-panel vertical"><div class="scroller"><div class="scroll-track"><a class="scroll-handle"></a></div></div><div class="scroll-container"><ul><li></li></ul</div></div>');
	
	scroller.setData(panel, options);
	
	equal(panel.attr("data-orientation"), options.orientation, "tags orientation");
});

module("attachEvents", {
	setup : function(){
		$("#qunit-fixture").append('<div class="scroll-panel vertical"><div class="scroller"><div class="scroll-track"><a class="scroll-handle"></a></div></div><div class="scroll-container"><ul><li></li></ul</div></div>');
	},
	teardown : function(){
		$("#qunit-fixture").empty();
		$(document).off();
	}
});

test("Attaches Events", function(){
	var scroller = window.internals.jQueryScroller();
	
	var panel = $(".scroll-panel");
	
	scroller.attachEvents(panel);
	
	equal($._data(panel.find(".scroll-handle")[0], "events").dragstart.length, 1, "attaches dragstart to handle");
	equal($._data(panel.find(".scroll-handle")[0], "events").mousedown.length, 1, "attaches mousedown handle");
	
	equal($._data(panel[0], "events").touchstart.length, 1, "attaches toucstart");
	equal($._data(panel[0], "events").touchmove.length, 1, "attaches touchmove");
	equal($._data(panel[0], "events").mousewheel.length, 1, "attaches mousewheel");
	equal($._data(panel[0], "events").DOMMouseScroll.length, 1, "attaches DOMMouseScroll");
	equal($._data(panel[0], "events").wheel.length, 1, "attaches wheel");
});

module("mousedown", {
	teardown : function(){
		$(document).off();
	}
});

test("Handles Mousedown", function(){
	var scroller = window.internals.jQueryScroller();
	
	var event = {
		pageX : 99,
		pageY : 88
	};
	
	this.stub(scroller, "mousedrag");
	this.stub(scroller, "mouseup");
	
	var panel = $("<div />");
	
	scroller.mousedown.call(panel, event);
	
	deepEqual(scroller.lastMouseDragLocation, { x : 99, y : 88 }, "sets last location");
	
	$(document).trigger("mousemove");
	
	ok(scroller.mousedrag.calledOnce, "attached one mousemove");
	ok(scroller.mousedrag.calledOn(panel), "mousemove bound to panel");
	
	$(document).trigger("mouseup");
	
	ok(scroller.mouseup.calledOnce, "attached mouseup");
});

module("touchstart", {
	teardown : function(){
		$(document).off();
	}
});

test("Handles Touchstart", function(){
	var scroller = window.internals.jQueryScroller();
	
	var event = {
		originalEvent : {
			targetTouches : [{
				pageX : 98,
				pageY : 87,
			}]
		}
	};
	
	this.stub(scroller, "touchdrag");
	this.stub(scroller, "touchend");
	
	var panel = $("<div />");
	
	scroller.touchstart.call(panel, event);
	
	deepEqual(scroller.lastTouchMoveLocation, { x : 98, y : 87 }, "sets last location");
	
	$(document).trigger("touchmove");
	
	ok(scroller.touchdrag.calledOnce, "attached one touchmove");
	ok(scroller.touchdrag.calledOn(panel), "touchmove bound to panel");
	
	$(document).trigger("touchend");
	
	ok(scroller.touchend.calledOnce, "attached touchend");
});

module("wheel",{
	setup : function(){
		$("#qunit-fixture").append('<div class="scroll-panel vertical" data-orientation="vertical"><div class="scroller"><div class="scroll-track"><a class="scroll-handle"></a></div></div><div class="scroll-container"><ul><li></li></ul</div></div>');
	},
	teardown : function(){
		$("#qunit-fixture").empty();
	}
});

test("Handles Mouse Wheel Vertical, Positive", function(){
	var scroller = window.internals.jQueryScroller();
	
	var event = {
		originalEvent : {
			wheelDelta : 30,
			stopPropagation : this.spy(),
			preventDefault : this.spy()
		}
	};
	
	var panel = $(".scroll-panel");
	var panel_scroller = panel.find(".scroller");
	var handle = panel.find(".scroll-handle");
	var scrollContainer = panel.find(".scroll-container");
	var scrollContainerItems = scrollContainer.children(":first-child");
	
	handle.css({ position: "absolute", top : "30px", left : "30px" });
	scrollContainerItems.css({ position: "absolute", height : "100px" });
	scrollContainer.css({ height : "50px" });
	
	this.stub(scroller, "getScrollLimit", function(orientation, _handle, _scroller){
		ok(handle[0].isSameNode(_handle[0]), "get scroll limit with handle");
		ok(panel_scroller[0].isSameNode(_scroller[0]), "get scroll limit with scroller");
		return 50;
	});
	
	scroller.wheel.call(panel, event);
	
	equal(handle.css("top"), "10px", "handle moves vertical");
	equal(handle.css("left"), "30px", "handle (doesn't) move horizontal");
	equal(scrollContainerItems.css("top"), "-10px", "scrolls items"); 
	ok(event.originalEvent.stopPropagation.calledOnce, "stop propogation");
	ok(event.originalEvent.preventDefault.calledOnce, "prevents default");
});

test("Handles Mouse Wheel Vertical, Negative", function(){
	var scroller = window.internals.jQueryScroller();
	
	var event = {
		originalEvent : {
			wheelDelta : -30,
			stopPropagation : this.spy(),
			preventDefault : this.spy()
		}
	};
	
	var panel = $(".scroll-panel");
	var panel_scroller = panel.find(".scroller");
	var handle = panel.find(".scroll-handle");
	var scrollContainer = panel.find(".scroll-container");
	var scrollContainerItems = scrollContainer.children(":first-child");
	
	handle.css({ position: "absolute", top : "30px", left : "30px" });
	scrollContainerItems.css({ position: "absolute", height : "200px" });
	scrollContainer.css({ height : "100px" });
	
	this.stub(scroller, "getScrollLimit", function(orientation, _handle, _scroller){
		return 100;
	});
	
	scroller.wheel.call(panel, event);
	
	equal(handle.css("top"), "50px", "handle moves vertical");
	equal(scrollContainerItems.css("top"), "-50px", "scrolls items"); 
});

test("Handles Mouse Wheel Horizontal, Positive", function(){
	var scroller = window.internals.jQueryScroller();
	
	var event = {
		originalEvent : {
			wheelDelta : 30,
			stopPropagation : this.spy(),
			preventDefault : this.spy()
		}
	};
	
	var panel = $(".scroll-panel").attr("data-orientation", "horizontal");
	var panel_scroller = panel.find(".scroller");
	var handle = panel.find(".scroll-handle");
	var scrollContainer = panel.find(".scroll-container");
	var scrollContainerItems = scrollContainer.children(":first-child");
	
	handle.css({ position: "absolute", top : "30px", left : "30px" });
	scrollContainerItems.css({ position: "absolute", width : "100px" });
	scrollContainer.css({ width : "50px" });
	
	this.stub(scroller, "getScrollLimit", function(orientation, _handle, _scroller){
		ok(handle[0].isSameNode(_handle[0]), "get scroll limit with handle");
		ok(panel_scroller[0].isSameNode(_scroller[0]), "get scroll limit with scroller");
		return 50;
	});
	
	scroller.wheel.call(panel, event);
	
	equal(handle.css("left"), "50px", "handle moves horizontal");
	equal(handle.css("top"), "30px", "handle (doesn't) move vertical");
	equal(scrollContainerItems.css("left"), "-50px", "scrolls items"); 
	ok(event.originalEvent.stopPropagation.calledOnce, "stop propogation");
	ok(event.originalEvent.preventDefault.calledOnce, "prevents default");
});

test("Handles Mouse Wheel Horizontal, Negative", function(){
	var scroller = window.internals.jQueryScroller();
	
	var event = {
		originalEvent : {
			wheelDelta : -30,
			stopPropagation : this.spy(),
			preventDefault : this.spy()
		}
	};
	
	var panel = $(".scroll-panel").attr("data-orientation", "horizontal");
	var panel_scroller = panel.find(".scroller");
	var handle = panel.find(".scroll-handle");
	var scrollContainer = panel.find(".scroll-container");
	var scrollContainerItems = scrollContainer.children(":first-child");
	
	handle.css({ position: "absolute", top : "30px", left : "30px" });
	scrollContainerItems.css({ position: "absolute", width : "100px" });
	scrollContainer.css({ width : "50px" });
	
	this.stub(scroller, "getScrollLimit", function(orientation, _handle, _scroller){
		return 50;
	});
	
	scroller.wheel.call(panel, event);
	
	equal(handle.css("left"), "10px", "handle moves horizontal");
	equal(handle.css("top"), "30px", "handle (doesn't) move vertical");
	equal(scrollContainerItems.css("left"), "-10px", "scrolls items"); 
});

test("Handles Mouse Wheel Mozilla Style", function(){
	var scroller = window.internals.jQueryScroller();
	
	var event = {
		originalEvent : {
			detail : 30,
			stopPropagation : this.spy(),
			preventDefault : this.spy()
		}
	};
	
	var panel = $(".scroll-panel").attr("data-orientation", "horizontal");
	var panel_scroller = panel.find(".scroller");
	var handle = panel.find(".scroll-handle");
	var scrollContainer = panel.find(".scroll-container");
	var scrollContainerItems = scrollContainer.children(":first-child");
	
	handle.css({ position: "absolute", top : "30px", left : "30px" });
	scrollContainerItems.css({ position: "absolute", width : "100px" });
	scrollContainer.css({ width : "50px" });
	
	this.stub(scroller, "getScrollLimit", function(orientation, _handle, _scroller){
		return 50;
	});
	
	scroller.wheel.call(panel, event);
	
	equal(handle.css("left"), "10px", "handle moves horizontal");
	equal(handle.css("top"), "30px", "handle (doesn't) move vertical");
	equal(scrollContainerItems.css("left"), "-10px", "scrolls items"); 
});

module("getScrollLimit");

test("Gets Vertical Scroll Limit", function(){
	var scroller = window.internals.jQueryScroller();
	
	var handle = {
		height : this.stub().returns(10)
	};
	
	var panel_scroller = {
		height : this.stub().returns(20)
	};
	
	equal(scroller.getScrollLimit("vertical", handle, panel_scroller), 10, "gets limit");
});

test("Gets Vertical Scroll Limit", function(){
	var scroller = window.internals.jQueryScroller();
	
	var handle = {
		width : this.stub().returns(20)
	};
	
	var panel_scroller = {
		width : this.stub().returns(40)
	};
	
	equal(scroller.getScrollLimit("horizontal", handle, panel_scroller), 20, "gets limit");
});

module("mouseup", {
	teardown : function(){
		$(document).off();
	}
});

test("handles mouseup", function(){
	var scroller = window.internals.jQueryScroller();

	var mousemoveSpy = this.spy();
	var mouseupSpy = this.spy();
	
	$(document)
		.on("mousemove.scroller", mousemoveSpy)
		.on("mouseup.scroller", mouseupSpy)
		
	scroller.mouseup();
	
	$(document).trigger("mousemove");
	
	ok(!mousemoveSpy.called, "removes mousemove");
	
	$(document).trigger("mouseup");
	
	ok(!mouseupSpy.called, "removes mouseup");
});

module("touchend", {
	teardown : function(){
		$(document).off();
	}
});

test("handles touchend", function(){
	var scroller = window.internals.jQueryScroller();

	var touchmoveSpy = this.spy();
	var touchendSpy = this.spy();
	
	$(document)
		.on("touchmove.scroller", touchmoveSpy)
		.on("touchend.scroller", touchendSpy)
		
	scroller.touchend();
	
	$(document).trigger("touchmove");
	
	ok(!touchmoveSpy.called, "removes touchmove");
	
	$(document).trigger("touchend");
	
	ok(!touchendSpy.called, "removes touchend");
});

module("mousedrag",{
	setup : function(){
		$("#qunit-fixture").append('<div class="scroll-panel vertical" data-orientation="vertical"><div class="scroller"><div class="scroll-track"><a class="scroll-handle"></a></div></div><div class="scroll-container"><ul><li></li></ul</div></div>');
	},
	teardown : function(){
		$("#qunit-fixture").empty();
	}
});

test("Handles Mouse Drag Vertical, Negative", function(){
	var scroller = window.internals.jQueryScroller();
	
	var event = {
		originalEvent : {
			pageX : 0,
			pageY : -20,
			stopPropagation : this.spy(),
			preventDefault : this.spy()
		}
	};
	
	scroller.lastMouseDragLocation = {
		x : 0,
		y : 0
	};
	
	var panel = $(".scroll-panel");
	var panel_scroller = panel.find(".scroller");
	var handle = panel.find(".scroll-handle");
	var scrollContainer = panel.find(".scroll-container");
	var scrollContainerItems = scrollContainer.children(":first-child");
	
	handle.css({ position: "absolute", top : "30px", left : "30px" });
	scrollContainerItems.css({ position: "absolute", height : "100px" });
	scrollContainer.css({ height : "50px" });
	
	this.stub(scroller, "getScrollLimit", function(orientation, _handle, _scroller){
		ok(handle[0].isSameNode(_handle[0]), "get scroll limit with handle");
		ok(panel_scroller[0].isSameNode(_scroller[0]), "get scroll limit with scroller");
		return 50;
	});
	
	
	scroller.mousedrag.call(panel, event);
	
	equal(handle.css("top"), "10px", "handle moves vertical");
	equal(handle.css("left"), "30px", "handle (doesn't) move horizontal");
	equal(scrollContainerItems.css("top"), "-10px", "scrolls items"); 
	ok(event.originalEvent.preventDefault.calledOnce, "prevents default");
});

test("Handles Mouse Drag Vertical, Positive", function(){
	var scroller = window.internals.jQueryScroller();
	
	var event = {
		originalEvent : {
			pageX : 0,
			pageY : 20,
			stopPropagation : this.spy(),
			preventDefault : this.spy()
		}
	};
	
	scroller.lastMouseDragLocation = {
		x : 0,
		y : 0
	};
	
	var panel = $(".scroll-panel");
	var panel_scroller = panel.find(".scroller");
	var handle = panel.find(".scroll-handle");
	var scrollContainer = panel.find(".scroll-container");
	var scrollContainerItems = scrollContainer.children(":first-child");
	
	handle.css({ position: "absolute", top : "30px", left : "30px" });
	scrollContainerItems.css({ position: "absolute", height : "100px" });
	scrollContainer.css({ height : "50px" });
	
	this.stub(scroller, "getScrollLimit", function(orientation, _handle, _scroller){
		return 50;
	});
	
	scroller.mousedrag.call(panel, event);
	
	equal(handle.css("top"), "50px", "handle moves vertical");
	equal(scrollContainerItems.css("top"), "-50px", "scrolls items"); 
});

test("Handles Mouse Drag Horizontal, Positive", function(){
	var scroller = window.internals.jQueryScroller();
	
	var event = {
		originalEvent : {
			pageX : 20,
			pageY : 0,
			stopPropagation : this.spy(),
			preventDefault : this.spy()
		}
	};
	
	scroller.lastMouseDragLocation = {
		x : 0,
		y : 0
	};
	
	var panel = $(".scroll-panel");
	var panel_scroller = panel.find(".scroller");
	var handle = panel.find(".scroll-handle");
	var scrollContainer = panel.find(".scroll-container");
	var scrollContainerItems = scrollContainer.children(":first-child");
	
	panel.attr("data-orientation", "horizontal");
	handle.css({ position: "absolute", top : "30px", left : "30px" });
	scrollContainerItems.css({ position: "absolute", width : "100px" });
	scrollContainer.css({ width : "50px" });
	
	this.stub(scroller, "getScrollLimit", function(orientation, _handle, _scroller){
		ok(handle[0].isSameNode(_handle[0]), "get scroll limit with handle");
		ok(panel_scroller[0].isSameNode(_scroller[0]), "get scroll limit with scroller");
		return 50;
	});
	
	
	scroller.mousedrag.call(panel, event);
	
	equal(handle.css("left"), "50px", "handle moves horizontal");
	equal(handle.css("top"), "30px", "handle (does not) move vertical");
	equal(scrollContainerItems.css("left"), "-50px", "scrolls items"); 
	ok(event.originalEvent.preventDefault.calledOnce, "prevents default");
});

test("Handles Mouse Drag Horizontal, Negative", function(){
	var scroller = window.internals.jQueryScroller();
	
	var event = {
		originalEvent : {
			pageX : -20,
			pageY : 0,
			stopPropagation : this.spy(),
			preventDefault : this.spy()
		}
	};
	
	scroller.lastMouseDragLocation = {
		x : 0,
		y : 0
	};
	
	var panel = $(".scroll-panel");
	var panel_scroller = panel.find(".scroller");
	var handle = panel.find(".scroll-handle");
	var scrollContainer = panel.find(".scroll-container");
	var scrollContainerItems = scrollContainer.children(":first-child");
	
	panel.attr("data-orientation", "horizontal");
	handle.css({ position: "absolute", top : "30px", left : "30px" });
	scrollContainerItems.css({ position: "absolute", width : "100px" });
	scrollContainer.css({ width : "50px" });
	
	this.stub(scroller, "getScrollLimit", function(orientation, _handle, _scroller){
		ok(handle[0].isSameNode(_handle[0]), "get scroll limit with handle");
		ok(panel_scroller[0].isSameNode(_scroller[0]), "get scroll limit with scroller");
		return 50;
	});
	
	
	scroller.mousedrag.call(panel, event);
	
	equal(handle.css("left"), "10px", "handle moves horizontal");
	equal(handle.css("top"), "30px", "handle (does not) move vertical");
	equal(scrollContainerItems.css("left"), "-10px", "scrolls items"); 
	ok(event.originalEvent.preventDefault.calledOnce, "prevents default");
});

module("touchmove",{
	setup : function(){
		$("#qunit-fixture").append('<div class="scroll-panel vertical" data-orientation="vertical"><div class="scroller"><div class="scroll-track"><a class="scroll-handle"></a></div></div><div class="scroll-container"><ul><li></li></ul</div></div>');
	},
	teardown : function(){
		$("#qunit-fixture").empty();
	}
});

test("Handles Touch Move Vertical, Negative", function(){
	var scroller = window.internals.jQueryScroller();
	
	var event = {
		originalEvent : {
			targetTouches : [{
				pageX : 0,
				pageY : -20
			}]
		},
		preventDefault : this.spy()
	};
	
	scroller.lastTouchMoveLocation = {
		x : 0,
		y : 0
	};
	
	var panel = $(".scroll-panel");
	var scrollContainer = panel.find(".scroll-container");
	var scrollContainerItems = scrollContainer.children(":first-child");
	
	scrollContainerItems.css({ position: "absolute", height : "100px", top: "0px" });
	scrollContainer.css({ height : "50px" });	
	
	scroller.touchdrag.call(panel, event);
	
	equal(scrollContainerItems.css("top"), "-20px", "scrolls items"); 
	ok(event.preventDefault.calledOnce, "prevents default");
});

test("Handles Touch Move Vertical, Negative", function(){
	var scroller = window.internals.jQueryScroller();
	
	var event = {
		originalEvent : {
			targetTouches : [{
				pageX : 0,
				pageY : 20
			}]
		},
		preventDefault : this.spy()
	};
	
	scroller.lastTouchMoveLocation = {
		x : 0,
		y : 0
	};
	
	var panel = $(".scroll-panel");
	var scrollContainer = panel.find(".scroll-container");
	var scrollContainerItems = scrollContainer.children(":first-child");
	
	scrollContainerItems.css({ position: "absolute", height : "200px", top: "-50px" });
	scrollContainer.css({ height : "50px" });	
	
	scroller.touchdrag.call(panel, event);
	
	equal(scrollContainerItems.css("top"), "-30px", "scrolls items"); 
});

test("Handles Touch Move Horizontal, Negative", function(){
	var scroller = window.internals.jQueryScroller();
	
	var event = {
		originalEvent : {
			targetTouches : [{
				pageX : -20,
				pageY : 0
			}]
		},
		preventDefault : this.spy()
	};
	
	scroller.lastTouchMoveLocation = {
		x : 0,
		y : 0
	};
	
	var panel = $(".scroll-panel");
	var scrollContainer = panel.find(".scroll-container");
	var scrollContainerItems = scrollContainer.children(":first-child");
	
	panel.attr("data-orientation", "horizontal");
	scrollContainerItems.css({ position: "absolute", width : "200px", left: "-50px" });
	scrollContainer.css({ width : "50px" });	
	
	scroller.touchdrag.call(panel, event);
	
	equal(scrollContainerItems.css("left"), "-70px", "scrolls items"); 
});

test("Handles Touch Move Horizontal, Positive", function(){
	var scroller = window.internals.jQueryScroller();
	
	var event = {
		originalEvent : {
			targetTouches : [{
				pageX : 20,
				pageY : 0
			}]
		},
		preventDefault : this.spy()
	};
	
	scroller.lastTouchMoveLocation = {
		x : 0,
		y : 0
	};
	
	var panel = $(".scroll-panel");
	var scrollContainer = panel.find(".scroll-container");
	var scrollContainerItems = scrollContainer.children(":first-child");
	
	panel.attr("data-orientation", "horizontal");
	scrollContainerItems.css({ position: "absolute", width : "200px", left: "-50px" });
	scrollContainer.css({ width : "50px" });	
	
	scroller.touchdrag.call(panel, event);
	
	equal(scrollContainerItems.css("left"), "-30px", "scrolls items"); 
});

module("Cancel");

test("Cancels Event", function(){
	var scroller = window.internals.jQueryScroller();
	
	var event = {
		preventDefault : this.spy(),
		stopPropagation : this.spy()
	};
	
	scroller.cancel(event);
	
	ok(event.preventDefault.calledOnce, "prevents default");
	ok(event.stopPropagation.calledOnce, "stops propagation");
});

module("detachEvents",{
	setup : function(){
		$("#qunit-fixture").append('<div class="scroll-panel vertical" data-orientation="vertical"><div class="scroller"><div class="scroll-track"><a class="scroll-handle"></a></div></div><div class="scroll-container"><ul><li></li></ul</div></div>');
	},
	teardown : function(){
		$("#qunit-fixture").empty();
		$(document).off();
	}
});

test("Detaches Events", function(){
	var scroller = window.internals.jQueryScroller();
	
	var documentEventSpy = this.spy();
	var scrollHandleEventSpy = this.spy();
	var panelEventSpy = this.spy();
	
	var panel = $(".scroll-panel");
	var scrollHandle = panel.find(".scroll-handle");
	
	$(document).on("mousedown.scroller", documentEventSpy);
	panel.on("mousedown.scroller", panelEventSpy);
	scrollHandle.on("mousedown.scroller", scrollHandleEventSpy);
	
	scroller.detachEvents(panel);
	
	$(document).trigger("mousedown");
	ok(!documentEventSpy.called, "removes scroller events on document");
	
	panel.trigger("mousedown");
	ok(!panelEventSpy.called, "removes scroller events on panel");
	
	scrollHandle.trigger("mousedown");
	ok(!scrollHandleEventSpy.called, "removes scroller events on scroll handle");
});

module("update",{
	setup : function(){
		$("#qunit-fixture").append('<div class="scroll-panel vertical" data-orientation="vertical"><div class="scroller"><div class="scroll-track"><a class="scroll-handle"></a></div></div><div class="scroll-container"><ul><li></li></ul</div></div>');
	},
	teardown : function(){
		$("#qunit-fixture").empty();
		$(document).off();
	}
});

test("Shows Scroller If Content Exceeds Container (Vertical)", function(){
	var scroller = window.internals.jQueryScroller();

	var panel = $(".scroll-panel");
	var panel_scroller = panel.find(".scroller");
	var scrollContainer = panel.find(".scroll-container");
	var scrollContainerItems = scrollContainer.children(":first-child");
	
	scrollContainerItems.css({ height : "100px" });
	scrollContainer.css({ height : "50px" });
	
	this.stub(scroller, "attachEvents");
	this.stub(scroller, "detachEvents");
	this.stub(scroller, "reset");
	
	scroller.update.call(panel);
	
	equal(panel_scroller.css("visibility"), "visible", "scroller visible");
	ok(scroller.detachEvents.calledOnce, "detaches events");
	ok(scroller.attachEvents.calledOnce, "attaches events");
	ok(scroller.reset.calledOnce, "resets");
});

test("Shows Scroller If Content Exceeds Container (Horizontal)", function(){
	var scroller = window.internals.jQueryScroller();

	var panel = $(".scroll-panel");
	var panel_scroller = panel.find(".scroller");
	var scrollContainer = panel.find(".scroll-container");
	var scrollContainerItems = scrollContainer.children(":first-child");
	
	scrollContainerItems.css({ width : "100px" });
	scrollContainer.css({ width : "50px" });
	
	this.stub(scroller, "attachEvents");
	this.stub(scroller, "detachEvents");
	this.stub(scroller, "reset");
	
	scroller.update.call(panel);
	
	equal(panel_scroller.css("visibility"), "visible", "scroller visible");
	ok(scroller.detachEvents.calledOnce, "detaches events");
	ok(scroller.attachEvents.calledOnce, "attaches events");
	ok(scroller.reset.calledOnce, "resets");
});

test("Hides Scroller and Detach Events If Content is Contained (Veritcal)", function(){
	var scroller = window.internals.jQueryScroller();

	var panel = $(".scroll-panel");
	var panel_scroller = panel.find(".scroller");
	var scrollContainer = panel.find(".scroll-container");
	var scrollContainerItems = scrollContainer.children(":first-child");
	
	scrollContainerItems.css({ height : "50px" });
	scrollContainer.css({ height : "100px" });
	
	this.stub(scroller, "attachEvents");
	this.stub(scroller, "detachEvents");
	this.stub(scroller, "reset");
	
	scroller.update.call(scrollContainerItems);
	
	equal(panel_scroller.css("visibility"), "hidden", "scroller hidden");
	ok(scroller.detachEvents.calledOnce, "detaches events");
	ok(scroller.reset.calledOnce, "resets");
});

test("Hides Scroller and Detach Events If Content is Contained (Horizontal)", function(){
	var scroller = window.internals.jQueryScroller();

	var panel = $(".scroll-panel");
	var panel_scroller = panel.find(".scroller");
	var scrollContainer = panel.find(".scroll-container");
	var scrollContainerItems = scrollContainer.children(":first-child");
	
	panel.attr("data-orientation", "horizontal");
	scrollContainerItems.css({ width : "50px" });
	scrollContainer.css({ width : "100px" });
	
	this.stub(scroller, "attachEvents");
	this.stub(scroller, "detachEvents");
	this.stub(scroller, "reset");
	
	scroller.update.call(scrollContainerItems);
	
	equal(panel_scroller.css("visibility"), "hidden", "scroller hidden");
	ok(scroller.detachEvents.calledOnce, "detaches events");
	ok(scroller.reset.calledOnce, "resets");
});

module("reset");

test("Resets Position (Vertical)", function(){
	var scroller = window.internals.jQueryScroller();

	var panel = $(".scroll-panel");
	var panel_scroller = panel.find(".scroller");
	var scrollContainer = panel.find(".scroll-container");
	var scrollHandle = panel.find(".scroll-handle");
	var scrollContainerItems = scrollContainer.children(":first-child");
	
	scrollContainerItems.css({ top : "50px" });
	scrollHandle.css({ top : "30px" });
	
	scroller.reset.call(scrollContainerItems);
	
	equal(scrollContainerItems.css("top"), undefined, "resets items position");
	equal(scrollHandle.css("top"), undefined, "resets handle position");
});

test("Resets Position (Horizontal)", function(){
	var scroller = window.internals.jQueryScroller();

	var panel = $(".scroll-panel");
	var panel_scroller = panel.find(".scroller");
	var scrollContainer = panel.find(".scroll-container");
	var scrollHandle = panel.find(".scroll-handle");
	var scrollContainerItems = scrollContainer.children(":first-child");
	
	scrollContainerItems.css({ left : "50px" });
	scrollHandle.css({ left : "30px" });
	
	scroller.reset.call(scrollContainerItems);
	
	equal(scrollContainerItems.css("leeft"), undefined, "resets items position");
	equal(scrollHandle.css("left"), undefined, "resets handle position");
})

module("Bound");

test("Bound Value High", function(){
	var scroller = window.internals.jQueryScroller();

	equal(scroller.bound(10, 5, 0), 5);
});

test("Bound Value Low", function(){
	var scroller = window.internals.jQueryScroller();

	equal(scroller.bound(-5, 5, 0), 0);
});

test("Value Already Bound", function(){
	var scroller = window.internals.jQueryScroller();

	equal(scroller.bound(3, 5, 0), 3);
});

module("parsePx");

test("Parse Pixel Value as Int", function(){
	var scroller = window.internals.jQueryScroller();

	equal(scroller.parsePx("3px"), 3);
	equal(scroller.parsePx("10px"), 10);
	equal(scroller.parsePx("151px"), 151);
	equal(scroller.parsePx("1450px"), 1450);
});