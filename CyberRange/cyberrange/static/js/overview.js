	$(document).ready(function(){
		$('.hs-area').hotspotter({ imgTopMargin: 50 });
		
		$("#bps_link").on('click',function(){
			//document.getElementById("panel_title").innerHTML = "BPS";
			//document.getElementById("link").src = "http://192.168.0.108";
			window.open('http://192.168.0.132');
		});
		$("#BPS").on('click',function(){
			//document.getElementById("panel_title").innerHTML = "BPS";
			//document.getElementById("link").src = "http://192.168.0.108";
			window.open('http://192.168.0.132');
		});
        $('#bps_link').bind('mouseover', function (e) {
            if (e.target.tagName == 'BUTTON') {
                $('#' + $(e.target).text()).hotspotter('trigger');
            }
        });
        $('#bps_link').bind('mouseout', function (e) {
            if (e.target.tagName == 'BUTTON') {
                $('#' + $(e.target).text()).hotspotter('untrigger');
            }
        });
        
		$("#atip_link").on('click',function(){
			window.open('http://192.168.0.150');
		});
		$("#ATIP").on('click',function(){
			window.open('http://192.168.0.150');
		});
        $('#atip_link').bind('mouseover', function (e) {
            if (e.target.tagName == 'BUTTON') {
                $('#' + $(e.target).text()).hotspotter('trigger');
            }
        });
        $('#atip_link').bind('mouseout', function (e) {
            if (e.target.tagName == 'BUTTON') {
                $('#' + $(e.target).text()).hotspotter('untrigger');
            }
        });
        
		$("#splunk_link").on('click',function(){
			//document.getElementById("panel_title").innerHTML = "Splunk";
			//document.getElementById("link").src = "http://192.168.0.106:8000/en-US/app/launcher/home";
			window.open('http://192.168.0.133:8000/en-US/app/launcher/home');
		});
		$("#Splunk").on('click',function(){
			//document.getElementById("panel_title").innerHTML = "Splunk";
			//document.getElementById("link").src = "http://192.168.0.106:8000/en-US/app/launcher/home";
			window.open('http://192.168.0.133:8000/en-US/app/launcher/home');
		});
        $('#splunk_link').bind('mouseover', function (e) {
            if (e.target.tagName == 'BUTTON') {
                $('#' + $(e.target).text()).hotspotter('trigger');
            }
        });
        $('#splunk_link').bind('mouseout', function (e) {
            if (e.target.tagName == 'BUTTON') {
                $('#' + $(e.target).text()).hotspotter('untrigger');
            }
        });
        
		$("#kali_link").on('click',function(){
			//document.getElementById("panel_title").innerHTML = "Kali";
			//document.getElementById("link").src = "http://192.168.0.106:8000/en-US/app/launcher/home";
			window.open('ssh://192.168.0.170/');
		});
		$("#Kali").on('click',function(){
			//document.getElementById("panel_title").innerHTML = "Kali";
			//document.getElementById("link").src = "http://192.168.0.106:8000/en-US/app/launcher/home";
			window.open('ssh://192.168.0.170/');
		});
        $('#kali_link').bind('mouseover', function (e) {
            if (e.target.tagName == 'BUTTON') {
                $('#' + $(e.target).text()).hotspotter('trigger');
            }
        });
        $('#kali_link').bind('mouseout', function (e) {
            if (e.target.tagName == 'BUTTON') {
                $('#' + $(e.target).text()).hotspotter('untrigger');
            }
        });
        
		$("#metasploitable_link").on('click',function(){
			//document.getElementById("panel_title").innerHTML = "Attack Target";
			//document.getElementById("link").src = "http://192.168.0.106:8000/en-US/app/launcher/home";
			window.open('ssh://192.168.0.171/');
		});
		$("#AttackTarget").on('click',function(){
			//document.getElementById("panel_title").innerHTML = "Attack Target";
			//document.getElementById("link").src = "http://192.168.0.106:8000/en-US/app/launcher/home";
			window.open('ssh://192.168.0.171/');
		});
        $('#metasploitable_link').bind('mouseover', function (e) {
            if (e.target.tagName == 'BUTTON') {
                $('#' + $(e.target).text()).hotspotter('trigger');
            }
        });
        $('#metasploitable_link').bind('mouseout', function (e) {
            if (e.target.tagName == 'BUTTON') {
                $('#' + $(e.target).text()).hotspotter('untrigger');
            }
        });
        
		$("#dlp_link").on('click',function(){
			//document.getElementById("panel_title").innerHTML = "DLP";
			//document.getElementById("link").src = "http://192.168.0.106:8000/en-US/app/launcher/home";
			window.open('https://192.168.0.140/');
		});
		$("#IPS").on('click',function(){
			//document.getElementById("panel_title").innerHTML = "DLP";
			//document.getElementById("link").src = "http://192.168.0.106:8000/en-US/app/launcher/home";
			window.open('https://192.168.0.140/');
		});
        $('#dlp_link').bind('mouseover', function (e) {
            if (e.target.tagName == 'BUTTON') {
                $('#' + $(e.target).text()).hotspotter('trigger');
            }
        });
        $('#dlp_link').bind('mouseout', function (e) {
            if (e.target.tagName == 'BUTTON') {
                $('#' + $(e.target).text()).hotspotter('untrigger');
            }
        });
        
		$("#ips_link").on('click',function(){
			//document.getElementById("panel_title").innerHTML = "IPS"
			//document.getElementById("link").src = "http://192.168.0.106:8000/en-US/app/launcher/home";
			window.open('https://192.168.0.134/');
		});
		$("#NGFW").on('click',function(){
			//document.getElementById("panel_title").innerHTML = "IPS"
			//document.getElementById("link").src = "http://192.168.0.106:8000/en-US/app/launcher/home";
			window.open('https://192.168.0.134/');
		});
        $('#ips_link').bind('mouseover', function (e) {
            if (e.target.tagName == 'BUTTON') {
                $('#' + $(e.target).text()).hotspotter('trigger');
            }
        });
        $('#ips_link').bind('mouseout', function (e) {
            if (e.target.tagName == 'BUTTON') {
                $('#' + $(e.target).text()).hotspotter('untrigger');
            }
        });
        
		$("#ngfw_link").on('click',function(){
			//document.getElementById("panel_title").innerHTML = "NGFW"
			//document.getElementById("link").src = "http://192.168.0.106:8000/en-US/app/launcher/home";
			window.open('https://192.168.0.101/');
		});
		$("#DLP").on('click',function(){
			//document.getElementById("panel_title").innerHTML = "NGFW"
			//document.getElementById("link").src = "http://192.168.0.106:8000/en-US/app/launcher/home";
			window.open('https://192.168.0.101/');
		});
        $('#ngfw_link').bind('mouseover', function (e) {
            if (e.target.tagName == 'BUTTON') {
                $('#' + $(e.target).text()).hotspotter('trigger');
            }
        });
        $('#ngfw_link').bind('mouseout', function (e) {
            if (e.target.tagName == 'BUTTON') {
                $('#' + $(e.target).text()).hotspotter('untrigger');
            }
        });
        
		$("#windows_link").on('click',function(){
			//document.getElementById("panel_title").innerHTML = "Windows"
			//document.getElementById("link").src = "http://192.168.0.106:8000/en-US/app/launcher/home";
			window.open('ssh://192.168.0.132/');
		});
		$("#Windows").on('click',function(){
			//document.getElementById("panel_title").innerHTML = "Windows"
			//document.getElementById("link").src = "http://192.168.0.106:8000/en-US/app/launcher/home";
			window.open('ssh://192.168.0.132/');
		});
        $('#windows_link').bind('mouseover', function (e) {
            if (e.target.tagName == 'BUTTON') {
                $('#' + $(e.target).text()).hotspotter('trigger');
            }
        });
        $('#windows_link').bind('mouseout', function (e) {
            if (e.target.tagName == 'BUTTON') {
                $('#' + $(e.target).text()).hotspotter('untrigger');
            }
        });   
	});