/**
 * Lib "all-templates"
 * Render function
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

const phComponentsSplitter = /\S+/g;


const findKeyAndItsValue = function(name, keySet, obj, isMap) {
    for (let candidateKey of keySet) {
        let test = (candidateKey instanceof RegExp) ? candidateKey.test(name) : (candidateKey === name);
        if (test) {
            let value = isMap ? obj.get(candidateKey) : obj[candidateKey];
            return {
                key: candidateKey,
                ph: name,
                value: value
            };
        }
    }

    return { value: undefined };
};

const formatMessage = function (params) {
    const {layer, phEntry, position, exceptionName, tailsLength, E} = params;
    const phStart = position - phEntry.length;
    const leftTailStart = Math.max(0, phStart - tailsLength);
    const rightTailEnd = position + tailsLength + 1;
    const addMessage = `${(leftTailStart > 0) ? '...' : ''}${layer.value.substring(leftTailStart, rightTailEnd)}` +
        `${(rightTailEnd < layer.value.length) ? '...' : ''} [layer: "${layer.key}", placeholder: "${phEntry}"].`;

    E.Throw(E.Exceptions[exceptionName], addMessage);
};

const checkStatus = function(allowedStatuses, opStack, fullEntry, E) {
    let notFound = true;

    if (opStack.length > 0) {
        let realStatus = opStack[opStack.length - 1].operator;
        for (let allowedStatus of allowedStatuses) {
            if (realStatus === allowedStatus) {
                notFound = false;
                break;
            }
        }
    }

    if (notFound) {
        E.Throw(E.Exceptions.INVALID_CONTROL_FLOW, `The "${fullEntry}" placeholder is not preceded by ` +
            `"${allowedStatuses.join(' | ')}".`)
    }
};

const getLayer = async function(renderData, layerName, modules) {
    const {options, processedLayers} = renderData;
    let renderedPlaceholder;
    if (options.mode && options.mode.fast && processedLayers.hasOwnProperty(layerName)) {
        renderedPlaceholder = processedLayers[layerName];
    } else {
        renderedPlaceholder = await internalRender(renderData, layerName, modules);
        processedLayers[layerName] = renderedPlaceholder;
    }

    return renderedPlaceholder;
};

const getVisibility = function (opStack) {
    let isVisible = true;

    for (let item of opStack) {
        isVisible = isVisible && item.isVisible;
    }

    return isVisible;
};

const checkCountOfParts = function(params) {
    const {numOfComponents, expect, layer, fullEntry, position, tailsLength, E} = params;
    if (numOfComponents < expect) {
        formatMessage({layer, fullEntry, position, exceptionName: 'TOO_FEW_PARTS', tailsLength, E});
    }
    if (numOfComponents > expect) {
        formatMessage({layer, fullEntry, position, exceptionName: 'TOO_MANY_PARTS', tailsLength, E});
    }
};

const internalRender = async function(renderData, layerName, modules) {
console.log('===> start processing ', layerName)
    const { C, E } = modules;
    const {data, options, getters, isDataMap, dataKeys, isGettersMap, gettersKeys, phFinder} = renderData;

    const tailsLength = C.E_TAILS_LENGTH;

    if (renderData.layersInProgress.includes(layerName)) {
        E.Throw(E.Exceptions.CYCLIC_DEPENDENCE, renderData.visibleChain.join(' -> '));
    }
    renderData.layersInProgress.push(layerName);

    /* a trying to find the getter */
    let getter = {};

    if (gettersKeys) {
        if (gettersKeys === 'single') {
            getter = {value: getters};
        } else {
            getter = findKeyAndItsValue(layerName, gettersKeys, getters, isGettersMap);
        }
    }

    /* a trying to find the current Layer */
    let layer = { value: '' };

    if (dataKeys) {
        layer = findKeyAndItsValue(layerName, dataKeys, data, isDataMap);
        if (layer.value === undefined) {
            return (options && options.hasOwnProperty('undefined')) ? options.undefined : undefined
        }

        if ('string' !== typeof layer.value) {
            return layer.value;
        }
    }

    if (getter.value) {
        layer = await getter.value({...layer, data, options, getters});
    }

    /* placeholders processing */
    let match;
    let result = '';
    let position = 0;
    let opStack = [];

    while ((match = phFinder.exec(layer.value)) != null) {
        let phName, operator, renderedPlaceholder, currentOperator;
        let [fullEntry, fullPlaceholder] = match;
        
        if (getVisibility(opStack) && (position < match.index)) {
            result += layer.value.substring(position, match.index);
        }

        position = phFinder.lastIndex;

        /* split placeholder to components and analise it */
        let phComponents = fullPlaceholder.match(phComponentsSplitter);
        if (!phComponents) {
            formatMessage({layer, fullEntry, position, exceptionName: 'EMPTY_PLACEHOLDER', tailsLength, E});
            return; // for the testing purpose
        }

        const maybeOperator = phComponents[0].toLowerCase();
        if (OPS_VALUES.includes( maybeOperator )) {
            operator = maybeOperator;
            phName = phComponents[1];
        } else {
            operator = OPERATORS.INSERT;
            phName = phComponents[0];
            phComponents = [OPERATORS.INSERT, phComponents[0]]; // for the length correction
        }
        const numOfComponents = phComponents.length;

        renderData.visibleChain.push(phName);

        switch (operator) {
            case OPERATORS.INSERT:
                checkCountOfParts({numOfComponents, expect: 2, layer, fullEntry, position, tailsLength, E});
                if (getVisibility(opStack)) {
                    renderedPlaceholder = await getLayer(renderData, phName, modules);

                    result += renderedPlaceholder;
                }
                break;

            case OPERATORS.IF:
                checkCountOfParts({numOfComponents, expect:2, layer, fullEntry, position, tailsLength, E});
                renderedPlaceholder = getVisibility(opStack) ?
                    await getLayer(renderData, phName, modules) : false;
                opStack.push({ operator: OPERATORS.IF, fullEntry: fullEntry, isVisible: !!renderedPlaceholder });
                break;

            case OPERATORS.UNLESS:
                checkCountOfParts({numOfComponents, expect: 2, layer, fullEntry, position, tailsLength, E});
                renderedPlaceholder = getVisibility(opStack) ?
                    await getLayer(renderData, phName, modules) : false;
                opStack.push({ operator: OPERATORS.UNLESS, fullEntry: fullEntry, isVisible: !renderedPlaceholder });
                break;

            case OPERATORS.ELSE:
                checkCountOfParts({numOfComponents, expect: 1, layer, fullEntry, position, tailsLength, E});
                checkStatus([OPERATORS.IF, OPERATORS.UNLESS], opStack, fullEntry, E);
                currentOperator = opStack[opStack.length - 1];
                currentOperator.isVisible = ! currentOperator.isVisible;
                break;

            case OPERATORS.END:
                checkCountOfParts({numOfComponents, expect: 1, layer, fullEntry, position, tailsLength, E});
                checkStatus([OPERATORS.IF, OPERATORS.UNLESS], opStack, fullEntry, E);
                opStack.pop();
                break;

            case OPERATORS.COMMENT:
                break;

        }

        renderData.visibleChain.pop();
    }

    if (opStack.length > 0) {
        let operators = [];
        for (let operator of opStack) {
           operators.push(operator.fullEntry);
        }
        operators = operators.join(' ... ');

        E.Throw(
            E.Exceptions.INVALID_CONTROL_FLOW,
            `Unclosed statements detected: ... ${operators} ... [layer: "${layerName}"]`
        );
    }

    renderData.layersInProgress = renderData.layersInProgress
        .filter(function(item) {return item !== layerName});
console.log('===> finish and remove ', layerName, renderData.layersInProgress)
    result += layer.value.substring(position);

    return result;
};

module.exports = internalRender;