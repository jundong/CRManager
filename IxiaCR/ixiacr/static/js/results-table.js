"use strict";

function ResultsTable(){
	var self = this;
	
	self.headers = ko.observableArray([]);
	self.data = ko.observable([]);  //underlying data structure is more complicated but we don't want a million observables firing all the time, need to remember to manually update if properties change.
}

ResultsTable.prototype.update = function(table){
	var self = ResultsTable.typesafe(this);

	//Note: everything that comes in is being converted to string so that jquery templates doesn't try to template value 0 which makes it think the value is not used
	for(var i = 0; i < table.data.length; i++){
		var index = self.indexOf(table.data[i][0]);
		if(index != -1){
			for(var j = 1; j < table.data[i].length; j++){ //The first is a key name, don't add to it
				self.data()[index][j] = util.stringAdd(self.data()[index][j], table.data[i][j]);
			}
		}else{
			var dataRow = [];
			for(var j = 0; j < table.data[i].length; j++){
				dataRow.push(table.data[i][j].toString());
			}
			
			self.data().push(dataRow);
		}
	}
	
	for(var i = 0; i < table.headers.length; i++){
		if(self.headers.indexOf(table.headers[i]) == -1){
			self.headers.push(table.headers[i]);
		}
	}
	
	self.data(self.data()); //force a refresh since we've modified properties that aren't observable
};

ResultsTable.prototype.indexOf = function(key){
	var self = ResultsTable.typesafe(this);
	
	for(var i = 0; i < self.data().length; i++){
		if(self.data()[i][0] == key){
			return i;
		}
	}
	
	return -1;
};

ResultsTable.typesafe = function(that){
	if (!(that instanceof ResultsTable)) {
        throw 'This method must be executed on a ResultsTable';
    }

    return that;
};