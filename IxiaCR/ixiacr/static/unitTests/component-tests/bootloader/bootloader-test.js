//Sinon uses fake timer by default, messes up ajax tests.
sinon.config.useFakeTimers = false

module("Execution Queue");
test("Execution Queue is constructed", function(){
	var func = function(){};

	var executionQueue = new ExecutionQueue([
		func
	]);
	
	equal(executionQueue.currentStep, 0);
	equal(executionQueue.stepQueue[0], func);
});

asyncTest("Execution Queue steps", function(){
	expect(3);
	
	var func = function(callback){
		ok(true);
		callback();
	};

	var executionQueue = new ExecutionQueue([
		func,
		func,
		function(){
			ok(true);
			start();
		}
	]);
	
	executionQueue.step();
});

test("Execution Queue starts", function(){
	this.stub(ExecutionQueue.prototype, "step", function(){
		equal(this.currentStep, 0)
	});
	
	var executionQueue = new ExecutionQueue();
	
	executionQueue.start();
});

test("Execution Queue checks for type safety and returns on correct object", function(){
	var executionQueue = new ExecutionQueue();
	
	equal(executionQueue, ExecutionQueue.typesafe(executionQueue));
});

test("Execution Queue checks for type safety and throws on wrong object", function(){
	var notExecutionQueue = {};
	var result = false;
	
	//qunit raises/throws has issues
	try{
		ExecutionQueue.typesafe(notExecutionQueue);
	}catch(ex){
		result = ex == 'This method must be executed on a ExecutionQueue';
	}
	
	ok(result);
});

module("Boot Functions", {
	teardown : function(){
		$.mockjaxClear();
	}
});

asyncTest("Preloads Images From Server", function(){
	expect(2);
	
	var response = {
		files : [
			{
				name: "ixia-logo.png",
				modified: "01/18/2013 01:03:24 PM",
				directory: false,
				path: "ixia-logo.png",
				children: [],
				parent_dir: "/local/web/Axon/axon/static/images",
				size: "615 Bytes"
			}
		]
	};

	$.mockjax({
		url : "/ixia/get_images",
		responseText: response
	});

	this.stub(BootFunctions, "queueImages", function(callback, data){
		deepEqual(data, response);
		callback();
	});
	
	BootFunctions.preloadImages(function(){
		ok(true);
		start();
	});

});

asyncTest("Queues Images", function(){
	expect(2);
	
	var imagePath = "spirent-logo.png"
	
	var response = {
		files : [
			{
				name: "spirent-logo.png",
				modified: "01/18/2013 01:03:24 PM",
				directory: false,
				path: imagePath,
				children: [],
				parent_dir: "/local/web/Axon/axon/static/images",
				size: "615 Bytes"
			}
		]
	};
	
	//Mocks
	this.stub(BootFunctions.assetManager, "queueDownload", function(url){
		equal(url, "/images/" + imagePath);
	});
	this.stub(BootFunctions.assetManager, "downloadAll", function(callback){
		callback();
	});

	BootFunctions.queueImages(function(){
		ok(true);
		start();
	}, response);
});

asyncTest("Queues Images (sub directory)", function(){
	expect(2);
	
	var imageDir = "testImages";
	var imagePath = "spirent-logo.png"
	
	var response = {
		files : [
			{
				name: imageDir,
				modified: "01/18/2013 01:03:24 PM",
				directory: true,
				path: imageDir,
				children: [
					imagePath
				],
				parent_dir: "/local/web/Axon/axon/static/images",
				size: "615 Bytes"
			}
		]
	};
	
	this.stub(BootFunctions.assetManager, "queueDownload", function(url){
		equal(url, "/images/" + imageDir + "/" + imagePath);
	});
	this.stub(BootFunctions.assetManager, "downloadAll", function(callback){
		callback();
	});

	BootFunctions.queueImages(function(){
		ok(true);
		start();
	}, response);
});

//stub for IxiaCRViewModel so we don't need to import it and all it's dependencies
var IxiaCRViewModel = function(){};
IxiaCRViewModel.prototype.setUser = function(){};
IxiaCRViewModel.prototype.init = function(){};

asyncTest("Loads Root View Model", function(){
	expect(4);

	var enterpriseVmSpy = this.spy(window, "IxiaCRViewModel");
	var setUserSpy = this.spy(IxiaCRViewModel.prototype, "setUser");
	var initStub = this.stub(IxiaCRViewModel.prototype, "init", function(){
		return {
			done : function(callback){
				callback();
			}
		}
	});
	var $fixture = $("#qunit-fixture");
	$fixture.append("<div id='main'></div>");
	
	var koStub = this.stub(ko, "applyBindings", function(enterpriseVm, element){
		ok(enterpriseVm instanceof IxiaCRViewModel);
		equal(document.getElementById("main"), element);
	});
	
	BootFunctions.loadRootViewModel(function(){
		ok(enterpriseVmSpy.calledOnce);
		ok(setUserSpy.calledWith("Administrator"));
		start();
	})
});

asyncTest("Opens Loading Lightbox", function(){
	expect(4);

	this.stub(BootFunctions.assetManager, "queueDownload", function(url){
		equal(url, "images/spinner.gif");
	});
	this.stub(BootFunctions.assetManager, "downloadAll", function(callback){
		callback();
	});
	this.stub(util.lightbox, "open", function(options){
		equal(options.selector, '#lightbox-app-load-template');
		equal(options.isModal, true);
		options.onOpenComplete();
	});
	this.stub(BootFunctions, "loadingLightboxOpenComplete", function(callback){
		callback();
	});
	
	BootFunctions.openLoadingLightbox(function(){
		ok(true);
		start();
	});
});

asyncTest("Open Loading Lightbox Completes", function(){
	expect(3);
	
	var $fixture = $("#qunit-fixture");
	$fixture.append("<div id='lightbox-app-load'></div>");
	
	this.stub(ko, "applyBindings", function(viewModel, element){
		deepEqual({ message : "Loading app..." }, viewModel);
		equal(document.getElementById("lightbox-app-load"), element);
	});
	
	BootFunctions.loadingLightboxOpenComplete(function(){
		ok(true);
		start();
	});
});

asyncTest("Loading Lightbox Closes", function(){
	expect(1);
	
	var closeSpy = this.spy(util.lightbox, "close");
	
	BootFunctions.closeLoadingLightbox(function(){
		ok(closeSpy.calledOnce);
		start();
	});
});
