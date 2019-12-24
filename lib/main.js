/**
 * Lib "all-templates"
 * Main module
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const render = async function(modules, ...args) {
    let template, data, options, getters, dataKeys, gettersKeys, hasTemplate;

    if ('string' === typeof args[0]) {
        template = args.shift();
        args[0] = args[0] || {};
        hasTemplate = true;
    }

    data = args[0];
    options = args[1] || {};
    getters = args[2];

    const isDataMap = data instanceof Map;
    const isGettersMap = getters instanceof Map;
    let entryPointName = options['start_name'] || modules.C.ENTRY_POINT_NAME;

    if (template) {
        if (isDataMap) {
            data.set(entryPointName, template);
        } else if ('object' === typeof data) {
            data[entryPointName] = template;
        }
    }

    modules.V.InputValidator(modules, {data, options, getters, isDataMap, isGettersMap, hasTemplate});

    if (isDataMap) {
         dataKeys = [];
        for (let key of data.keys()) {
            dataKeys.push(key);
        }
    } else {
        dataKeys = Object.keys(data);
    }

    if (getters) {
        if ('function' === typeof getters) {
            gettersKeys = 'single'
        } else if (isGettersMap) {
            gettersKeys = [];
            for (let key of getters.keys()) {
                gettersKeys.push(key);
            }
        } else {
            gettersKeys = getters.keys();
        }
    } else {
        gettersKeys = false;
    }

    const pattern = (options.placeholder && options.placeholder.open || modules.C.PH_START)
        + '([^]+?)' + (options.placeholder && options.placeholder.close || modules.C.PH_END);

    let renderData = {
        data,
        options,
        getters,
        isDataMap,
        dataKeys,
        isGettersMap,
        gettersKeys,
        phFinder: RegExp(pattern, 'g'),
        layersInProgress: [],
        processedLayers: {},
        visibleChain: [entryPointName]
    };

    return await modules.IR(renderData, entryPointName, modules);
};

module.exports = { render };