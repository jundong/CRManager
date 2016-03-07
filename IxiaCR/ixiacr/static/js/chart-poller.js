"use strict";

function ChartPoller(chart, table, settings, resultsVm){
    var self = this;

    self.timer;
    self.settings = { pollDuration : 12000, pollFrequency : 1000, url : "graph/dataPartial/data0.json.js", pollOnHidden : true, autoStart : true, onFinish : $.noop, onPollSuccess : $.noop };
    $.extend(self.settings, settings);
    self.retries = 0;
    self.polling = false;
    self.nextPoll = null;
    self.chart = chart;
    self.table = table;
    self.resultsVm = resultsVm;
    self.tag = Math.random();
    self.togglePolling(self.settings.autoStart);
    return self;
};

ChartPoller.prototype.stopPolling = function(){
    var self = ChartPoller.typesafe(this);

    clearInterval(self.timer);
    //self.resultsVm.zoomVisible(true);
    self.polling = false;
    self.nextPoll = null;
    self.stop = true;			//Superfluous? Perhaps related code wants to use .polling instead?
};

ChartPoller.prototype.startPolling = function(){
    var self = ChartPoller.typesafe(this);

    if (self.polling) {
        return;
    }
    self.resultsVm.zoomVisible(false);
    self.nextPoll = (new Date()).getTime() + self.settings.pollFrequency;
    self.setNextPoll();
    self.polling = true;
};

ChartPoller.prototype.togglePolling = function(value){
    var self = ChartPoller.typesafe(this);
    var shouldPoll = value == undefined ? !self.polling : value;

    if(shouldPoll){
        self.startTime = new Date().getTime();
        self.retries = 0;
        self.startPolling();
    }else{
        self.stopPolling();
    }
};

ChartPoller.prototype.dispose = function(){
    var self = ChartPoller.typesafe(this);
    
    self.stopPolling();
    self = null;
};
    
ChartPoller.prototype.poll = function(){
    var self = ChartPoller.typesafe(this);

    if(!self.settings.pollOnHidden && (self.chart.chart.length < 1 || !self.chart.chart.is(":visible"))){
        return;
    } 

    var resultsUrl = self.settings.url;
    var requestData = { lastUpdated : self.lastUpdated };

    $.ajax({
        url : resultsUrl,
        type: "POST",
        data : requestData,
        dataType : "json",
        success : self.pollAjaxSuccess.bind(self),
        error: self.pollAjaxError.bind(self)
    });
};

ChartPoller.prototype.pollAjaxSuccess = function(data){
	var self = ChartPoller.typesafe(this);

    if (data.is_error === true) {
        self.stopPolling();
        self.resultsVm.abortAndSurfaceError(data);
        return;
    }

	self.pollSuccess.call(self, data);
    if (data.EndOfStream) {
        self.stopPolling();
        self.settings.onFinish();
        self.chart.finish();
    }
    else if (self.polling) {
        self.setNextPoll();
    }
    if(data.status){
        self.resultsVm.status(data.status);
    }
    self.settings.onPollSuccess(data);
};

ChartPoller.prototype.setNextPoll = function(response){
    var self = ChartPoller.typesafe(this);
    var currentTime = (new Date()).getTime();

    var timeRemaining = self.nextPoll - currentTime;

    self.nextPoll += self.settings.pollFrequency;

    if (timeRemaining > 0) {
        self.timer = setTimeout(self.poll.bind(self), timeRemaining);
    } else {
        self.nextPoll = currentTime + self.settings.pollFrequency;
        self.poll();
    }
};

ChartPoller.prototype.pollSuccess = function(response){
    var self = ChartPoller.typesafe(this);

    self.retries = 0;
    self.lastUpdated = response.lastUpdated;
    if (response.percentage_complete !== null && response.percentage_complete !== undefined && response.percentage_complete !== '' && response.percentage_complete !== '0' && Math.round(response.percentage_complete) !== 0 && response.percentage_complete > self.resultsVm.percentComplete()) {
         var percentage = Math.round(response.percentage_complete);
    } else {
         var percentage = self.resultsVm.percentComplete();
    }
    if(percentage > 100){
        percentage = 100;
    }
    self.resultsVm.percentComplete(percentage);
    self.chart.update(response.data);
    //self.table.update(response.table);
};

ChartPoller.prototype.pollAjaxError = function(xhr,error){
    logger.error(error);
    this.retries++;

    if (this.retries >= 3) {
        // Show user a failure message
        util.lightbox.error(translate('Running test'));
        return; // Short-circuit
    }

    // Retry
    this.setNextPoll();
};

ChartPoller.typesafe = function(that){
    if (!(that instanceof ChartPoller)) {
        throw 'This method must be executed on a ChartPoller';
    }

    return that;
};

function ResultTypeViewModel(resultType){
    var self = this;
    self.id = resultType.id;
    self.name = resultType.name;
    self.description = resultType.description;
    self.frequency = resultType.frequency || 1000;
    self.url = resultType.url;
    self.width = resultType.width || 610;
    self.height = resultType.height || 400;
}


