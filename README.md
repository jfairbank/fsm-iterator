# fsm-iterator

[![Travis branch](https://img.shields.io/travis/jfairbank/fsm-iterator/master.svg?style=flat-square)](https://travis-ci.org/jfairbank/fsm-iterator)
[![npm](https://img.shields.io/npm/v/fsm-iterator.svg?style=flat-square)](https://www.npmjs.com/package/fsm-iterator)

A finite state machine iterator for JavaScript.

Use fsm-iterator to implement a finite state machine generator function without
the need for generator `function*` syntax. This is a perfect for library authors
that need to use generators but don't want to burden their ES5 users with a
transpiled generator runtime.

## Install

```
npm install --save fsm-iterator
```

## Usage

The default export is the `fsmIterator` function. It takes an initial state as
the first argument and the state machine as an object literal as the second
argument. Each key-value pair of your definition is a state and a function to
handle that state. States can be strings or symbols.

The state function takes any value that was passed into the `next` method of the
iterator as the first argument and the finite state machine definition itself as
the second argument.  This allows you to act on values passed back into the
"generator" and delegate to other states. The finite state machine argument also
includes a `previousState` property if you need to use it.

To yield a value from your state function return an object literal with the
`value` property set to the yielded value. To specify the next state to
transition to, set the `next` property to the next state. You can end the
iterator by including the `done` property set to `true`. If you don't supply the
`next` property, then the iterator will stay in the same state. This is fine if
you want to loop on one thing, but if you have multiple states, then remember to
use the `next` property.

You may also include a `throw` function to handle the `throw` method of the
iterator. It takes the thrown error as the first argument and the finite state
machine definition as the second argument. If you don't supply a `throw`
function, then your iterator will stop, rethrowing the error.

```js
// ES2015 modules
import fsmIterator from 'fsm-iterator';

// ES5 and CJS
var fsmIterator = require('fsm-iterator').default;

const FOO = 'FOO';
const BAR = 'BAR';
const BAZ = 'BAZ';

const definition = {
  [FOO]: () => ({
    value: 'foo',
    next: BAR,
  }),

  [BAR](x) {
    if (x < 0) {
      return {
        value: x / 2,
        done: true,
      };
    }

    return {
      value: x * 2,
      next: BAZ,
    };
  },

  [BAZ]: (_, fsm) => ({
    value: `baz : ${fsm.previousState}`,
    next: FOO,
  }),

  throw: (e, fsm) => ({
    value: `${e.message} : ${fsm.previousState}`,
    next: FOO,
  }),
};

// Normal path
let iterator = fsmIterator(FOO, definition);

iterator.next();    // { value: 'foo', done: false }
iterator.next(21);  // { value: 42, done: false }
iterator.next();    // { value: 'baz : BAR', done: false }
iterator.next();    // { value: 'foo', done: false }
iterator.next(-42); // { value: -21, done: true }

// Throwing
const error = new Error('error');
iterator = fsmIterator(FOO, definition);

iterator.next();       // { value: 'foo', done: false }
iterator.next(21);     // { value: 42, done: false }
iterator.throw(error); // { value: 'error : BAR', done: false }
iterator.next();       // { value: 'foo', done: false }

// Returning
iterator = fsmIterator(FOO, definition);

iterator.next();            // { value: 'foo', done: false }
iterator.next(21);          // { value: 42, done: false }
iterator.return('the end'); // { value: 'the end', done: true }
```

#### Equivalent ES2015 Generator

Here is the comparable ES2015 generator for the previous example.

```js
const FOO = 'FOO';
const BAR = 'BAR';
const BAZ = 'BAZ';

function* myGenerator() {
  let currentState = FOO;
  let previousState = null;

  function setState(newState) {
    previousState = currentState;
    currentState = newState;
  }

  while (true) {
    try {
      const x = yield 'foo';

      setState(BAR);

      if (x < 0) {
        return x / 2;
      }

      yield x * 2;

      setState(BAZ);

      yield `baz : ${previousState}`;

      setState(FOO);
    } catch (e) {
      setState(FOO);

      yield `${e.message} : ${previousState}`;
    }
  }
}
```
