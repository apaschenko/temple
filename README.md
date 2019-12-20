### Template Engine [![npm version](https://badge.fury.io/js/all-templates.svg)](https://badge.fury.io/js/all-templates)  [![Coverage Status](https://coveralls.io/repos/bitbucket/apaschenko/all-templates/badge.svg)](https://coveralls.io/bitbucket/apaschenko/all-templates)

Fast JS nested templates rendering.

##### The main goal 
of this library is to provide you with maximum functionality while saving ease of use in simple cases of its using.

Goal | Implemented
 --- | ---
Ease of use | yes, using its meets intuitive expectations.
Configurability | yes, you can change almost everything: from the placeholders to the general rendering behavior.
Nested layers | yes, with an unlimited level of nesting (it restricted only on the size of available memory).
The ability to store data anywhere | yes, with synchronous or asynchronous loading of its on demand.

### Installation
```javascript
npm install all-templates --save
```

### Using

```javascript
const AT = require('all-templates');

try {
    let result = await AT.render(data, options, functions)
} catch(e) {
    console.log(e);
} 
```

-- or --

```javascript
const AT = require('all-templates');

try {
    let result;
    AT.render(data, options, functions)
        .then(res => { result = res })
} catch(e) {
    console.log(e);
} 
```


### Brief (quick start)

**First:** yes, render is an asynchronous function. 
##### Why? 
Because it allows you not only to parse the templates defined as strings, but also to request the patterns(layers) from the file system, databases etc. (a detailed explanation is below).

```javascript
AT.render(data, options, functions)

AT.render(template, data, options, functions)
```

##### Parameters

 Parameter | Required | Type 
 --- | --- | ---
data | Mandatory (if template don't presents) <br/> Optional (otherwise) | Object ⎮ Map
template | Optional | String
options | Optional | Object
functions | Optional | Object ⎮ Map
 
### Detailed description
 
 Data is the main conception of this library.
 As a rule, template rendering libraries need for two parameters: 
 - one or many templates that must be processed; 
 - input data that will be inserted into templates instead corresponding placeholders in the templates.

However, this library does not distinguish between the two sets. From its point of view, "everything is a data."
The "data" parameter contains both a template (a set of layers) and input data for substitutions instead of 
placeholders.

But how does it understand during processing whether the current element is an input data or a template?
Nohow! It does not need to know this.

**All-templates** works very simply:

First of all, it finds the `start` key (if you have not redefined the name of this key in 
`options.start_name`) in the `data` object/map and takes its value.

If this value contains placeholders, the library finds the value of the corresponding keys in the same `data` 
parameter. If, in turn, it also contain placeholders, then the process is repeated recursively.

When the nested layer (or input data) have no more placeholders, it is substituted into layer above instead the 
placeholder that corresponding to its name. It's all!

**Options**

Option | Type | Description | Default
 ---   | --- | --- | ---
start_name | String &#124; RegExp | Key name in the "data" parameter, from which the rendering will start | "start"
mode | Object | fast: if true, each layer will be rendered once
placeholder | Object: { open: &#60;String&#62;, close: &#60;String&#62;} | Overrides the opening and closing part of the placeholder (for European languages - left and right, respectively) .Be careful: overridden values ​​will be part of the regular expression. Therefore, if you use special characters of regular expressions for your placeholders, then each such character must be escaped with two backslashes. For example, if you want to use a placeholder `((...))`, then you should specify `placeholder: {open: '\\(\\(', close: '\\)\\)'}` | `placeholder: {open: "{{", close: "}}"}`
undefined | String | If data source not found or undefined, it will be replaced to the defined value| 'undefined' 
**Getters**

Function | Object<String: Functions> | Map<String|RegExp: Functions>

**Placeholders**

Placeholder | Description
 --- | ---
 {{ &#x3c;name&#x3e; }} | The value of name will be inserted instead placeholder
 {{ = <name> }} | The same as above
 {{ if &#x3c;name&#x3e; }} ... [ {{ else }} ... ] {{ end }} | if operator
 {{ unless &#x3c;name&#x3e; }} ... [ {{ else }} ... ] {{ end }} | unless operator
 {{ # ... some text ... }} | commentaries