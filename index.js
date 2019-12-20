/**
 * Lib "all-templates"
 * Entry point
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const main = require('./lib/main');

const dependencies = {
    IR: require('./lib/internal_render'),
    E:  require('./lib/exceptions'),
    C:  require('./lib/constants'),
    V:  require('./lib/validators')
};

const wrapper = async function(...args) {
    return await main.render(dependencies, ...args);
};

module.exports = {
    render: wrapper
};