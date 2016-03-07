function generateDeviceStatuses(data) {
	var statuses = new Array();

	if (data['deviceIds[]'] == undefined) {
		return JSON.stringify({devices: []});
	}

	for (var i = 0; i < data['deviceIds[]'].length; i++) {
		statuses.push(getDeviceStatusFor(data['deviceIds[]'][i]));
	}

	return JSON.stringify(statuses);
}

function getDeviceStatusFor(idString) {
	var id = Number(idString);

	if (id == NaN) {
		return null;
	}

	var response = {};
	response.id = id;
	response.ports = new Array();

	switch (id) {
		case 1:
		case 3:
			response.ports.push(getRandomPortStatus());
			response.ports.push(getRandomPortStatus());
			response.ports.push(getRandomPortStatus());
			response.ports.push(getRandomPortStatus());
			break;
		case 2:
		case 4:
			response.ports.push(getRandomPortStatus());
			response.ports.push(getRandomPortStatus());
			break;
	}

	return response;
}

function getRandomPortStatus() {
	var random = Math.floor((Math.random()*100) + 1);

	if (random < 10) {
		return {
			link_status: "DOWN",
            line_speed: null,
            carrier: false
		};
	}

	if (random < 30) {
		return {
			link_status: "UP",
            line_speed: 100,
            carrier: true
		};
	}

	return {
		link_status: "UP",
        line_speed: 1000,
        carrier: true
	};
}

exports.generateDeviceStatuses = generateDeviceStatuses;
