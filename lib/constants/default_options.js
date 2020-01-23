/**
 * Lib "all-templates"
 * Set of Constants
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

module.exports = {
    placeholder: {
        open:  '{{',
        close: '}}'
    },
    entryPoint  : 'start',
    escapeSymbol: '\\',
    printError: {
        lineSeparator: '\r\n',
        indentation: '\t',
        maxWidth: 120
    },
    debug: true
};
