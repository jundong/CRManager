"use strict";

function Chart(settings){
	var self = this;

    self.settings = {
        width : 900,
        height : 700,
        maxZoom : 2,
        selector : null,
        name : "chart",
        seriesColors : ["#96cfde", "#cb96de", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"]
    };

    self.options = {
        xaxes : [{
            mode: "time",
            min: 0,
            max: 10000, //must be in miliseconds for time
            color : "#959595",
            tickColor : "#141414",
            tickSecondaryColor : "#323739",
            tickDecimals : 0,
            tickFormatter :  function(val, axis){
                var date = new Date(val);
                var time = {
                    seconds : util.padNumber(date.getUTCSeconds(), 2),
                    minutes : util.padNumber(date.getUTCMinutes(), 2),
                    hours : util.padNumber(date.getUTCHours(), 2)

                };
                return time.hours + ':' + time.minutes + ":" + time.seconds;
            },
            tickSize : [1, "second"]
        }],
        yaxes : [{
            min : 0,
            max : 1,
            color : "#959595",
            tickColor : "#141414",
            tickSecondaryColor : "#323739",
            tickSize: 1,
            tickFormatter : util.commafyNumber,
            tickDecimals : 0,
			ticks : self.generateTicks
        }],
        grid : {
            borderColor : "#000000",
            borderWidth : 0,
            backgroundColor : "#1c1c1d",
            insetShadowX : true,
            insetShadowY : true
        },
        legend : {
            show: false
        },
        series : {
            lines : {
                show : true,
                fill : true
            },
            points : {
                show : true
            }
        }
    };

    $.extend(self.settings, settings);
	self.root = $(self.settings.selector);
	self.name = self.settings.name;
	self.chart = self.root.find(".chart");
	self.previousPoint = null;
	self.scrollers = {
		x : null,
		y : null
	}; //terminology: A Scroller contains a slider
	self.sliders = {
		x : null,
		y : null
	};
	self.camera = null;
	self.plotProperties = null;
	self.currentZoom = 1;
	self.series = ko.observableArray([]);
	self.isFinished = false;
	self.bounds = {};

    return self;
}

Chart.prototype.generateTicks = function(axis){
	var MAX_TICKS = 5;
	var ticks = [];
	
	var range = axis.max - axis.min;
	if (range > 10 && range <= 1000){
		range /= 10;
		range = Math.round(range);
		range *= 10;
	} else if (range > 1000 && range <= 10000 ){
		range /= 100;
		range = Math.round(range);
		range *= 100;
	} else if (range > 10000 ){
		range /= 1000;
		range = Math.round(range);
		range *= 1000;
	}

	var tickInterval = util.getMagnitude(range / MAX_TICKS);
	
	if (tickInterval >= 10){
		MAX_TICKS = 10
	}
	while((range / tickInterval) > MAX_TICKS){
		tickInterval *= 2;
	}
		
	var tickValue = 0;
	ticks.push(tickValue);
	while(tickValue < axis.max){
		tickValue = util.floatFix(tickValue + tickInterval);
		ticks.push(tickValue);
	}
	return ticks;
};

Chart.prototype.toFlatObject = function(){
	var self = Chart.typesafe(this);

	return JSON.stringify(self.series());
};

Chart.import = function(exportObject){
	var chart = new Chart();
	
	chart.series = ko.observable(exportObject);
	
	return chart;
};

//Stubs for clarity
Chart.prototype.chart = null;
Chart.prototype.seriesColors = ["#96cfde", "#cb96de", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#FFFFFF"];

Chart.prototype.updateChartDecorations = function(){
	var self = Chart.typesafe(this);
	
	if(!self.root.is(":visible")){ //don't bother drawing if it won't show up
		return;
	}
	
	self.camera = self.camera || {};
	self.camera.resolution = self.camera.resolution || {};
	self.camera.panMin = self.camera.panMin || {};
	self.camera.panMax = self.camera.panMax || {};
	self.camera.panResolution = self.camera.panResolution || {};
	
	var xMax = Number.MIN_VALUE;
	var xMin = Number.MIN_VALUE;
	var yMax = Number.MIN_VALUE;
	var yMin = self.flot.getOptions().yaxes[0].min;
	
	var series = self.series();
	for(var i = 0; i < series.length; i++){
		for(var j = 0; j < series[i].data.length; j++){
			if(series[i].data[j][1] > yMax){
				yMax = series[i].data[j][1];
			}
			if(series[i].data[j][1] < yMin){
				yMin = series[i].data[j][1];
			}
			if(series[i].data[j][0] > xMax){
				xMax = series[i].data[j][0];
			}
			if(series[i].data[j][0] < xMin){
				xMin = series[i].data[j][0];
			}
		}
	}
	
	var yPlotOffset = Math.round(self.flot.p2c({ y: yMin }).top);
	//These coords are normalized from pixel space to camera space
	//Y plot vars
	var ySlideMin = yPlotOffset - Math.round(self.flot.p2c({ y: yMin }).top);
	var ySlideMax = yPlotOffset - Math.round(self.flot.p2c({ y: yMax }).top);
	var yPlotMin = yPlotOffset - Math.round(self.flot.p2c({ y: self.flot.getOptions().yaxes[0].min }).top);
	var yPlotMax = yPlotOffset - Math.round(self.flot.p2c({ y: self.flot.getOptions().yaxes[0].max }).top);
	//X plot vars
	var xPlotOffset = Math.round(self.flot.p2c({ x: xMin }).left);//we need to get the offset of the portion that's offscreen so we grab the relatvie location of 0

    var xSlideMin = Math.round(self.flot.p2c({ x: xMin }).left) - xPlotOffset;
	var xSlideMax = Math.round(self.flot.p2c({ x: xMax }).left) - xPlotOffset;
	var xPlotMax = Math.round(self.flot.p2c({ x: self.flot.getOptions().xaxes[0].max }).left) - xPlotOffset;
	var xPlotMin = Math.round(self.flot.p2c({ x: self.flot.getOptions().xaxes[0].min }).left) - xPlotOffset;
	//X camera vars
	self.camera.resolution.x = (xPlotMax - xPlotMin);
	self.camera.resolution.half_x = self.camera.resolution.x / 2;
	self.camera.x = (self.camera.resolution.half_x) - xPlotOffset;
	self.camera.panMin.x = xSlideMin + (self.camera.resolution.half_x);
	self.camera.panMax.x = util.greaterOf(xSlideMax - (self.camera.resolution.half_x), self.camera.panMin.x);
	self.camera.panResolution.x = self.camera.panMax.x - self.camera.panMin.x;
	//Y camera vars
	self.camera.resolution.y = (yPlotMax - yPlotMin);
	self.camera.resolution.half_y = self.camera.resolution.y / 2;
	self.camera.y = yPlotOffset - self.camera.resolution.half_y;
	self.camera.panMin.y = ySlideMin + self.camera.resolution.half_y;
	self.camera.panMax.y = util.greaterOf(ySlideMax - self.camera.resolution.half_y, self.camera.panMin.y);
	self.camera.panResolution.y = self.camera.panMax.y - self.camera.panMin.y;
	//Margin values are found via measurement, flot does not expose them
	var graphMarginTop = 3;
	var graphMarginBottom = 8;
	var graphMarginLeft = 5;
	var graphMarginRight = 3;
	var yAxisLabelWidth = self.chart.width() - self.camera.resolution.x - graphMarginRight - graphMarginLeft;
	var xAxisLabelHeight = self.chart.height() - self.camera.resolution.y - graphMarginTop - graphMarginBottom;
	
	self.plotProperties = {
		yPlotMax : yPlotMax,
		yPlotMin : yPlotMin,
		xPlotMax : xPlotMax,
		xPlotMin : xPlotMin,
		coordDirection : {
			x : 1,
			y : -1
		},
		graphMarginTop : graphMarginTop,
		graphMarginBottom : graphMarginBottom,
		graphMarginRight : graphMarginRight,
		graphMarginLeft : graphMarginLeft,
		xAxisLabelHeight : xAxisLabelHeight,
		yAxisLabelWidth : yAxisLabelWidth,
		realGraphHeight : self.camera.resolution.y,
		realGraphWidth : self.camera.resolution.x,
		plotOffset : {
			x : xPlotOffset, 
			y : yPlotOffset
		},
		fullPlot : {
			min : {
				x : xSlideMin,
				y : ySlideMin
			},
			max : {
				x : xSlideMax,
				y : ySlideMax
			},
			resolution : {
				x : xSlideMax - xSlideMin,
				y : ySlideMax - ySlideMin
			}
		}
	};
	
	self.setupLabels();
	self.setupScrollers();
	self.setupZoomLegend();
	self.repositionSlider("x");
	self.repositionSlider("y");
	self.repositionCamera(); //incase we're out of bounds, will happen if you zoom out at an edge
	
	//check if all values fit in current window, if so we don't need scrollers
	self.scrollers.x.toggle(xSlideMin < xPlotMin || xSlideMax > xPlotMax);
	self.scrollers.y.toggle(ySlideMin < yPlotMin || ySlideMax > yPlotMax);
};

Chart.prototype.repositionCamera = function(){
	var self = Chart.typesafe(this);
	
	var pan = { left: 0, top: 0 };
	
	if(self.camera.x > self.camera.panMax.x){
		pan.left = self.camera.panMax.x - self.camera.x;
	}
	if(self.camera.x < self.camera.panMin.x){
		pan.left = self.camera.panMin.x - self.camera.x;
	}
	if(self.camera.y > self.camera.panMax.y){
		pan.top = -(self.camera.panMax.y - self.camera.y);
	}
	if(self.camera.y < self.camera.panMin.y){
		pan.top = -(self.camera.panMin.y - self.camera.y);
	}
	
	self.flot.pan(pan);
};

Chart.prototype.update = function(series_list){
	var self = Chart.typesafe(this);
	
	for (var i = 0; i < series_list.length; i++){
        var element = series_list[i];
        var label = element['label'];
		var seriesIndex = self.findSeriesIndex(label);
		if(seriesIndex == -1){
			seriesIndex = self.addSeries(label);
		}

        var points = element['points'];
		for(var j = 0; j < points.length; j++) {
			var point = points[j];
		
            //var domain, xdomain, xMax;
            // This is likely where we'd implement ENT-4278
            self.series()[seriesIndex].data.push([point.x, point.y]);	//put new data in the array
			self.bounds.yMin = 0;
			self.bounds.yMax = util.maxOrDefault(point.y, self.bounds.yMax);
            if (self.flot) {
				self.windowXAxis(point.x);
                self.windowYAxis(self.bounds.yMin, self.bounds.yMax);
            } else {
                if (point.y > (self.options.yaxes[0].max * 0.75)){
                    self.options.yaxes[0].max = Math.ceil(point.y * 1.75);
                }

                var range = self.options.xaxes[0].max - self.options.xaxes[0].min;
                while (point.x > self.options.xaxes[0].max){
                    self.options.xaxes[0].max = self.options.xaxes[0].max + 10000;
                    range = self.options.xaxes[0].max - self.options.xaxes[0].min;
                    self.options.xaxes[0].tickSize = [range / 10000, "second"];
                }
            }
		}
	}
	
	self.draw();
	self.updateChartDecorations();
};

Chart.prototype.windowXAxis = function(newX){
	var self = Chart.typesafe(this);

	if(newX > self.flot.getOptions().xaxes[0].max){
		self.flot.getOptions().xaxes[0].max = self.flot.getOptions().xaxes[0].max + 10000;
		var range = self.flot.getOptions().xaxes[0].max - self.flot.getOptions().xaxes[0].min;
		
		self.flot.getOptions().xaxes[0].tickSize = [range / 10000, "second"];	//set for current drawing
		self.options.xaxes[0].max = self.flot.getOptions().xaxes[0].max;		//set for future drawing
		self.options.xaxes[0].tickSize = [range / 10000, "second"];				
	}
};

Chart.prototype.windowYAxis = function(min, max){
	var self = Chart.typesafe(this);

	var range = max - min;
	var windowedMax = 0;
	
	if(range == 0){
		self.flot.getOptions().yaxes[0].min = 0;
		self.options.yaxes[0].min = 0;
		windowedMax = max == 0 ? self.flot.getOptions().yaxes[0].max : util.floatFix(max * 1.30);
	}else{
		self.flot.getOptions().yaxes[0].min = 0;
		self.options.yaxes[0].min = 0;
		windowedMax = Math.ceil(min + (range * 1.30));
	}
	if (windowedMax > 5 && windowedMax < 10 ) {
		windowedMax = 10;
	}else if (windowedMax > 10 && windowedMax < 100) {
		windowedMax = (Math.ceil(windowedMax/10)) * 10;
	} else if (windowedMax > 100 && windowedMax < 1000) {
		windowedMax = (Math.ceil(windowedMax/100)) * 100;
	} else if (windowedMax > 1000 && windowedMax < 10000) {
		windowedMax = (Math.ceil(windowedMax/1000)) * 1000;
	}
	self.flot.getOptions().yaxes[0].max = windowedMax;
	self.options.yaxes[0].max = windowedMax;
};

Chart.prototype.findSeriesIndex = function(label){
	var self = Chart.typesafe(this);
	
	for(var i = 0; i < self.series().length; i++){
		if(self.series()[i].label == label){
			return i;
		}
	}

	return -1;
};

Chart.prototype.addSeries = function(label){
	var self = this;
	
	var color = self.settings.seriesColors[self.series().length] || "#FFF";
	self.series.push(new Chart.GraphSeries(label, color, self));
	return self.series().length - 1;
};

Chart.prototype.initFlot = function(){
	var self = Chart.typesafe(this);

    self.root.css({ width: self.settings.width });
	self.chart = self.root.find(".chart");
    if(self.chart.length > 0){
        self.chart.css({ width: self.settings.width, height: self.settings.height })
        self.flot = $.plot(self.chart, self.series(), self.options);
    }
};

Chart.prototype.draw = function(){
	var self = Chart.typesafe(this);
	
	if(!self.flot || self.root.find(".chart").is(":empty")){
		self.initFlot();
	}else{
		self.flot.setData(self.series());
		self.flot.setupGrid();
		self.flot.draw();
	}
};

Chart.prototype.finish = function(){
	var self = Chart.typesafe(this);
	
	self.isFinished = true;
	self.enableHover();
	self.draw();
	self.updateChartDecorations();
};

Chart.prototype.enableHover = function(){
	var self = Chart.typesafe(this);
	
	if(self.flot){
		self.flot.getOptions().grid.hoverable = true;
		self.flot.bindEvents()
	}else{
		self.options.grid.hoverable = true;
		self.initFlot();
	}
	
	self.chart.off().on("plothover", self.hover.bind(self));
};

Chart.prototype.hover = function(e, position, item){
    var self = null;
    try {
        self = Chart.typesafe(this);
    }
    catch (e) {
        return;
    }

	if(item){
        self.positionX = position.pageX;
        self.positionY = position.pageY;
		if(self.previousPoint != item.dataIndex
                || self.previousLabel != item.series.label){
			self.previousPoint = item.dataIndex;
			self.previousLabel = item.series.label;
			$("#tooltip").remove();
			self.showToolTip(item).bind(self);
		}
	}else{
        if (self.positionX === null
                || self.positionX === undefined
                || self.positionY === null
                || self.positionY === undefined) {

            self.previousPoint = null;
            $("#tooltip").remove();
            return;
        }

        if (position.pageX > self.positionX + 10
                || position.pageX < self.positionX - 10
                || position.pageY > self.positionY + 10
                || position.pageY < self.positionY - 10) {

            self.positionX = null;
            self.positionY = null;

            self.previousPoint = null;
            $("#tooltip").remove();
        }
	}
//	if(item){
//        self.removing = false;
//        window.clearTimeout(self.removingTimeout);
//        self.removingTimeout = null;
//		if(self.previousPoint != item.dataIndex){
//			self.previousPoint = item.dataIndex;
//			$("#tooltip").remove();
//			self.showToolTip(item).bind(self);
//		}
//	}else{
//        if (self.removing) {
//            return;
//        }
//
//        self.removing = true;
//        self.removingTimout = setTimeout(function () {
//            self.previousPoint = null;
//            $("#tooltip").remove();
//        }, 500);
//	}
    e.stopPropagation();
    e.preventDefault();
};

Chart.prototype.showToolTip = function(item){
	var self = Chart.typesafe(this);
	
    var date = new Date(item.datapoint[0]);
    var time = {
        seconds : util.padNumber(date.getUTCSeconds(), 2),
        minutes : util.padNumber(date.getUTCMinutes(), 2),
        hours : util.padNumber(date.getUTCHours(), 2)

    };

    var value = item.datapoint[1];

    if (value > 1000) {
        value = value.toFixed(0);
    } else if (value > 100) {
        value = value.toFixed(1);
    } else if (value > 10) {
        value = value.toFixed(2);
    } else {
        value = value.toFixed(3);
    }

	var data = {
		time : time.hours + ':' + time.minutes + ":" + time.seconds,
		value : util.commafyNumber(value),
		direction : item.series.label,
		bandwidth : '' 
	};
	var tooltip = $("#tooltip-tmpl").tmpl(data);
	var height = 85;
	var width = 175 + ((item.series.label.length - 4)*6); //a hack to make the tooltip scale
	var yBump = 20; //the amount above the dot to shift
	
	tooltip.css({
		position: "absolute",
		width: width,
		height: height,
		top: item.pageY - self.chart.offset().top - (height + yBump),
		left: item.pageX - self.chart.offset().left - (width/2)
	});
	
	tooltip.appendTo(self.chart);
	
	return tooltip;
};

Chart.prototype.setupLabels = function(){
	var self = Chart.typesafe(this);
	var plotProperties = self.plotProperties;
	
	self.chart.find(".xAxisLabel").remove();
	var xlabel = $("<div class='xAxisLabel'><span>" + translate("Time") + "</span></div>").css({
		position : "absolute",
		// top : plotProperties.realGraphHeight + plotProperties.graphMarginTop + plotProperties.graphMarginBottom, // for overlay
		top : plotProperties.realGraphHeight + plotProperties.graphMarginTop + plotProperties.graphMarginBottom + 9, // for snugged against
		left : plotProperties.yAxisLabelWidth + plotProperties.graphMarginLeft,
		width : plotProperties.realGraphWidth
	});
	self.chart.append(xlabel);

	self.chart.find(".yAxisLabel").remove();
	var yAxisLabel;
	if (self.settings.yAxisLabel){
		yAxisLabel = self.settings.yAxisLabel;
	} else if (self.yAxisLabel) {
		yAxisLabel = self.yAxisLabel;
	} else {
		yAxisLabel = "Units";
	}
	var ylabel = $("<div class='yAxisLabel'><span>"+yAxisLabel+"</span></div>").css({
		position : "absolute",
		bottom : plotProperties.xAxisLabelHeight + plotProperties.graphMarginBottom,
		left : plotProperties.yAxisLabelWidth + plotProperties.graphMarginLeft - 1,
		width: plotProperties.realGraphHeight
	});
	self.chart.append(ylabel);
};

Chart.prototype.setupScrollers = function(){
	var self = Chart.typesafe(this);
	
	var scrubberSecondaryDimension = 10; //height on horizontal, width on vertical
	var scrollerPadding = 2;
	
	self.setupScroller("x", scrollerPadding, scrubberSecondaryDimension);
	self.setupScroller("y", scrollerPadding, scrubberSecondaryDimension);
	
	self.setupTouchScrolling();
};

Chart.prototype.setupScroller = function(axis, scrollerPadding, scrubberSecondaryDimension){
	var self = Chart.typesafe(this);

	var ratio = self.camera.resolution[axis] / self.plotProperties.fullPlot.resolution[axis];
	var scrubberTrackPrimaryDimension;
	if(axis == "x"){
		// scrubberTrackPrimaryDimension = (self.plotProperties.realGraphWidth - (scrollerPadding*4) - scrubberSecondaryDimension); // for overlay
		scrubberTrackPrimaryDimension = (self.plotProperties.realGraphWidth - (scrollerPadding*4) + 5);
	}else{
		// scrubberTrackPrimaryDimension = (self.plotProperties.realGraphHeight - (scrollerPadding*4) - scrubberSecondaryDimension); // for overlay
		scrubberTrackPrimaryDimension = (self.plotProperties.realGraphHeight - (scrollerPadding*4) + 4);
	}
	var scrubberPrimaryDimension = scrubberTrackPrimaryDimension * ratio;
	var cornerSize = scrubberSecondaryDimension + (scrollerPadding*2)
	
	var scrollerCss;
	var sliderCss;
	var handleCss;

	if(axis == "x"){
		scrollerCss = {
			position : "absolute",
			// bottom : self.plotProperties.xAxisLabelHeight + self.plotProperties.graphMarginBottom - 1, // for overlay
			bottom : self.plotProperties.xAxisLabelHeight - (self.plotProperties.graphMarginBottom - 1), // for snugged below
			// left : self.plotProperties.yAxisLabelWidth + self.plotProperties.graphMarginLeft, // for overlay
			left : self.plotProperties.yAxisLabelWidth + self.plotProperties.graphMarginLeft - 1, // for snugged below
			// width : scrubberTrackPrimaryDimension + cornerSize, //stretch it all the way to the end as not to leave empty corner, but we won't use the whole thing for the slider
			width : scrubberTrackPrimaryDimension,
			height : scrubberSecondaryDimension,
			padding : scrollerPadding
		};
		sliderCss = {
			width : scrubberTrackPrimaryDimension - scrubberPrimaryDimension, //same as above minus the scrubber overhang
			"margin-left" : (scrubberPrimaryDimension/2),
			height: scrubberSecondaryDimension
		};
		handleCss = {
			width : scrubberPrimaryDimension,
			height: scrubberSecondaryDimension,
			"margin-left" : -(scrubberPrimaryDimension/2)
		};

		// if (scrubberPrimaryDimension >= scrubberTrackPrimaryDimension) {
		// 	scrollerCss.display = 'none';
		// } else {
		// 	scrollerCss.display = 'default';
		// }

	}else{
		var scrollerCss = {
			position : "absolute",
			top : self.plotProperties.graphMarginTop + 1, //border
			// right : self.plotProperties.graphMarginRight, // for overlay  // currently, 3 -> -11 = -14
			right : -1 - scrubberSecondaryDimension,
			// height : scrubberTrackPrimaryDimension + cornerSize,  //stretch it all the way to the end as not to leave empty corner, but we won't use the whole thing for the slider
			height : scrubberTrackPrimaryDimension,
			width : scrubberSecondaryDimension,
			padding : scrollerPadding
		};
		var sliderCss = {
			height : scrubberTrackPrimaryDimension - scrubberPrimaryDimension, //same as above minus the scrubber overhang
			"margin-top" : (scrubberPrimaryDimension/2),
			width: scrubberSecondaryDimension
		};
		var handleCss = {
			height : scrubberPrimaryDimension,
			width: scrubberSecondaryDimension,
			"margin-bottom" : -(scrubberPrimaryDimension/2)
		};

		// if (scrubberPrimaryDimension >= scrubberTrackPrimaryDimension) {
		// 	scrollerCss.display = 'none';
		// } else {
		// 	scrollerCss.display = 'default';
		// }
	}
	
	var maxRange = scrubberTrackPrimaryDimension - scrubberPrimaryDimension  //Set for max granularity;		

    if (!self.chart.find('.' + axis + 'AxisScroller') || !self.scrollers[axis]) {
        self.scrollers[axis] = $("<div class='" + axis + "AxisScroller'><div class='scroller'></div></div>");
        self.sliders[axis] = self.chart.append(self.scrollers[axis])
            .find("." + axis + "AxisScroller .scroller").slider({
                slide : self.scroll.bind(self, axis, maxRange),
                min : 0,
                max : maxRange,
                orientation : axis == "x" ? "horizontal" : "vertical",
                value : 0
            });
    }

	self.scrollers[axis].css(scrollerCss)
		.find(".scroller")
			.css(sliderCss)
			.slider("option", "max", maxRange)
			.slider("option", "slide", self.scroll.bind(self, axis, maxRange))
			.find(".ui-slider-handle")
				.css(handleCss);
};

Chart.prototype.setupTouchScrolling = function(){
	var self = Chart.typesafe(this);
	var chart = self.chart;
	
	var lastTouchMoveLocation = { x: 0, y: 0 };
	
	chart.off(".chart");
	chart
		.on("touchstart.chart", touchstart)
		.on("touchdrag.chart", touchdrag)
	
	function touchstart(e){
		var e = e.originalEvent.targetTouches[0];
		lastTouchMoveLocation = { x: e.pageX, y : e.pageY };
	}
	
	function touchdrag(e){
		var eventData = e.originalEvent.targetTouches[0];
		
		var dragOffset = {
			x : -1 * (eventData.pageX - lastTouchMoveLocation.x),
			y : -1 * (eventData.pageY - lastTouchMoveLocation.y)
		};
		
		//bound
		var newCameraX = self.camera.x + dragOffset.x;
		newCameraX = Math.max(newCameraX, self.camera.panMin.x);
		newCameraX = Math.min(newCameraX, self.camera.panMax.x);
		
		var newCameraY = self.camera.y + dragOffset.y;
		newCameraY = Math.max(newCameraY, self.camera.panMin.y);
		newCameraY = Math.min(newCameraY, self.camera.panMax.y);
		
		var delta = {};
		delta.left = newCameraX - self.camera.x;
		delta.top = newCameraY - self.camera.y;
		
		self.flot.pan(delta);
		self.camera.x += delta.left;
		self.camera.y += delta.top;
		
		lastTouchMoveLocation = {
			x : eventData.pageX,
			y : eventData.pageY
		};
		
		//self.updateChartDecorations();
		
		e.preventDefault();
	}
};

Chart.prototype.disposeScrollers = function(){
	var self = Chart.typesafe(this);

    self.scrollers.x = null;
    self.scrollers.y = null;
};

Chart.prototype.scroll = function(axis, max, e, ui){
	var self = Chart.typesafe(this);

	if(!self.camera) return; //If camera not setup you can't scroll
	var slideRatio = ui.value / max;
	var newFocus = (slideRatio * self.camera.panResolution[axis]) + self.camera.resolution["half_" + axis];
	var delta = newFocus - self.camera[axis];
	var panInfo = { x: 0, y: 0 };
	panInfo[axis] = delta * self.plotProperties.coordDirection[axis]; //Panning is in real pixel coords so we need to flip it if y
	self.pan(panInfo);
	self.camera[axis] = newFocus;
};

Chart.prototype.repositionSlider = function(axis){
	var self = Chart.typesafe(this);
	if(self.camera.panResolution[axis] > 0){
		var cameraPositionRatio = (self.camera[axis] - self.camera.resolution["half_" + axis]) / self.camera.panResolution[axis];
		var sliderValue = self.sliders[axis].slider("option", "max") * cameraPositionRatio;
		self.sliders[axis].slider("value", sliderValue);
	}
};

Chart.prototype.setupZoomLegend = function(){
	var self = Chart.typesafe(this);
	var sliderWidth = 180;
	
	if(!self.zoomLegend || self.root.find('.zoomLegend .zoomSlider div').length == 0){
		self.zoomLegend = self.root.find(".zoomLegend");
		self.zoomSlider = self.zoomLegend.find(".zoomSlider").slider({
			slide : function(e, ui){
				var zoomChange = ui.value / self.currentZoom;
				self.zoom({amount: zoomChange});
				self.currentZoom = ui.value;
			},
			min : 1,
			max : self.settings.maxZoom,
			range : "min",
			step : ((self.settings.maxZoom - 1) / sliderWidth)
		}).css({
			width: sliderWidth
		});
	}
};

Chart.prototype.pan = function(delta){
	var self = Chart.typesafe(this);
	
	self.updateChartDecorations();
	
	self.flot.pan({ left: delta.x, top: delta.y });
};

Chart.prototype.zoom = function(zoom){
	var self = Chart.typesafe(this);
	
	if(!zoom.center){
		zoom.center = { left : self.camera.resolution.half_x, top : self.camera.resolution.half_y };
	}

	self.flot.zoom(zoom);
	self.updateChartDecorations();
};

Chart.typesafe = function(that){
	if (!(that instanceof Chart)) {
        throw 'This method must be executed on a Chart';
    }

    return that;
};

Chart.GraphSeries = function(label, color, chart){
	var self = this;
	
	self.chart = chart;
	self.data = [];
	self.label = label;
	self.color = color;
	self.points = {
		fillColor : color
	};
	self.lines = {
		alpha : 0.1
	};
	self.shadowSize = 0;
	
	self.enabled = ko.observable(true);
	self.iconFill = ko.computed(self.computeIconFill.bind(self));
};

Chart.GraphSeries.prototype.toggle = function(){
	var self = Chart.GraphSeries.typesafe(this);
	
	self.enabled(!self.enabled());
	self.points.show = self.lines.show = self.enabled();
	self.chart.draw.call(self.chart);
};

Chart.GraphSeries.prototype.computeIconFill = function(){
	var self = Chart.GraphSeries.typesafe(this);

	return self.enabled() ? self.color : "transparent";
};

Chart.GraphSeries.typesafe = function(that){
	if (!(that instanceof Chart.GraphSeries)) {
        throw 'This method must be executed on a GraphSeries';
    }

    return that;
};