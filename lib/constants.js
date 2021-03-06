/**
 * Lib "all-templates"
 * Set of Constants
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const OPERATORS = {
    INSERT:  '=',
    IF:      'if',
    UNLESS:  'unless',
    ELSE:    'else',
    END:     'end',
    COMMENT: '#'
};

const OPS_VALUES = Object.values(OPERATORS);

module.exports = {
    PH_START:  '{{',
    PH_END:    '}}',
    ENTRY_POINT_NAME: 'start',
    E_TAILS_LENGTH: 20,
    ESC_SYMBOL: '\\',
    OPERATORS,
    OPS_VALUES
};