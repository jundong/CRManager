document.addEventListener("DOMContentLoaded", function(){
	var list = $("#list");
	var list2 = $("#list2");
	var list3 = $("#list3");
	var list4 = $("#list4");
	var list5 = $("#list5");
	
	var scrollPanel = list.scroller({});
	var scrollPanel2 = list2.scroller({});
	var scrollPanel3 = list3.scroller({ orientation: "horizontal" });
	var scrollPanel4 = list4.scroller({ orientation: "horizontal" });
	var scrollPanel5 = list5.scroller({});
	
	document.body.onkeydown = function(e){
		var keycode = e.charCode || e.keyCode;
	
		if(keycode == 49){ //one
			list.scroller("reset");
		}
		if(keycode == 50){ //two
			list3.scroller("reset");
		}
	};
	
}, true);