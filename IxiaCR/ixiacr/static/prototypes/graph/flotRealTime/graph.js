var settings = {
	duration : 500
};

$(document).ready(function(){	
	var i = 0;
	
	chartUI.drawChart([ { x: 0, y: Math.random() * 20 } ]);
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
	var options = {
		xaxis : {
			min : 0,
			max : 10,
			color : "#000000",
			tickSize : 1,
			tickDecimals : 0
		},
		yaxis : {
			min : 0,
			max : 20,
			color : "#000000",
			tickSize: 1,
			tickDecimals : 0
		},
		grid : {
			color : "#CCCCCC",
			borderColor : "#000000"
		},
		legend : {
			labelBoxBorderColor: "#000000"
		}
	};
	
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
				if(currentIndex + i < maxPoints){
					graphData.push([data[i].x, data[i].y]);
				}else{
					graphData.push([data[i].x, data[i].y]);
					graphData = graphData.slice(1);
					options.xaxis.min++;
					options.xaxis.max++;
				}
			}
			//graph.setData([{data: graphData, lable: "series 1", color: "#0000FF", shadowSize: 0}]);
			graph = $.plot("#graph", [{data: graphData, label: "series 1", color: "#0000FF", shadowSize: 0}], options);
			graph.draw();
		}else{
			graphData = [];
			for(var i = 0; i < data.length; i++){
				graphData.push([data[i].x, data[i].y]);
			}
			
			graph = $.plot("#graph", [{data: graphData, label: "series 1", color: "#0000FF", shadowSize: 0}], options);
			graph.draw();
			graphInit = true;
		}
		currentIndex += data.length;
	}
	
	return {
		ajaxGet : ajaxGet,
		drawChart : drawChart
	};
	
})();