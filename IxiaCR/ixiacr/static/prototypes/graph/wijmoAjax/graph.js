$(document).ready(function(){	
	var i = 0;
	
	chartUI.ajaxGet(i);
	var interval = setInterval(function(){
		if(i > 8){
			clearInterval(interval);
		}else{
			chartUI.ajaxGet(++i);
		}
	},500);
});

var chartUI = (function(){
	
	var graphInit = false;
	var graphData;
	var graph;
	var currentIndex = 0;
	
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
				$("#graph").wijlinechart("addSeriesPoint", 0, {x: data[i].x, y: data[i].y }); 
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
						autoMin : false,
						autoMax : false,
						min : 0,
						max : 10,
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
	
	return {
		ajaxGet : ajaxGet
	};
	
})();