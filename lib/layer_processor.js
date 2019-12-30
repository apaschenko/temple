/**
 * Lib "all-templates"
 * Placeholder parser
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const STATUS = {
   TEXT: 'text',
   MAYBE_PH: 'ph',

};

function layerProcessor(renderData, layerName, placeholder, modules) {
    const { C: {E_TAILS_LENGTH, OPERATORS, OPS_VALUES}, E } = modules;
    const {
        globalData,
        currentData,
        options,
        dataKeys,
        openPh,
        openPhLength,
        closePhLength,
        layersInProgress,
        processedLayers,
        visibleChain
    } = renderData;

    let layerValue, layerRealName;

    renderData.visibleChain.push(`(${layerName})`);
    // A trying to get the layer
    if (currentData instanceof Map) {
        for (let candidateKey of dataKeys) {
            if (candidateKey instanceof RegExp) {
                if (candidateKey.test(layerName)) {
                    layerValue = currentData.get(candidateKey);
                    layerRealName = candidateKey;
                    break;
                }
            } else if (candidateKey === layerName) {
                layerValue = currentData.get(candidateKey);
                layerRealName = candidateKey;
                break;
            }
        }
    } else {
        layerValue = currentData[layerName];
    }

    if ('function' === typeof layerValue) {
        layerValue = layerValue(data, layerName, layerRealName);
    }

    if (renderData.layersInProgress.includes(fullLayerName)) {
        E.Throw(E.Exceptions.CYCLIC_DEPENDENCE, visibleChain.join(' -> '));
    }
    renderData.layersInProgress.push(layerName);



    renderData.layersInProgress = renderData.layersInProgress
        .filter(function(item) {return item !== fullLayerName});
}

// aaa['bb b'].ddd[eee].^2(ooo.ttt[' u u']).(ppp).fff[*, '" {{}} "', rrr['sss'] ].eee[*, ^(kkk)].lll[2].^2('7mmm').(nnn)

module.exports = layerProcessor;

// root['myData'].users -> .(filter.new) -> *.firstName.en -> translator -> capitalize -> '"{{}}"', ', ' -> trim

// data['myData'].users[*, '{{firstName}} {{lastName}}', ', '] -> translator.en
// data.usersGroup[*][filters.userFilter, patterns['user pattern'], userDelimiter] -> 'my trimmer' -> capitalize

{{ loop }}

//
