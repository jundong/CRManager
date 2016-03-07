function resolvePluralFormId(dictionary, pluralIndicator) {
    var n = pluralIndicator;
    // TODO replace eval with a better alternative
    return eval(dictionary.pluralFormExpression);
}

function getMessage(dictionary, messageKey, pluralIndicator) {
    var message = dictionary.content[messageKey];

    if (message === undefined) {
        window.logger.info('Missing translation for: ' + messageKey);
        message = messageKey;
    }

    if (typeof message === 'object') {
        if (pluralIndicator === null) {
            throw "pluralIndicator is required";
        }

        message = message[resolvePluralFormId(dictionary, pluralIndicator)];
    }

    return message;
}

function interpolate(message, mapping) {
    // TODO implement more efficient algorithm of interpolation
    var result = message,
        prop;

    for (prop in mapping) {
        if (mapping.hasOwnProperty(prop)) {
            result = result.replace('{' + prop + '}', mapping[prop]);
        }
    }

    return result;
}

function translate(dictionary, messageKey, mapping, pluralIndicatorAttr) {
    var pluralIndicator = null,
        message;

    if (pluralIndicatorAttr !== undefined) {
        pluralIndicator = mapping[pluralIndicatorAttr];
    }

    message = getMessage(dictionary, messageKey, pluralIndicator);

    if (mapping !== undefined) {
        if (message !== undefined) {
            message = interpolate(message, mapping);
        } else {
            logger.warning("Missing translation for messageKey: " + messageKey);
            message = interpolate(messageKey, mapping);
        }
    }

    return message;
}

/**
 * @param dictionary is an object containing translations for one
 * language. Example of dictionary:
 * {
     *     pluralFormExpression: '(n==1 ? 0 : 1)',
     *     content: {
     *         'License Upload': 'License Upload',
     *         'Showing {number} Tracks': {
     *             0: 'Showing {number} Track',
     *             1: 'Showing {number} Tracks'
     *         }
     *     }
     * }
 * @returns {Function} accepting three arguments: message key, object
 * containing message parameters, name of parameter used for defining
 * plural form.
 */
function Translator(dictionary) {
    return translate.bind(this, dictionary);
}

module.exports = Translator;