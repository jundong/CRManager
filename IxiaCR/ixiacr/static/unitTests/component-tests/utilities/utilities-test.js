//Sinon uses fake timer by default, messes up ajax tests.
sinon.config.useFakeTimers = false
//Qunit will run async tests out of order, this can mess up test
QUnit.config.reorder = false;

module("Get Template", {
	setup : function(){
		$.mockjax({
			url : "test-tmpl.html",
			response : "<script id='test-tmpl'><a class='test-link'></a></script>"
		});
	},
	teardown : function(){
		$("#test-tmpl").remove();
		$.mockjaxClear();
	}
})
asyncTest("Gets Template via Ajax", function(){
	expect(1);
	
	util.getTemplate("test-tmpl.html", "#test-tmpl", function(element){
		equal($("#test-tmpl")[0], element[0]);
		start();
	});
});

asyncTest("Gets Existing Template", function(){
	expect(1);

	var $fixture = $("#qunit-fixture");
	$fixture.append("<div id='test-tmpl'><a class='test-link'></a></div>");
	
	util.getTemplate("test-tmpl.html", "#test-tmpl", function(element){
		equal($("#test-tmpl")[0], element[0]);
		start();
	})
});

asyncTest("Gets Template via Ajax but fails when template not found", function(){
	expect(1);
	
	util.getTemplate("test-tmpl.html", "#does-not-exist-tmpl", function(element){
		equal(element.length, 0);
		start();
	});
});

module("setTags");

test("Sets Tags", function(){
	var tagged = {
		tags : this.spy(),
		customer : this.spy(),
		location : this.spy(),
		favorite : this.spy()
	};
	
	tagged.tags.removeAll = this.spy();
	
	var tagData = {
		"user_defined" : "user",
		"company" : "company",
		"location" : "location",
		"favorite" : "favorite"
	}
	
	util.setTags(tagged, tagData);
	
	ok(tagged.tags.calledOnce);
	ok(tagged.tags.removeAll.calledOnce);
	ok(tagged.customer.calledOnce);
	ok(tagged.location.calledOnce);
	ok(tagged.favorite.calledOnce);
	
});

module("getsTags");

test("Gets Tags", function(){
	
	var tagged = {
		tags : this.stub().returns([ "tag1, tag2, tag3" ]),
		customer : this.stub().returns("customer"),
		location : this.stub().returns("location"),
		favorite : this.stub().returns("favorite")
	};
	
	var tags = util.getTags(tagged);
	
	ok(tagged.tags.calledOnce);
	equal(tags.company, "customer");
	equal(tags.location, "location");
	equal(tags.favorite, "favorite");
	deepEqual(tags.user_defined, [ "tag1, tag2, tag3" ]);
});

test("Does Not get Tag for Placeholder Options", function(){
	
	var tagged = {
		tags : this.stub().returns([]),
		customer : this.stub().returns("select one"),
		location : this.stub().returns("select one"),
		favorite : this.stub().returns("select one")
	};
	
	var tags = util.getTags(tagged);
	
	notEqual(tags.company, "customer");
	notEqual(tags.location, "location");
});

module("isNullOrEmpty");

test("Determines Null or Empty String", function(){
	ok(util.isNullOrEmpty(null));
	ok(util.isNullOrEmpty(''));
	ok(!util.isNullOrEmpty("string"));
	ok(!util.isNullOrEmpty(123));
});

module("objectsEqual");

test("Determine if Object is Equal", function(){
	ok(util.objectsEqual({ prop : "value" }, { prop : "value" }));
	ok(util.objectsEqual({ prop : "value", prop2 : [1, 2, 3] }, { prop : "value", prop2 : [1, 2, 3] }));
	ok(!util.objectsEqual({ prop : "value"}, { prop : "value1" }));
});

module("trueOrOptional");

test("Determine if a True or Optional parameter (default true parameter)", function(){
	var value;
	ok(util.trueOrOptional(value));
	value = true;
	ok(util.trueOrOptional(value));
	value = false;
	ok(!util.trueOrOptional(value));
});

module("toType");

test("Gets the Object's Type", function(){
	function foo(){};
	
	equal(util.toType(new foo()), "object");
	equal(util.toType({}), "object");
	equal(util.toType("hello"), "string");
	equal(util.toType(123), "number");
});

module("setObseervableArray");

test("Puts array into Observable Array", function(){
	var array = [1, 2, 3];
	
	var observableArray = {
		push : this.spy(),
		removeAll : this.spy()
	}
	
	util.setObservableArray(observableArray, array);
	
	ok(observableArray.removeAll.calledOnce);
	ok(observableArray.push.calledWith(1));
	ok(observableArray.push.calledWith(2));
	ok(observableArray.push.calledWith(3));
});

module("commafyNumber");

test("Adds Commas to a Number", function(){
	equal(util.commafyNumber(1000), "1,000");
	equal(util.commafyNumber(100000), "100,000");
	equal(util.commafyNumber(1000000), "1,000,000");
});

module("isNullOrEmpty");

test("Gets Magnitude of a Number", function(){
	equal(util.getMagnitude(12), 10);
	equal(util.getMagnitude(1234), 1000);
	equal(util.getMagnitude(5467), 1000);
	equal(util.getMagnitude(12903), 10000);
	equal(util.getMagnitude(-123), -100);
	equal(util.getMagnitude(2), 1);
	equal(util.getMagnitude(0.2), 0.1);
	equal(util.getMagnitude(0.0006), 0.0001);
	equal(util.getMagnitude(-0.03), -0.01);
	equal(util.getMagnitude(0), 0);
});

module("maxOrDefault")

test("Gets Max or Default", function(){
	equal(util.maxOrDefault(0, 1), 1);
	equal(util.maxOrDefault(2, ""), 2);
	equal(util.maxOrDefault(3), 3);
	equal(util.maxOrDefault(4, false), 4);
	equal(util.maxOrDefault(5, NaN), 5);
	equal(util.maxOrDefault(6, "seven"), 6);
	equal(util.maxOrDefault(7, true), 7);
	equal(util.maxOrDefault(8, 8), 8);
	equal(util.maxOrDefault(9, 9.00000001), 9.00000001);
	equal(util.maxOrDefault(), undefined);
});

module("minOrDefault")

test("Gets Min or Default", function(){
	equal(util.minOrDefault(0, 1), 0);
	equal(util.minOrDefault(2, ""), 2);
	equal(util.minOrDefault(3), 3);
	equal(util.minOrDefault(4, false), 4);
	equal(util.minOrDefault(5, NaN), 5);
	equal(util.minOrDefault(6, "seven"), 6);
	equal(util.minOrDefault(7, true), 7);
	equal(util.minOrDefault(8, 8), 8);
	equal(util.minOrDefault(9, 8.999999999), 8.999999999);
	equal(util.minOrDefault(), undefined);
});

module("padNumber")

test("Pads Number", function(){
	equal(util.padNumber(1, 3), "001");
	equal(util.padNumber(1, 5), "00001");
	equal(util.padNumber(5555, 3), "5555");
});

module("recursiveUnwrapObservable")

test("Recursively Unwraps a Knockout Observable", function(){
	var ob = ko.observable(22);
	
	equal(util.recursiveUnwrapObservable(ob), 22);
	
	var ob2 = ko.observable(ko.observable(ko.observable(20)));
	
	equal(util.recursiveUnwrapObservable(ob2), 20);
});

module("stringAdd")

test("Adds strings as Numbers", function(){
	strictEqual(util.stringAdd("2", "3"), "5");
	strictEqual(util.stringAdd("10", "18"), "28");
	strictEqual(util.stringAdd("2", "3", "5", "1"), "11");
});

module("applyFunction");

test("Applies Function to an Array", function(){
	var array = [
		{ value : 1 }, 
		{ value : 2 }, 
		{ value : 3 }
	];
	
	var addOne = function(){
		this.value += 1;
	}
	
	util.applyFunction(array, addOne);
	
	deepEqual(array, [{ value : 2} , { value : 3 }, { value : 4 }]);
});

test("Applies Function to an Array with Args", function(){
	var array = [
		{ value: 1}, 
		{ value: 2}, 
		{ value: 3}
	];
	
	var add = function(value){
		this.value += value;
	}
	
	util.applyFunction(array, add, [3]);
	
	deepEqual(array, [{ value : 4} , { value : 5 }, { value : 6 }]);
});

test("Applies Function via object property lookup", function(){
	var MyClass = function(value){
		this.value = value;
	};
	MyClass.prototype.addOne = function(){
		this.value += 1;
	};
	
	var array = [
		new MyClass(1), 
		new MyClass(2), 
		new MyClass(3)
	];
	
	util.applyFunction(array, "addOne");
	
	equal(array[0].value, 2);
	equal(array[1].value, 3);
	equal(array[2].value, 4);
});

module("arraysShareValue");

test("Determines if Arrays Share a value", function(){
	var array1 = [1, 2, 3, 4];
	var array2 = [4, 5, 6, 7];
	var array3 = [8, 9, 10, 11];
	
	ok(util.arraysShareValue(array1, array2));
	ok(!util.arraysShareValue(array1, array3));
});

test("Determines if Arrays Share a value (Case Insensitive)", function(){
	var array1 = [1, 2, 3, 4];
	var array2 = [4, 5, 6, 7];
	var array3 = [8, 9, 10, 11];
	
	ok(util.arraysShareValue(array1, array2));
	ok(!util.arraysShareValue(array1, array3));
});

module("Lightbox", {
	setup : function(){
		var fixture = document.getElementById("qunit-fixture");
		var script = document.createElement( 'script' );
		script.id = "lightbox-tmpl";
		script.type = 'text/html';
		script.text = "<div id='lightbox'><span>Some Content</span></div>"
		fixture.appendChild(script);
	},
	teardown  : function(){
		$("#fade").remove();
		$("#lightbox").remove();
		$("#lightbox-tmpl").remove();
		util.lightbox.isOpen = false; //remove open flag as we are manually cleaning DOM
	}
});

asyncTest("Opens Lightbox", function(){
	util.lightbox.open({
		selector : "#lightbox-tmpl",
		onOpenComplete : function(){
			equal($("#fade").length, 1);										//fade opens
			ok($("#fade").children()[0].isSameNode($("#lightbox")[0]));			//content is templated
			setTimeout(function(){
				ok(util.lightbox.isOpen);										//flag is set
				start();
			},0);
		}
	});
});

test("Lightbox binds close to ESC", function(){
	var closeSpy = this.spy();
	
	util.lightbox.bindEvents(false, "", closeSpy);
	
	var e = $.Event("keydown");
	e.which = 27;
	$("body").trigger(e);
	
	ok(closeSpy.calledOnce);
});

test("Lightbox binds close to Off Click", function(){
	var closeSpy = this.spy();
	
	util.lightbox.bindEvents(false, "", closeSpy);
	
	$("body").trigger("click");
	
	ok(closeSpy.calledOnce);
});

test("Lightbox binds close to cancel selector", function(){
	var closeSpy = this.spy();
	
	$("#qunit-fixture").append("<div id='fade'><div id='lightbox'><span id='inner'></span></div></div>");
	
	util.lightbox.bindEvents(false, "#inner", closeSpy);
	
	$("#inner").trigger("click");
	
	ok(closeSpy.calledOnce);
});

test("Lightbox does not close on lightbox click", function(){
	var closeSpy = this.spy();
	
	$("#qunit-fixture").append("<div id='fade'><div id='lightbox'></div></div>");
	
	util.lightbox.bindEvents(false, "", closeSpy);
	
	$("#lighbox").trigger("click");
	
	ok(!closeSpy.called);
});

test("Lightbox bind unbinds previous events", function(){
	var closeSpy = this.spy();
	var unbindSpy = this.spy(util.lightbox, "unbindEvents");
	
	util.lightbox.bindEvents(false, "#inner", closeSpy);
	
	ok(unbindSpy.calledOnce);
});

test("Lightbox Unbinds", function(){
	var closeSpy = this.spy();
	
	util.lightbox.bindEvents(false, "#inner", closeSpy);
	
	util.lightbox.unbindEvents();
	
	equal($("body").data("events"), undefined);		//no events
	equal($("#inner").data("events"), undefined);
});

test("Opens Error Lightbox", function(){
	$fixture = $("#qunit-fixture");
	$fixture.append("<div id='lightbox-error'></div>");

	var lightboxErrorVmSpy = this.spy(window, "LightboxErrorViewModel");
	
	this.stub(ko, "applyBindings", function(viewModel, element){
		ok(viewModel instanceof lightboxErrorVmSpy);
		ok(element[0].isSameNode($("#lightbox-error")));
	});
	
	this.stub(util.lightbox, "open", function(options){
		equal(options.url, 'templates/lightbox.tmpl.html');
		equal(options.selector, '#lightbox-error-template');
		equal(options.cancelSelector, '.ok-button');
	});
	
	var header = "header";
	var message = "message";
	
	util.lightbox.openError(header, message);
	
	ok(lightboxErrorVmSpy.calledWith(header, message));
});

test("Return Message for Working Lightbox quit from ViewModel", function(){
	var lightboxVm = new LightboxWorkingViewModel("testing", "testing");
	
	equal(util.lightbox.confirmIgnoreWorking.call(lightboxVm), "Are you sure you want to leave the page while testing?");
});

test("Return Message for Working Lightbox quit without ViewModel", function(){
	var notLightboxVm = {};
	
	equal(util.lightbox.confirmIgnoreWorking.call(notLightboxVm), "Are you sure you want to leave the page while Working?");
});

test("Opens Working Lightbox", function(){

	$fixture = $("#qunit-fixture");
	$fixture.append("<div id='lightbox-working'></div>");

	var workingVm = {};
	
	this.stub(ko, "applyBindings", function(viewModel, element){
		equal(viewModel, workingVm);
		ok(element.isSameNode($("#lightbox-working")[0]));
	});
	
	this.stub(util.lightbox, "open", function(options){
		equal(options.url, 'templates/lightbox.tmpl.html');
		equal(options.selector, '#lightbox-working-template');
		equal(options.cancelSelector, '.cancel-button');
		ok(options.isModal);
		options.onOpenComplete();
	});
	
	var result = util.lightbox.working(workingVm)
	equal(result, workingVm);
	ok($.isFunction(window.onbeforeunload));		//can't do strict equality because the function in wrapped in .bind
	window.onbeforeunload = null;					//cleanup
});

test("Open Working Lightbox when a lightbox is open", function(){
	$fixture = $("#qunit-fixture");
	$fixture.append("<div id='lightbox-working'></div>");

	var workingVm = {};
	
	util.lightbox.isOpen = true;
	
	this.stub(ko, "applyBindings", function(viewModel, element){
		equal(viewModel, workingVm);
		ok(element.isSameNode($("#lightbox-working")[0]));
	});
	
	var result = util.lightbox.working(workingVm);
	equal(result, workingVm);
});

test("Lightbox Closes", function(){
	$fixture = $("#qunit-fixture");
	$fixture.append("<div id='fade'></div>");
	
	$("body").on("click.lightbox", $.noop);
	
	util.lightbox.isOpen = true;
	window.onbeforeunload = $.noop;
	
	util.lightbox.close();
	
	equal($("#fade").length, 0);
	equal($("body").data("events"), undefined);
	ok(!util.lightbox.isOpen);
	ok(!$.isFunction(window.onbeforeunload));
});

test("Opens Warning Lightbox", function(){
	var okSpy = this.spy();
	var closeSpy = this.spy(util.lightbox, "close");
	var text = "warning";
	
	this.stub(util.lightbox, "open", function(options){
		equal(options.url, 'templates/lightbox.tmpl.html');
		equal(options.selector, '#lightbox-warning-template');
		equal(options.cancelSelector, '.cancel-button');
		options.onOpenComplete();
	});
	
	this.stub(ko, "applyBindings", function(viewModel, element){
		equal(viewModel.lightboxText, text);
		viewModel.okFunction();
	});
	
	util.warningLightbox(text, okSpy);
	
	ok(okSpy.calledOnce);
	ok(closeSpy.calledOnce);
});

test("Opens Warning Lightbox But Doesn't Close on OK", function(){
	var okSpy = this.spy();
	var closeSpy = this.spy(util.lightbox, "close");
	var text = "warning";
	
	this.stub(util.lightbox, "open", function(options){
		equal(options.url, 'templates/lightbox.tmpl.html');
		equal(options.selector, '#lightbox-warning-template');
		equal(options.cancelSelector, '.cancel-button');
		options.onOpenComplete();
	});
	
	this.stub(ko, "applyBindings", function(viewModel, element){
		equal(viewModel.lightboxText, text);
		viewModel.okFunction();
	});
	
	util.warningLightbox(text, okSpy, false);
	
	ok(okSpy.calledOnce);
	ok(!closeSpy.called);
});