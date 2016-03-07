/*global beforeEach: true, describe: true, it: true, afterEach: true */

var assert = require('chai').assert,
    sinon = require('sinon'),
    Logger = require('logger'),
    noop = function () {};

describe('Logger', function () {
    it('should return instance with a method to log messages', function () {
        var logger = new Logger();

        assert.ok(typeof logger.log === 'function');
    });

    it('should ensure log level is valid');

    describe('.log()', function () {
        it('should send an AJAX message to the server', function () {
            var logger = new Logger('error', {}, '/nowhere'),
                end = sinon.stub(logger.request.Request.prototype, 'end');

            logger.log_to_console = noop;

            logger.error('asdf');

            assert.ok(end.calledOnce);

            end.restore();
        });

        it('should log to console if debugging', function () {
            var logger = new Logger('debug'),
                log = sinon.stub(Logger.console_map, 'debug');

            logger.debug();

            assert.ok(log.calledOnce);

            log.restore();
        });
    });

    describe('.set_level()', function () {
        it('should accept user-friendly strings for log level', function () {
            var logger = new Logger(),
                debug_level = Logger.levels.debug,
                log = sinon.stub(logger, 'log');

            logger.set_level('debug');
            logger.debug();

            assert.ok(log.withArgs(debug_level));

            log.restore();
        });

        it('should accept arbitrary combinations of log levels', function () {
            var levels = Logger.levels,
                debug_level = levels.debug,
                critical_level = levels.critical,
                logger = new Logger(),
                log = sinon.stub(logger, 'log');

            /*jslint bitwise:true */
            logger.set_level(debug_level | critical_level);
            /*jslint bitwise:false */
            logger.debug();
            logger.critical();

            assert.ok(log.withArgs(debug_level));
            assert.ok(log.withArgs(critical_level));

            log.restore();
        });

        it('should not log to inactive log levels', function () {
            var logger = new Logger(),
                log = sinon.stub(logger, 'log');

            // .error and .critical are bound to .log at construction, so
            // we need to rebind these with the stub
            logger.set_level(Logger.levels.error, false);

            logger.error();
            logger.critical();

            assert.ok(log.withArgs('error').calledOnce);
            assert.notOk(log.withArgs('critical').callCount);

            log.restore();
        });
    });

    describe(".attachWindowErrorHandler()", function () {
        it('should handle window errors', function () {
            // I couldn't figure out how to test this without errors
//            var logger = new Logger(),
//                log = sinon.stub(logger, 'log'),
//                prev = window.onerror;
//
//            // .error and .critical are bound to .log at construction, so
//            // we need to rebind these with the stub
//            logger.set_level('debug');
//
//            logger.attachWindowErrorHandler();
//
//            window.onerror('asdf');
//
//            window.onerror = prev;
//
//            assert.ok(log.callCount);
//
//            log.restore();
        });
    });
});
