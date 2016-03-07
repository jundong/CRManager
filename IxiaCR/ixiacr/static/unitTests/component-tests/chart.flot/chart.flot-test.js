//Sinon uses fake timer by default, messes up ajax tests.
sinon.config.useFakeTimers = false
//Qunit will run async tests out of order, this can mess up test
QUnit.config.reorder = false;

module("Tick Generator");

test("Generates Ticks for fractional range (0-1)", function(){
	var axis = {
		min : 0,
		max : 1
	};

	var ticks = Chart.prototype.generateTicks(axis);
	
	deepEqual(ticks, [0, 0.2, 0.4, 0.6, 0.8, 1]);
});

test("Generates Ticks for fraction windowed range (1-2)", function(){
	var axis = {
		min : 1,
		max : 2
	};

	var ticks = Chart.prototype.generateTicks(axis);
	
	deepEqual(ticks, [1, 1.2, 1.4, 1.6, 1.8, 2]);
});

test("Generates Ticks for big fractional range (0-2)", function(){
	var axis = {
		min : 0,
		max : 2
	};

	var ticks = Chart.prototype.generateTicks(axis);
	
	deepEqual(ticks, [0, 0.4, 0.8, 1.2, 1.6, 2]);
});

test("Generates Ticks for Large Range (0-100)", function(){
	var axis = {
		min : 0,
		max : 100
	};

	var ticks = Chart.prototype.generateTicks(axis);
	
	deepEqual(ticks, [0, 20, 40, 60, 80, 100]);
});

test("Generates Ticks for Large Windowed Range(100-200)", function(){
	var axis = {
		min : 100,
		max : 200
	};

	var ticks = Chart.prototype.generateTicks(axis);
	
	deepEqual(ticks, [100, 120, 140, 160, 180, 200]);
});

test("Generates Ticks for Very Large Range (0-1000)", function(){
	var axis = {
		min : 0,
		max : 1000
	};

	var ticks = Chart.prototype.generateTicks(axis);
	
	deepEqual(ticks, [0, 200, 400, 600, 800, 1000]);
});

test("Generates Ticks for Very Small Fractional Range (0-0.1)", function(){
	var axis = {
		min : 0,
		max : 0.1
	};

	var ticks = Chart.prototype.generateTicks(axis);
	
	deepEqual(ticks, [0, 0.02, 0.04, 0.06, 0.08, 0.1]);
});

test("Generates Ticks For Mixed Magnitude Range (50-150)", function(){
	var axis = {
		min : 50,
		max : 150
	};

	var ticks = Chart.prototype.generateTicks(axis);
	
	deepEqual(ticks, [50, 70, 90, 110, 130, 150]);
});

test("Generates Ticks For Oddly Centered Window (20-96)", function(){
	var axis = {
		min : 20,
		max : 96
	};

	var ticks = Chart.prototype.generateTicks(axis);
	
	deepEqual(ticks, [20, 40, 60, 80, 100]);
});

test("Generates Ticks for Fractional Range with Very High Window (100-101)", function(){
	var axis = {
		min : 100,
		max : 101
	};

	var ticks = Chart.prototype.generateTicks(axis);
	
	deepEqual(ticks, [100, 100.2, 100.4, 100.6, 100.8, 101]);
});

module("Growing Axes", {
	setup : function(){		
		sinon.stub(Chart, "typesafe", function(that){	//don't type check out fake object
			return that;
		});
	},
	teardown : function(){
		Chart.typesafe.restore();
	}
});

test("Windows X Axis When Time Doesn't Fit", function(){

	var fakeOptions = {
		xaxes : [
			{
				max : 10000,
				min : 0,
				tickSize : [1, "second"]
			}
		]
	};
	
	var fakeSelf = {
		flot : {
			getOptions : function(){
				return fakeOptions;
			}
		},
		options : {
			xaxes : [
				{
					max : 10000,
					min : 0
				}
			]
		}
	}

	Chart.prototype.windowXAxis.call(fakeSelf, 11000);

	equal(fakeOptions.xaxes[0].max, 20000);
	deepEqual(fakeOptions.xaxes[0].tickSize, [2, "second"]);
	equal(fakeSelf.options.xaxes[0].max, 20000);
	deepEqual(fakeSelf.options.xaxes[0].tickSize, [2, "second"]);
});

test("Don't Window X Axis When Time Fits", function(){

	var fakeOptions = {
		xaxes : [
			{
				max : 10000,
				min : 0,
				tickSize : [1, "second"]
			}
		]
	};
	
	var fakeSelf = {
		flot : {
			getOptions : function(){
				return fakeOptions;
			}
		},
		options : {
			xaxes : [
				{
					max : 10000,
					min : 0,
					tickSize : [1, "second"]
				}
			]
		}
	}

	Chart.prototype.windowXAxis.call(fakeSelf, 9000);

	equal(fakeOptions.xaxes[0].max, 10000);
	deepEqual(fakeOptions.xaxes[0].tickSize, [1, "second"]);
	equal(fakeSelf.options.xaxes[0].max, 10000);
	deepEqual(fakeSelf.options.xaxes[0].tickSize, [1, "second"]);
});

test("Window Y Axis On Single Point", function(){
	
	var fakeOptions = {
		yaxes : [
			{
				max : 0,
				min : 0
			}
		]
	};
	
	var fakeSelf = {
		flot : {
			getOptions : function(){
				return fakeOptions;
			}
		},
		options : {
			yaxes : [
				{
					max : 0,
					min : 0
				}
			]
		}
	}
	
	Chart.prototype.windowYAxis.call(fakeSelf, 9, 9);
	
	equal(fakeOptions.yaxes[0].max, 11.7, "Max is set to point");
	equal(fakeOptions.yaxes[0].min, 0, "Min is set to point");
});

test("Window Y Axis On Horizontal Line", function(){
	
	var fakeOptions = {
		yaxes : [
			{
				max : 0,
				min : 0
			}
		]
	};
	
	var fakeSelf = {
		flot : {
			getOptions : function(){
				return fakeOptions;
			}
		},
		options : {
			yaxes : [
				{
					max : 1,
					min : 0
				}
			]
		}
	}
	
	Chart.prototype.windowYAxis.call(fakeSelf, 9, 9);
	Chart.prototype.windowYAxis.call(fakeSelf, 9, 9);
	
	equal(fakeOptions.yaxes[0].max, 11.7, "Max is set to point");
	equal(fakeOptions.yaxes[0].min, 0, "Min is set to point");
});

test("Window Y Axis On 0-value Horizontal Line", function(){
	
	var fakeOptions = {
		yaxes : [
			{
				max : 1,
				min : 0
			}
		]
	};
	
	var fakeSelf = {
		flot : {
			getOptions : function(){
				return fakeOptions;
			}
		},
		options : {
			yaxes : [
				{
					max : 1,
					min : 0
				}
			]
		}
	}
	
	Chart.prototype.windowYAxis.call(fakeSelf, 0, 0);
	Chart.prototype.windowYAxis.call(fakeSelf, 0, 0);
	
	equal(fakeOptions.yaxes[0].max, 1, "Max is set to point");
	equal(fakeOptions.yaxes[0].min, 0, "Min is set to point");
});

test("Window Y Axis on New Max", function(){
	
	var fakeOptions = {
		yaxes : [
			{
				max : 100,
				min : 80
			}
		]
	};
	
	var fakeSelf = {
		flot : {
			getOptions : function(){
				return fakeOptions;
			}
		},
		options : {
			yaxes : [
				{
					max : 100,
					min : 80
				}
			]
		}
	}
	
	Chart.prototype.windowYAxis.call(fakeSelf, 80, 120);
	
	equal(fakeOptions.yaxes[0].max, 132, "Max is set above new point");
	equal(fakeOptions.yaxes[0].min, 80, "Min stays the same");
});

test("Window Y Axis on New Min", function(){
	
	var fakeOptions = {
		yaxes : [
			{
				max : 12,
				min : 9
			}
		]
	};
	
	var fakeSelf = {
		flot : {
			getOptions : function(){
				return fakeOptions;
			}
		},
		options : {
			yaxes : [
				{
					max : 12,
					min : 9
				}
			]
		}
	}
	
	Chart.prototype.windowYAxis.call(fakeSelf, 3, 9);
	
	equal(fakeOptions.yaxes[0].max, 11, "Max changes to new window");
	equal(fakeOptions.yaxes[0].min, 3, "Min is set to new point");
});

test("Don't Window Y Axis on Same Min & Max", function(){
	
	var fakeOptions = {
		yaxes : [
			{
				max : 12,
				min : 0
			}
		]
	};
	
	var fakeSelf = {
		flot : {
			getOptions : function(){
				return fakeOptions;
			}
		},
		options : {
			yaxes : [
				{
					max : 12,
					min : 0
				}
			]
		}
	}
	
	Chart.prototype.windowYAxis.call(fakeSelf, 0, 9);
	
	equal(fakeOptions.yaxes[0].max, 12, "Max stays the same");
	equal(fakeOptions.yaxes[0].min, 0, "Min stays the same");
});