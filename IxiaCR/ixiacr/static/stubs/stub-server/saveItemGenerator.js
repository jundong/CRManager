var itemGenerators,
	id;

id = 100;

function getGenericResponseObject() {
	return {
		messages: [
			{
				content: null,
				header: 'Success',
				is_error: false
			}
		],
		result: 'SUCCESS',
		items: [{}]
	};
}

function getNextId() {
	id += 1;
	return id;
}

function getGenericResponseObjectForDataWithId(data) {
	var responseObject = getGenericResponseObject();

	if (data.id <= 0 || data.id === undefined) {
		responseObject.items[0].id = getNextId();
	} else {
		responseObject.items[0].id = data.id;		
	}

	console.log('Received Id: ' + data.id);
	console.log('Returned Id: ' + responseObject.items[0].id);
	return responseObject;
}

function generateSaveDeviceResponse(data) {
    var random = Math.floor(Math.random() * 10),
        responseObject;

    if (random > 8) {
        responseObject = getGenericResponseObjectForDataWithId(data);
        responseObject.messages[0].content = 'There was an error';
        responseObject.messages[0].header = 'Failure';
        responseObject.messages[0].is_error = true;
        responseObject.result = 'FAILURE';

    } else {
        responseObject = getGenericResponseObjectForDataWithId(data);
        responseObject.messages[0].content = 'Successfully saved device';
    }

	return JSON.stringify(responseObject);
}
function generateSaveEndpointResponse(data) {
	var responseObject = getGenericResponseObjectForDataWithId(data);
	responseObject.messages[0].content = 'Successfully saved endpoint';
	return JSON.stringify(responseObject);
}
function generateSaveTrackResponse(data) {
	var responseObject = getGenericResponseObjectForDataWithId(data);
	responseObject.messages[0].content = 'Successfully saved endpoint';
	return JSON.stringify(responseObject);
}
function generateSavePlaylistResponse(data) {
	var responseObject = getGenericResponseObjectForDataWithId(data);
	responseObject.messages[0].content = 'Successfully saved endpoint';
	return JSON.stringify(responseObject);
}
function generateSaveTestTemplateResponse(data) {
	var responseObject = getGenericResponseObjectForDataWithId(data);
	responseObject.messages[0].content = 'Successfully saved endpoint';
	return JSON.stringify(responseObject);
}
function generateSaveAxonTestResponse(data) {
	var responseObject = getGenericResponseObjectForDataWithId(data);
	responseObject.messages[0].content = 'Successfully saved endpoint';
	return JSON.stringify(responseObject);
}
function generateUnknownResponse(data) {
	var responseObject = getGenericResponseObject();

	responseObject.messages[0].content = 'Unknown request';
	responseObject.messages[0].header = 'Fail';
	responseObject.messages[0].is_error = true;
	responseObject.result = 'FAILURE';

	return JSON.stringify(responseObject);
}

itemGenerators = {
	save_device: generateSaveDeviceResponse,
	save_endpoint: generateSaveEndpointResponse,
	save_track: generateSaveTrackResponse,
	save_playlist: generateSavePlaylistResponse,
	save_test_template: generateSaveTestTemplateResponse,
	save_axon_test: generateSaveAxonTestResponse
};

function generateSaveItemResponse(data, pathname) {
	var action = pathname.split('/').pop();

	if (itemGenerators[action] !== undefined && typeof itemGenerators[action] === 'function') {
		return itemGenerators[action](data);
	}

	return generateUnknownResponse(pathname);
}

exports.generateSaveItemResponse = generateSaveItemResponse;