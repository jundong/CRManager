var settings = {
	duration : 500
};

$(document).ready(function(){	
	var i = 10;
	
	chartUI.drawChart([{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0},{x:4,y:0},{x:5,y:0},{x:6,y:0},{x:7,y:0},{x:8,y:0},{x:9,y:0}]);
	var interval = setInterval(function(){
		// if(i > 8){
			// clearInterval(interval);
		// }else{
			// chartUI.ajaxGet(++i);
		// }
		chartUI.drawChart([ { x: ++i, y: Math.random() * 20 } ]);
		
	},settings.duration);
});

var chartUI = (function(){
	
	var graphInit = false;
	var graphData;
	var graph;
	var currentIndex = 0;
	var maxPoints = 10;
	
	function ajaxGet(suffix){
		$.ajax({
			url : "../dataPartial/data" + suffix + ".json.js",
			dataType : "json",
			success: drawChart,
			error: function(a,error){
				console.log("Ajax error: " + error);
			}
		});
	}
	
	function drawChart(data){
		if(graphInit){
			for(var i = 0; i < data.length; i++){
				$("#graph").wijlinechart("addSeriesPoint", 0, {x: data[i].x, y: data[i].y }, currentIndex + i > maxPoints);
				animateChart();
			}
		}else{
			$("#graph").wijlinechart({
				header: {
					text : "Test Chart",
					textStyle : {
						"font-family" : "arial",
						"font-size" : "18px",
						fill : "black"
					}
				},
				seriesList: [
					{
						label: "Series 1",
						legendEntry: true,
						dataSource: data,
						data: { x: { bind: 'x' }, y: { bind: 'y' }}
					}
				],
				seriesStyles: [
					{
						stroke: "#0000FF",
						"stroke-width" : 2.0
					}
				],
				animation : {
					enabled : false,
					duration: 0,
					easing: ""
				},
				seriesTransition : {
					enabled : false
				},
				axis: {
					x : {
						gridMajor : {
							visible : true,
							style : {
								stroke : "#CCC",
								"stroke-dasharray" : "none",
								"stroke-width" : 1.0
							}
						},
						labels : {
							style : {
								"font-family" : "arial",
								"font-size" : "12px",
								color : "black",
								"font-weight" : "normal"
							}
						}
					},
					y : {
						autoMin : false,
						autoMax : false,
						min : 0,
						max : 20,
						gridMajor : {
							visible : true,
							style : {
								stroke : "#CCC",
								"stroke-dasharray" : "none",
								"stroke-width" : 1.0
							}
						},
						labels : {
							style : {
								"font-family" : "arial",
								"font-size" : "12px",
								color : "black",
								"font-weight" : "normal"
							}
						}
					}
				},
				width: 1280,
				height: 720,
				marginLeft: 0,
				marginTop: 0,
				showChartLabels : false
			});
			graphInit = true;
		}
		currentIndex += data.length;
	}
	
		function animateChart() {
			var path = $("#graph").wijlinechart("getLinePath", 0),
				markers = $("#graph").wijlinechart("getLineMarkers", 0),
				box = path.getBBox(),
				width = $("#graph").wijlinechart("option", "width") / 10,
				anim = Raphael.animation({transform: Raphael.format("...t{0},0", -width)}, settings.duration);
			path.animate(anim);
			if (path.shadow) {
				var pathShadow = path.shadow;
				pathShadow.animate(anim);
			}
			//markers.animate(anim);
			var rect = box.x + " " + (box.y - 5) + " " + box.width + " " + (box.height + 10);
			path.wijAttr("clip-rect", rect);
			markers.attr("clip-rect", rect);
		}
	
	return {
		ajaxGet : ajaxGet,
		drawChart : drawChart
	};
	
})();