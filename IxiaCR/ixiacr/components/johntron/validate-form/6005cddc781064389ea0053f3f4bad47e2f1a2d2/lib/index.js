
var adapter = require('./adapter');
var bind = require('bind');
var event = require('event');
var clone = require('clone');
var Field = require('./field');
var submit = require('submit-form');
var Vldtr = require('validator');
var validators = require('./validators');


/**
 * Expose `Validator`.
 */

module.exports = exports = Validator;


/**
 * Initialize a new `Validator`.
 *
 * @param {Element} form
 */

function Validator (form) {
  if (!(this instanceof Validator)) return new Validator(form);
  this.form = form;
  this._validator = new Vldtr();
  this.adapter = clone(adapter);
  this.validators = clone(validators);
  this.submit = bind(this, this.submit);
  this.bind();
}


/**
 * Use a `plugin`.
 *
 * @param {Function} plugin
 * @return {Validator}
 */

Validator.prototype.use = function (plugin) {
  plugin(this);
  return this;
};


/**
 * Set an aditional trigger `event` for individual field validation.
 *
 * @param {String} event
 * @return {Validator}
 */

Validator.prototype.on = function (event) {
  this._event = event;
  return this;
};


/**
 * Add a field `el` to be validated.
 *
 * @param {Element|String} el
 * @return {Validator}
 */

Validator.prototype.field = function (el) {
  if ('string' === typeof el) el = this.form.querySelector('[name="' + el + '"]');
  var field = new Field(el, this);
  if (this._event) field.on(this._event);

  this._validator.rule(function (val, done) {
    field.validate(done);
  });

  // let us chain `is` like we were the field
  this.is = function () {
    field.is.apply(field, arguments);
    return this;
  };

  return this;
};


/**
 * Validate each field and `callback(valid)`.
 *
 * @param {Function} callback
 * @return {Validator}
 */

Validator.prototype.validate = function (callback) {
  this._validator.validate(null, function (err, valid, msg) {
    callback && callback(err, valid, msg);
  });
  return this;
};


/**
 * Define a view-specific validator `fn`.
 *
 * @param {String|Object} name
 * @param {Function} fn
 * @return {Validator}
 */

Validator.prototype.validator = function (name, fn) {
  if ('object' == typeof name) {
    for (var key in name) this.validator(key, name[key]);
    return;
  }

  this.validators[name] = fn;
  return this;
};


/**
 * Define a view-specific el adapter `fn`.
 *
 * @param {Function} fn
 * @return {Validator}
 */

Validator.prototype.el = function (fn) {
  this.adapter.el = fn;
  return this;
};


/**
 * Define a view-specific value adapter `fn`.
 *
 * @param {Function} fn
 * @return {Validator}
 */

Validator.prototype.value = function (fn) {
  this.adapter.value = fn;
  return this;
};


/**
 * Define a view-specific valid adapter `fn`.
 *
 * @param {Function} fn
 * @return {Validator}
 */

Validator.prototype.valid = function (fn) {
  this.adapter.valid = fn;
  return this;
};


/**
 * Define a view-specific invalid adapter `fn`.
 *
 * @param {Function} fn
 * @return {Validator}
 */

Validator.prototype.invalid = function (fn) {
  this.adapter.invalid = fn;
  return this;
};


/**
 * Define a view-specific clear adapter `fn`.
 *
 * @param {Function} fn
 * @return {Validator}
 */

Validator.prototype.clear = function (fn) {
  this.adapter.clear = fn;
  return this;
};


/**
 * Bind the form's submit handler.
 *
 * @return {Validator}
 * @api private
 */

Validator.prototype.bind = function () {
  // capture to preempt other handlers
  event.bind(this.form, 'submit', this.submit, true);
  // prevent the browser from validating for us
  this.form.setAttribute('novalidate', true);
  return this;
};


/**
 * Unind the form's submit handler.
 *
 * @return {Validator}
 * @api private
 */

Validator.prototype.unbind = function () {
  // capture to preempt other handlers
  event.unbind(this.form, 'submit', this.submit, true);
  // enable browser form validation
  this.form.removeAttribute('novalidate');
  return this;
};


/**
 * Form submit handler.
 *
 * @param {Event} e
 * @api private
 */

Validator.prototype.submit = function (e) {
  e.stopImmediatePropagation();
  e.preventDefault();
  var self = this;
  this.validate(function (err, valid) {
    if (!err && valid) {
      self.unbind();
      submit(self.form);
    }
  });
};
