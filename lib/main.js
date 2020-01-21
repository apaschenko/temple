/**
 * Lib "all-templates"
 * Main module
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const options = require('./constants/default_options');
const { mergeDeep } = require('./utils/general');

const render = async function(...args) {
    let template, data, dataKeys;

    if ('string' === typeof args[0]) {
        template = args.shift();
     }

    data    = { ...args[0] };

    mergeDeep(options, (args[1] || {}));

    const isDataMap = data instanceof Map;

    if ( template && ('object' === typeof args[1]) ) {
        if (isDataMap) {
            data.set(options.entryPoint, template);
        } else if ('object' === typeof data) {
            data[options.entryPoint] = template;
        }
    }

 //   modules.V.InputValidator(modules, {data, options, isDataMap, hasTemplate});

    if (isDataMap) {
         dataKeys = [];
        for (let key of data.keys()) {
            dataKeys.push(key);
        }
    } else {
        dataKeys = Object.keys(data);
    }

    let renderData = {
        options,
        dataKeys,
        globalData        : data,
        currentData       : data,
        openPhMaxPosition : options.placeholder.open.length  - 1,
        closePhMaxPosition: options.placeholder.close.length - 1
    };

    // TODO!
    const Parser = require('./classes/parser');
    const results = new Parser(renderData, 'start', data.start).parse();
    // return await require('./');
    return results;
};

module.exports = { render };