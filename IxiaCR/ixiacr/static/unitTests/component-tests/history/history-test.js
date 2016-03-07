//Sinon uses fake timer by default, messes up ajax tests.
sinon.config.useFakeTimers = false
//Qunit will run async tests out of order, this can mess up test
QUnit.config.reorder = false;

function popState(state){
	var evt = document.createEvent("CustomEvent");
	evt.initCustomEvent("popstate", false, false, {
		state : state
	});
	evt.state = state;
	window.dispatchEvent(evt);
}

spirentEnterpriseVm = {
	restoreState : function(){}
};

module("History");

test("Pushes to History When There Is No History", function(){
	var vm = {
		getState : function(){}
	};
	
	history.replaceState(); //null out the state
	
	this.stub(vm, "getState", function(){
		return { prop : "some value" };
	});
	
	this.stub(history, "pushState", function(state){
		deepEqual({ prop : "some value"}, state);
	});
	
	appHistory.push(vm);
	
	ok(vm.getState.calledOnce);
	ok(history.pushState.calledOnce);
});

test("Pushes to History When History is Different", function(){
	var historyState = { prop : "some value"}
	
	var vm = {
		getState : function(){ return historyState}
	};

	this.stub(util, "objectsEqual").returns(false);
	
	history.pushState("test2"); //we don't want a null state for history.state
	
	var historySpy = this.spy(history, "pushState", function(state){
		deepEqual(state, historyState);
	});
	
	appHistory.push(vm);
	
	ok(historySpy.calledOnce);
});

test("Replaces History When History is the Same", function(){
	var historyState = { prop : "some value"}
	
	var vm = {
		getState : function(){ return historyState }
	};

	this.stub(util, "objectsEqual").returns(true);
	
	history.pushState("test3"); //we don't want a null state for history.state
	
	var historySpy = this.spy(history, "replaceState", function(state){
		deepEqual(state, historyState);
	});
	
	appHistory.push(vm);
	
	ok(historySpy.calledOnce);
});

test("Loads History on History Change Event", function(){

	var historyState = { prop : "some value"}

	var historySpy = this.spy(spirentEnterpriseVm, "restoreState");

	popState(historyState);
	
	ok(historySpy.calledOnce);
});

test("Doesn't Load History If Null", function(){

	var historyState;

	var historySpy = this.spy(spirentEnterpriseVm, "restoreState");

	popState(historyState);
	
	ok(!historySpy.called);
});