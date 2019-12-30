/**
 * Lib "all-templates"
 * Main module
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const render = async function(modules, ...args) {
    let template, data, options, dataKeys, hasTemplate;

    if ('string' === typeof args[0]) {
        template = args.shift();
        args[0] = args[0] || {};
        hasTemplate = true;
    }

    data = args[0];
    options = args[1] || {};

    const isDataMap = data instanceof Map;
    let entryPointName = options['start_name'] || modules.C.ENTRY_POINT_NAME;

    if (template) {
        if (isDataMap) {
            data.set(entryPointName, template);
        } else if ('object' === typeof data) {
            data[entryPointName] = template;
        }
    }

    modules.V.InputValidator(modules, {data, options, isDataMap, hasTemplate});

    if (isDataMap) {
         dataKeys = [];
        for (let key of data.keys()) {
            dataKeys.push(key);
        }
    } else {
        dataKeys = Object.keys(data);
    }

    const openPh  = options.placeholder && options.placeholder.open || modules.C.PH_START;
    const closePh = options.placeholder && options.placeholder.close || modules.C.PH_END;

    let renderData = {
        globalData: data,
        currentData: data,
        options,
        dataKeys,
        openPh,
        openPhLength: openPh.length,
        closePhLength: closePh.length,
        layersInProgress: [],
        processedLayers: {},
        visibleChain: []
    };

    return await modules.IR(renderData, entryPointName, modules);
};

module.exports = { render };