> As of version `0.5.0` this library exposes ES modules. Use an ES module aware transpiler such as Webpack, Rollup or Browserify + babelify to bundle it for the browser.


# diffpatch

[![Build Status](https://secure.travis-ci.org/bpmn-io/jsondiffpatch.svg)](http://travis-ci.org/bpmn-io/jsondiffpatch)

Diff and patch JavaScript objects.


## Usage

```javascript
import {
  DiffPatcher
} from 'diffpatch';

const diffPatcher = new DiffPatcher();

const man = {
  name: 'Walt',
  childen: [
    'Susie',
    'Larry'
  ],
  age: 53
};

const woman = {
  name: 'Clarice',
  childen: [
    'Susie',
    'Larry',
    'Fen'
  ],
  age: 48
};

const diff = diffPatcher.diff(man, woman);
```


## Features

* min+gzipped `~16KB`
* runs on NodeJS and in the browser
* (optionally) uses [google-diff-match-patch](http://code.google.com/p/google-diff-match-patch/) for long text diffs (diff at character level)
* smart array diffing using [LCS](http://en.wikipedia.org/wiki/Longest_common_subsequence_problem), ***IMPORTANT NOTE:*** to match objects inside an array you must provide an ```objectHash``` function (this is how objects are matched, otherwise a dumb match by position is used). For more details, check [Array diff documentation](docs/arrays.md)
* reverse a delta
* unpatch (eg. revert object to its original state using a delta)
* simplistic, pure JSON, low footprint [delta format](docs/deltas.md)
* (optional) multiple [output formatters](docs/formatters.md)
* BONUS: `DiffPatcher#clone(obj)` (deep clone)


## Usage

``` javascript
import {
  DiffPatcher,
  dateReviver
} from 'diffpatch';

var diffPatch = new DiffPatcher();

// sample data
var country = {
  name: "Argentina",
  capital: "Buenos Aires",
  independence: new Date(1816, 6, 9),
  unasur: true
};

// clone country, using dateReviver for Date objects
var country2 = JSON.parse(JSON.stringify(country), dateReviver);

// make some changes
country2.name = "Republica Argentina";
country2.population = 41324992;
delete country2.capital;

var delta = diffPatch.diff(country, country2);

assertSame(delta, {
  "name":["Argentina","Republica Argentina"], // old value, new value
  "population":["41324992"], // new value
  "capital":["Buenos Aires", 0, 0] // deleted
});

// patch original
diffPatch.patch(country, delta);

// reverse diff
var reverseDelta = diffPatch.reverse(delta);
// also country2 can be return to original value with
// diffPatch.unpatch(country2, delta);

var delta2 = diffPatch.diff(country, country2);
assert(delta2 === undefined)
// undefined => no difference
```

Array diffing:

```javascript
import {
  DiffPatcher
} from 'diffpatch';

// sample data
var country = {
  name: "Argentina",
  cities: [
  {
    name: 'Buenos Aires',
    population: 13028000,
  },
  {
    name: 'Cordoba',
    population: 1430023,
  },
  {
    name: 'Rosario',
    population: 1136286,
  },
  {
    name: 'Mendoza',
    population: 901126,
  },
  {
    name: 'San Miguel de Tucuman',
    population: 800000,
  }
  ]
};

// clone country
var country2 = JSON.parse(JSON.stringify(country));

// delete Cordoba
country.cities.splice(1, 1);

// add La Plata
country.cities.splice(4, 0, {
  name: 'La Plata'
  });

// modify Rosario, and move it
var rosario = country.cities.splice(1, 1)[0];
rosario.population += 1234;
country.cities.push(rosario);

// create a configured instance, match objects by name
var diffPatcher = new DiffPatcher({
  objectHash: function(obj) {
    return obj.name;
  }
});

var delta = diffPatcher.diff(country, country2);

assertSame(delta, {
  "cities": {
    "_t": "a", // indicates this node is an array (not an object)
    "1": [
      // inserted at index 1
      {
        "name": "Cordoba",
        "population": 1430023
      }]
    ,
    "2": {
      // population modified at index 2 (Rosario)
      "population": [
        1137520,
        1136286
      ]
    },
    "_3": [
      // removed from index 3
      {
        "name": "La Plata"
      }, 0, 0],
    "_4": [
      // move from index 4 to index 2
      '', 2, 3]
  }
});
```

For more example cases (nested objects or arrays, long text diffs) check out [`test/examples/`](test/examples).

If you want to understand deltas, see [delta format documentation](docs/deltas.md).


## Installing

```sh
npm i diffpatch
```


## Options

You may customize the library by passing a number of options to `DiffPatcher`:

``` javascript
const options = {
  // used to match objects when diffing arrays, by default only === operator is used
  objectHash: function(obj) {
    // this function is used only to when objects are not equal by ref
    return obj._id || obj.id;
  },
  arrays: {
    // default true, detect items moved inside the array
    // (otherwise they will be registered as remove+add)
    detectMove: true,
    // default false, the value of items moved is not included in deltas
    includeValueOnMove: false
  },
  textDiff: {
    // default 60, minimum string length (left and right sides)
    // to use text diff algorythm: google-diff-match-patch
    minLength: 60
  },
  propertyFilter: function(name, context) {
    /*
     this optional function can be specified to ignore object properties (eg. volatile data)
    name: property name, present in either context.left or context.right objects
    context: the diff context (has context.left and context.right objects)
    */
    return name.slice(0, 1) !== '$';
  },
  cloneDiffValues: false /* default false. if true, values in the obtained delta will be cloned
    (using jsondiffpatch.clone by default), to ensure delta keeps no references to left or right objects. this becomes useful if you're diffing and patching the same objects multiple times without serializing deltas.
    instead of true, a function can be specified here to provide a custom clone(value)
    */
};
```

## Diff Formatters

We provide a number of diff formatters, check them out [here](docs/formatters.md).


## Extend the Library

```diff()```, ```patch()``` and ```reverse()``` functions are implemented using Pipes & Filters pattern, making it extremely customizable by adding or replacing filters on a pipe.

Check [Plugins documentation](docs/plugins.md) for details.


## Credits

This library is a fork of [jsondiffpatch](https://github.com/benjamine/jsondiffpatch) and borrows heavily from the original implementation.


## License

MIT