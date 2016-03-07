sinon.config.useFakeTimers = false;
//Qunit will run async tests out of order, this can mess up test
QUnit.config.reorder = false;

module("Chart Poller Constructor");

test("Chart Poller is Created", function(){
	this.stub(ChartPoller.prototype, "togglePolling", function(value){
		ok(value);
	});
	
	var pollUrl = "test";
	
	var chart = { value : "chart" };
	var table = { value : "table" };
	var results = { value : "results" };
	var settings = { url : pollUrl };
	
	var chartPoller = new ChartPoller(chart, table, settings, results);
	
	//ok(chartPoller.hasOwnProperty("timer"));			//can't really test this
	equal(chartPoller.settings.pollDuration, 12000);
	equal(chartPoller.settings.pollFrequency, 2000);
	equal(chartPoller.settings.url, pollUrl);
	ok(chartPoller.settings.pollOnHidden);
	ok(chartPoller.settings.autoStart);
	equal(chartPoller.settings.onFinish, $.noop);
	equal(chartPoller.settings.onPollSuccess, $.noop);
	ok(!chartPoller.polling);
	ok(chartPoller.hasOwnProperty("nextPoll"));
	equal(chartPoller.chart, chart);
	equal(chartPoller.table, table);
	equal(chartPoller.resultsVm, results);
	ok(chartPoller.tag);
	ok(chartPoller.togglePolling.calledOnce);
});

module("Start Polling", {
	setup : function(){
		sinon.stub(ChartPoller, "typesafe", function(that){
			return that;
		})
	},teardown : function(){
		ChartPoller.typesafe.restore();
	}
});

test("Chart Poller Starts Polling", function(){
	var clock = this.sandbox.useFakeTimers();
	
	var fakeSelf = {
		setNextPoll : this.spy(),
		polling : false,
		nextPoll : (new Date).getTime(),
		resultsVm : {
			zoomVisible : this.spy()
		},
		settings : {
			pollFrequency : 2
		}
	};
	
	ChartPoller.prototype.startPolling.call(fakeSelf);
	
	ok(fakeSelf.resultsVm.zoomVisible.calledWith(false), "set zoom visible");
	equal(fakeSelf.nextPoll, (new Date).getTime() + fakeSelf.settings.pollFrequency, "sets next poll time"); 		 //timing test, potential for fail under certain circumstances
	ok(fakeSelf.setNextPoll.called, "sets next poll");
	ok(fakeSelf.polling, "sets polling flag");
});

test("Chart Poller Does not Restart Polling if already Polling", function(){
	var clock = this.sandbox.useFakeTimers();

	var fakeSelf = {
		setNextPoll : this.spy(),
		polling : true,
		nextPoll : (new Date).getTime(),
		resultsVm : {
			zoomVisible : this.spy()
		},
		settings : {
			pollFrequency : 2
		}
	};

	ChartPoller.prototype.startPolling.call(fakeSelf);
	
	ok(!fakeSelf.resultsVm.zoomVisible.called, "does not set zoom visibility");
	ok(!fakeSelf.setNextPoll.called, "does not set next poll time");
	equal(fakeSelf.nextPoll, 0, "does not change poll time");
});

module("Stop Polling", {
	setup : function(){
		sinon.stub(ChartPoller, "typesafe", function(that){
			return that;
		})
	},teardown : function(){
		ChartPoller.typesafe.restore();
	}
});

test("Chart Poller Stops Polling", function(){
	
	this.spy(window, "clearInterval");
	
	var fakeSelf = {
		timer : "timer",
		polling : true,
		nextPoll : 1234,
		stop : false
	};
	
	ChartPoller.prototype.stopPolling.call(fakeSelf);
	
	ok(window.clearInterval.calledWith(fakeSelf.timer), "clears timer");
	ok(!fakeSelf.polling, "turns off polling flag");
	ok(!fakeSelf.nextPoll, "removes next poll time");
	ok(fakeSelf.stop, "sets the stop flag");
});

module("Toggle Polling", {
	setup : function(){
		sinon.stub(ChartPoller, "typesafe", function(that){
			return that;
		})
	},teardown : function(){
		ChartPoller.typesafe.restore();
	}
});

test("Chart Poller Toggles Polling On", function(){
	
	var fakeSelf = {
		startPolling : this.spy(),
		stopPolling : this.spy(),
		polling : false
	};
	
	ChartPoller.prototype.togglePolling.call(fakeSelf);
	
	ok(fakeSelf.startPolling.calledOnce, "calls startPolling");
	ok(!fakeSelf.stopPolling.called, "does not call stopPolling");
});

test("Chart Poller Toggles Polling Off", function(){

	var fakeSelf = {
		startPolling : this.spy(),
		stopPolling : this.spy(),
		polling : true
	};
	
	ChartPoller.prototype.togglePolling.call(fakeSelf);
	
	ok(!fakeSelf.startPolling.called, "does not call startPolling");
	ok(fakeSelf.stopPolling.calledOnce, "calls stopPolling");
});

test("Chart Poller Toggles Polling by Value On", function(){
	var fakeSelf = {
		startPolling : this.spy(),
		stopPolling : this.spy(),
		polling : true
	};
	
	ChartPoller.prototype.togglePolling.call(fakeSelf, true);
	
	ok(fakeSelf.startPolling.calledOnce, "calls startPolling");
	ok(!fakeSelf.stopPolling.called, "does not call stopPolling");
});

test("Chart Poller Toggles Polling by Value Off", function(){
	var fakeSelf = {
		startPolling : this.spy(),
		stopPolling : this.spy(),
		polling : true
	};
	
	ChartPoller.prototype.togglePolling.call(fakeSelf, false);
	
	ok(!fakeSelf.startPolling.called, "does not call startPolling");
	ok(fakeSelf.stopPolling.calledOnce, "calls stopPolling");
});

module("Dispose",{
	setup : function(){
		sinon.stub(ChartPoller, "typesafe", function(that){
			return that;
		});
	},teardown : function(){
		ChartPoller.typesafe.restore();
	}
});

test("Disposes Self", function(){

	var stopPollingSpy = this.spy();	//since we dispose the object let's keep a reference

	var fakeSelf = {
		stopPolling : stopPollingSpy
	}
	
	ChartPoller.prototype.dispose.call(fakeSelf);
	
	ok(stopPollingSpy.calledOnce, "calls stop polling");
	ok(fakeSelf, null, "removes self");
});

module("Poll", {
	setup : function(){
		sinon.stub(ChartPoller, "typesafe", function(that){
			return that;
		});
	},
	teardown : function(){
		ChartPoller.typesafe.restore();
	}
});

test("Polls Url If Visible", function(){

	var fakeSelf = {
		settings : { 
			url : "test",
			pollOnHidden : false
		},
		chart : {
			chart : {
				is : this.stub().returns(true),
				length : 1
			}
		},
		pollAjaxSuccess : this.spy(),
		pollAjaxError : this.spy(),
		lastUpdated : 1111
	}
	
	var ajaxStub = this.stub($, "ajax", function(settings){
		equal(settings.url, fakeSelf.settings.url, "passes url");
		deepEqual(settings.data, { lastUpdated : fakeSelf.lastUpdated }, "passes data");
		equal(settings.dataType, "json", "passes dataType");
		settings.success();
		settings.error();
	});
	
	ChartPoller.prototype.poll.call(fakeSelf);
	
	ok(fakeSelf.chart.chart.is.calledWith(":visible"), "checks visibility");
	ok(ajaxStub.calledOnce, "calls ajax");
	ok(fakeSelf.pollAjaxSuccess.calledOnce, "passes success func");
	ok(fakeSelf.pollAjaxError.calledOnce, "passes error func");
});

test("Doesn't Poll Url If Not Visible", function(){

	var fakeSelf = {
		settings : { 
			url : "test",
			pollOnHidden : false
		},
		chart : {
			chart : {
				is : this.stub().returns(false),
				length : 1
			}
		},
		pollAjaxSuccess : this.spy(),
		pollAjaxError : this.spy(),
		lastUpdated : 1111
	}
	
	var ajaxStub = this.stub($, "ajax", function(settings){});
	
	ChartPoller.prototype.poll.call(fakeSelf);
	
	ok(fakeSelf.chart.chart.is.calledWith(":visible"), "checks visibility");
	ok(!ajaxStub.called, "doesn't call ajax");
});

test("Doesn't Poll Url If Not Chart Doesn't Exist", function(){

	var fakeSelf = {
		settings : { 
			url : "test",
			pollOnHidden : false
		},
		chart : {
			chart : {
				is : this.stub().returns(false),
				length : 0
			}
		},
		pollAjaxSuccess : this.spy(),
		pollAjaxError : this.spy(),
		lastUpdated : 1111
	}
	
	var ajaxStub = this.stub($, "ajax", function(settings){});
	
	ChartPoller.prototype.poll.call(fakeSelf);
	
	ok(!fakeSelf.chart.chart.is.called, "doesn't check visibility");
	ok(!ajaxStub.called, "doesn't call ajax");
});

test("Polls Url If Not Visible but has PollOnHidden", function(){

	var fakeSelf = {
		settings : { 
			url : "test",
			pollOnHidden : true
		},
		chart : {
			chart : {
				is : this.stub().returns(false),
				length : 1
			}
		},
		pollAjaxSuccess : this.spy(),
		pollAjaxError : this.spy(),
		lastUpdated : 1111
	}
	
	var ajaxStub = this.stub($, "ajax", function(settings){
		equal(settings.url, fakeSelf.settings.url, "passes url");
		deepEqual(settings.data, { lastUpdated : fakeSelf.lastUpdated }, "passes data");
		equal(settings.dataType, "json", "passes dataType");
		settings.success();
		settings.error();
	});
	
	ChartPoller.prototype.poll.call(fakeSelf);
	
	ok(!fakeSelf.chart.chart.is.called, "doesn't check visibility");
	ok(ajaxStub.calledOnce, "calls ajax");
	ok(fakeSelf.pollAjaxSuccess.calledOnce, "passes success func");
	ok(fakeSelf.pollAjaxError.calledOnce, "passes error func");
});

module("Poll Ajax Success", {
	setup : function(){
		sinon.stub(ChartPoller, "typesafe", function(that){
			return that;
		});
	},
	teardown : function(){
		ChartPoller.typesafe.restore();
	}
});

test("Succeeds", function(){
	var response = {
		someData : "someValue"
	};
	
	var fakeSelf = {
		settings : { 
			url : "test",
			autoStart : false,
			onPollSuccess : this.spy()
		},
		chart : {
			finish : this.spy()
		},
		pollSuccess : this.spy(),
		setNextPoll : this.spy()
	};
	
	ChartPoller.prototype.pollAjaxSuccess.call(fakeSelf, response);
	
	ok(fakeSelf.pollSuccess.calledWith(response), "called poll success");
	ok(fakeSelf.setNextPoll.calledOnce, "called setNextPoll");
});

test("Recieves Ends Stream", function(){
	var response = {
		EndOfStream : true
	};
	
	var fakeSelf = {
		settings : { 
			url : "test",
			autoStart : false,
			onPollSuccess : this.spy(),
			onFinish : this.spy()
		},
		chart : {
			finish : this.spy()
		},
		pollSuccess : this.spy(),
		setNextPoll : this.spy(),
		stopPolling : this.spy()
	};
	
	ChartPoller.prototype.pollAjaxSuccess.call(fakeSelf, response);
	
	ok(fakeSelf.stopPolling.calledOnce, "stops polling");
	ok(fakeSelf.settings.onFinish.calledOnce, "calls finish callback");
	ok(fakeSelf.chart.finish.calledOnce, "calls finish on chart");
	ok(!fakeSelf.setNextPoll.called, "doesn't set next poll");
	ok(fakeSelf.pollSuccess.calledWith(response), "calls poll success");
});

test("Receives Status Change", function(){
	var response = {
		someData : "someValue",
		status : "newStatus"
	};
	
	var fakeSelf = {
		settings : { 
			url : "test",
			autoStart : false,
			onPollSuccess : this.spy(),
			onFinish : this.spy()
		},
		chart : {
			finish : this.spy()
		},
		resultsVm : {
			status : this.spy()
		},
		pollSuccess : this.spy(),
		setNextPoll : this.spy(),
		stopPolling : this.spy()
	};
	
	ChartPoller.prototype.pollAjaxSuccess.call(fakeSelf, response);
	
	ok(fakeSelf.pollSuccess.calledWith(response), "calls poll success");
	ok(fakeSelf.setNextPoll.calledOnce, "sets next poll");
	ok(fakeSelf.resultsVm.status.calledWith(response.status), "changes status");
});

module("Poll Success", {
	setup : function(){
		sinon.stub(ChartPoller, "typesafe", function(that){
			return that;
		});
	},
	teardown : function(){
		ChartPoller.typesafe.restore();
	}
});

test("Chart Poller Updates After Poll", function(){
	var response = {
		percentage_complete : 50,
		lastUpdated : 2222,
		data : "payload"
	};
	
	var fakeSelf  = {
		settings : { 
			url : "test",
			autoStart : false,
			onPollSuccess : this.spy()
		},
		chart : {
			update : this.spy()
		},
		resultsVm : {
			percentComplete : this.spy()
		}
	};
	
	ChartPoller.prototype.pollSuccess.call(fakeSelf, response);
	
	equal(fakeSelf.lastUpdated, response.lastUpdated, "sets lastUpdated");
	ok(fakeSelf.resultsVm.percentComplete.calledWith(), "asks for percent complete");
	ok(fakeSelf.resultsVm.percentComplete.calledWith(50), "sets percent complete");
	ok(fakeSelf.chart.update.calledWith(response.data), "updates chart");
});

test("Chart Poller Updates After Poll With Percent", function(){
	var response = {
		percentage_complete : 50,
		lastUpdated : 2222,
		data : "payload"
	};
	
	var fakeSelf  = {
		settings : { 
			url : "test",
			autoStart : false,
			onPollSuccess : this.spy()
		},
		chart : {
			update : this.spy()
		},
		resultsVm : {
			percentComplete : this.spy()
		}
	};
	
	this.spy(Math, "round");
	
	ChartPoller.prototype.pollSuccess.call(fakeSelf, response);
	
	equal(fakeSelf.lastUpdated, response.lastUpdated, "sets lastUpdated");
	ok(Math.round.calledWith(response.percentage_complete), "rounds number");
	ok(fakeSelf.resultsVm.percentComplete.calledWith(50), "sets percent complete");
	ok(fakeSelf.chart.update.calledWith(response.data), "updates chart");
});

test("Chart Poller Updates After Poll Without Percent", function(){
	var response = {
		lastUpdated : 2222,
		data : "payload"
	};
	
	var fakeSelf  = {
		settings : { 
			url : "test",
			autoStart : false,
			onPollSuccess : this.spy()
		},
		chart : {
			update : this.spy()
		},
		resultsVm : {
			percentComplete : this.spy()
		}
	};
	
	this.spy(Math, "round");
	
	ChartPoller.prototype.pollSuccess.call(fakeSelf, response);
	
	equal(fakeSelf.lastUpdated, response.lastUpdated, "sets lastUpdated");
	ok(!Math.round.called, "doesn't round");
	ok(fakeSelf.resultsVm.percentComplete.called, "calls percent complete");
	ok(fakeSelf.chart.update.calledWith(response.data), "updates chart");
});

test("Chart Poller Updates After Poll With Greater Than 100 Percent", function(){
	var response = {
		percentage_complete : 105,
		lastUpdated : 2222,
		data : "payload"
	};
	
	var fakeSelf  = {
		settings : { 
			url : "test",
			autoStart : false,
			onPollSuccess : this.spy()
		},
		chart : {
			update : this.spy()
		},
		resultsVm : {
			percentComplete : this.spy()
		}
	};
	
	ChartPoller.prototype.pollSuccess.call(fakeSelf, response);
	
	equal(fakeSelf.lastUpdated, response.lastUpdated, "sets last updated");
	ok(fakeSelf.resultsVm.percentComplete.calledWith(100), "caps at 100");
	ok(fakeSelf.chart.update.calledWith(response.data), "updates chart");
});

module("Set Next Poll", {
	setup : function(){
		sinon.stub(ChartPoller, "typesafe", function(that){
			return that;
		});
	},
	teardown : function(){
		ChartPoller.typesafe.restore();
	}
});

test("Chart Poller Sets New Poll Interval", function(){
	var fakeSelf = {
		settings : { 
			autoStart : false,
			pollFrequency : 1000
		},
		chart : {
			update : this.spy()
		},
		resultsVm : {
			percentComplete : this.spy()
		},
		poll : this.spy(),
		nextPoll : 0
	}
	
	this.stub(Date.prototype, "getTime").returns(100);
	
	ChartPoller.prototype.setNextPoll.call(fakeSelf);
	
	equal(fakeSelf.nextPoll, 1100, "sets next poll time");
	ok(fakeSelf.poll.calledOnce, "polls");
});

test("Chart Poller Sets New Poll Interval But Time Has Not Lapsed", function(){
	var fakeSelf = {
		settings : { 
			autoStart : false,
			pollFrequency : 1000
		},
		chart : {
			update : this.spy()
		},
		resultsVm : {
			percentComplete : this.spy()
		},
		poll : this.spy(),
		nextPoll : 1000
	}
	
	this.stub(Date.prototype, "getTime").returns(500);
	this.stub(window, "setTimeout", function(func, time){
		equal(typeof(func), "function", "calls setTimeout with function");
		equal(time, 500, "sets correct interval");
	});
	
	ChartPoller.prototype.setNextPoll.call(fakeSelf);
	
	equal(fakeSelf.nextPoll, 2000, "next poll is set");
});

module("Poll", {
	setup : function(){
		sinon.stub(ChartPoller, "typesafe", function(that){
			return that;
		});
	},
	teardown : function(){
		ChartPoller.typesafe.restore();
	}
});

test("Chart Poller Errors", function(){
	var xhr = "xhr";
	var error = "error";
	
	this.stub(console, "warn").returns();
	
	ChartPoller.prototype.pollAjaxError.call({}, xhr, error);
	
	ok(console.warn.calledWith("Chart poller Ajax error: " + error), "warns with console");
});

module("Typesafe");

test("Chart Poller checks for type safety and returns on correct object", function(){
	
	this.stub(ChartPoller.prototype, "togglePolling", function(){});
	
	var chartPoller = new ChartPoller();
	
	equal(chartPoller, ChartPoller.typesafe(chartPoller));
});

test("Chart Poller checks for type safety and throws on wrong object", function(){
	var notChartPoller = {};
	var result = false;
	
	//qunit raises/throws has issues
	try{
		ChartPoller.typesafe(notChartPoller);
	}catch(ex){
		result = ex == 'This method must be executed on a ChartPoller';
	}
	
	ok(result);
});

module("Result Type View Model");

test("Result Type View Model is Created", function(){
	var resultType = {
		id : "id",
		name : "name",
		description : "description",
		frequency : 7777,
		url : "url",
		width : 555,
		height : 444
	};

	var resultTypeViewModel = new ResultTypeViewModel(resultType);
	
	equal(resultTypeViewModel.id, resultType.id);
	equal(resultTypeViewModel.name, resultType.name);
	equal(resultTypeViewModel.description, resultType.description);
	equal(resultTypeViewModel.frequency, resultType.frequency);
	equal(resultTypeViewModel.url, resultType.url);
	equal(resultTypeViewModel.width, resultType.width);
	equal(resultTypeViewModel.height, resultType.height);
});

test("Result Type View Model is Created with Defaults", function(){
	var resultType = {
		id : "id",
		name : "name",
		description : "description",
		url : "url"
	};

	var resultTypeViewModel = new ResultTypeViewModel(resultType);
	
	equal(resultTypeViewModel.id, resultType.id);
	equal(resultTypeViewModel.name, resultType.name);
	equal(resultTypeViewModel.description, resultType.description);
	equal(resultTypeViewModel.frequency, 1000);
	equal(resultTypeViewModel.url, resultType.url);
	equal(resultTypeViewModel.width, 610);
	equal(resultTypeViewModel.height, 400);
});