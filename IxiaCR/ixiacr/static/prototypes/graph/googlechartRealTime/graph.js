var settings = {
	duration : 500
}

document.addEventListener("DOMContentLoaded", function(){	  
	var i = 0;
	
	chartUI.ajaxGet(i);
	var interval = setInterval(function(){
		// if(i > 8){
			// clearInterval(interval);
		// }else{
			// chartUI.ajaxGet(++i);
		// }
		chartUI.drawChart(JSON.stringify([{ x: ++i, y: Math.random() * 20}]));
		
	},settings.duration);
}, true);

var chartUI = (function(){
	
	var graphInit = false;
	var graphData;
	var graph;
	var currentIndex = 0;
	var maxPoints = 10;
	var options = {
		title : "Test Chart",
		titleTextStyle : {
			fontName : "arial",
			fontSize : 18,
			color : "black"
		},
		titlePosition: "out",
		colors : [ "#0000FF" ],
		hAxis : {
			viewWindowMode : "explict",
			viewWindow : {
				min : 0,
				max : 10
			},
			gridlines: {
				count : 10,
				color: "#CCC"
			},
			textStyle : {
				fontName : "arial",
				fontSize : 12,
				color : "black"
			}
		},
		vAxis : {
			viewWindowMode : "explict",
			viewWindow : {
				min : 0,
				max : 20
			},
			gridlines: {
				count : 20,
				color: "#CCC"
			},
			textStyle : {
				fontName : "arial",
				fontSize : 12,
				color : "black"
			}
		},
		chartArea : {
			width: 1280,
			height: 720,
			top : 40,
			left: 40
		},
		width: 1400,
		height: 800
	};
	
	function ajaxGet(suffix){
		ajax.makeRequest({
			url : "../dataPartial/data" + suffix + ".json.js",
			success: drawChart,
			error: function(a,error){
				console.log("Ajax error: " + error);
			}
		});
	}
	
	function drawChart(data){
		data = JSON.parse(data);
		if(graphInit){
			for(var i = 0; i < data.length; i++){
				if(currentIndex + i < maxPoints){ 
					graphData.addRows([
						[data[i].x, data[i].y]
					]);
				}else{
					graphData.addRows([
						[data[i].x, data[i].y]
					]);
					graphData.removeRow(0);
					options.hAxis.viewWindow.min++;
					options.hAxis.viewWindow.max++;
				}
			}
			graph.draw(graphData, options);
		}else{
			graphData = new google.visualization.DataTable();
			graphData.addColumn("number", "x");
			graphData.addColumn("number", "series 1")
			for(var i = 0; i < data.length; i++){
				graphData.addRows([
					[data[i].x, data[i].y]
				]);
			}
			graph = new google.visualization.LineChart(document.getElementById('graph'));
			graph.draw(graphData, options);
			graphInit = true;
		}
		currentIndex += data.length;
	}
	
	return {
		ajaxGet : ajaxGet,
		drawChart : drawChart
	};
	
})();

var ajax = (function(){

	function makeRequest(settings){
		var success = settings.success || function(data){ console.log(data);};
		var error = settings.error || function(status){ console.log("GET ERROR Status: " + status + " for URL: " + url);};
		var async = settings.async == undefined ? true : settings.async;
		var url = settings.url || "";
		var method = settings.method || "GET";
	
		var request = new XMLHttpRequest();
		request.open(method, url, async);
		
		request.onreadystatechange = function(){
			if(request.readyState == 4){
				if(request.status == 200){
					success(request.responseText);
				}else{
					error(request.status);
				}
			}
		}
		
		request.send();
	}
	
	return {
		makeRequest : makeRequest
	};

})();