(function () {
    var should = require('chai').should(),
        sinon = require('sinon'),
        Scheduler = require('scheduler'),
        RootVm = { },
        TestViewModel = { }
    ko = { applyBindings: function() { }, observable: function() {}, computed: function() {} } // global mock!

    describe('Scheduler', function () {
        describe('.render()', function () {
            it('should render calendar', function () {
                var scheduler = new Scheduler(sinon.mock(RootVm), sinon.mock(TestViewModel))

                scheduler.render()

                should.exist(document.querySelector('.dhx_cal_data table'))
            });

            it('should render schedule test button', function () {
            });
        });
    });
})();
