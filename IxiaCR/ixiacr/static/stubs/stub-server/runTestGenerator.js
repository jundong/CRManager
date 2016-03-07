var getResultsSeriesGenerator = require('./getResultsSeriesGenerator.js');

function generateRunTestResponse(data) {
	var response = getRandomValidationResponse();

	return JSON.stringify(response);
}

function getRandomValidationResponse() {
	var random = Math.floor((Math.random()*100) + 1);

	if (random < 10) {
		return {
			is_valid: false,
            is_ready: false,
            messages: [{ header: 'Fail', content: 'You did something wrong. Feel ashamed.', success: false, is_error: true}]
		};
	}

	if (random < 20) {
		return {
			is_valid: true,
            is_ready: false,
            messages: [{ header: 'Chasing down the lemmings.'}]
		};
	}

	if (random < 30) {
		return {
			is_valid: true,
            is_ready: false,
            messages: [{ header: 'Flipping all the switches.'}]
		};
	}

	if (random < 40) {
		return {
			is_valid: true,
            is_ready: false,
            messages: [{ header: 'Warming up the generators.'}]
		};
	}

	getResultsSeriesGenerator.setRunning();
	return {
		is_valid: true,
        is_ready: true,
        messages: [{ header: 'Success', content: 'All set!', is_error: false, success: true}]
	};
}


exports.generateRunTestResponse = generateRunTestResponse;