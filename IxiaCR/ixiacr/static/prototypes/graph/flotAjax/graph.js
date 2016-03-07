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
				graphData.push([data[i].x, data[i].y]);
			}
			graph.setData([{data: graphData, lable: "series 1", color: "#0000FF", shadowSize: 0}]);
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
	}
	
	return {
		ajaxGet : ajaxGet
	};
	
})();