import fsmIterator from '../src';

const FOO = 'FOO';
const BAR = 'BAR';

test('can intercept `return` keeping passed in return value', () => {
  const array = [1, 2, 3];

  const iterator = fsmIterator(FOO, {
    [FOO]: () => ({
      value: 'foo',
      next: FOO,
    }),

    [BAR]() {
      if (array.length === 0) {
        return { done: true };
      }

      return {
        value: array.shift(),
        next: BAR,
      };
    },

    return(value) {
      return {
        value: value * 2,
        next: BAR,
      };
    },
  });

  iterator.next();

  expect(iterator.return(21)).toEqual({ value: 42, done: false });
  expect(iterator.next()).toEqual({ value: 1, done: false });
  expect(iterator.next()).toEqual({ value: 2, done: false });
  expect(iterator.next()).toEqual({ value: 3, done: false });
  expect(iterator.next()).toEqual({ value: 21, done: true });
  expect(iterator.next()).toEqual({ value: undefined, done: true });
});

test('can intercept `return` returning new value', () => {
  const iterator = fsmIterator(FOO, {
    [FOO]: () => ({
      value: 'foo',
      next: FOO,
    }),

    return(value) {
      return {
        value: value * 2,
        done: true,
      };
    },
  });

  iterator.next();

  expect(iterator.return(21)).toEqual({ value: 42, done: true });
});

test('can intercept `return` returning new value later on', () => {
  const array = [1, 2, 3];

  const iterator = fsmIterator(FOO, {
    [FOO]: () => ({
      value: 'foo',
      next: FOO,
    }),

    [BAR]() {
      if (array.length === 0) {
        return {
          value: 'my return value',
          done: true,
        };
      }

      return {
        value: array.shift(),
        next: BAR,
      };
    },

    return(value) {
      return {
        value: value * 2,
        next: BAR,
      };
    },
  });

  iterator.next();

  expect(iterator.return(21)).toEqual({ value: 42, done: false });
  expect(iterator.next()).toEqual({ value: 1, done: false });
  expect(iterator.next()).toEqual({ value: 2, done: false });
  expect(iterator.next()).toEqual({ value: 3, done: false });
  expect(iterator.next()).toEqual({ value: 'my return value', done: true });
  expect(iterator.next()).toEqual({ value: undefined, done: true });
});

test('can return multiple values', () => {
  const iterator = fsmIterator(FOO, {
    [FOO]: () => ({
      value: 'foo',
      next: FOO,
    }),

    return(value) {
      return {
        value: value * 2,
        done: true,
      };
    },
  });

  iterator.next();

  expect(iterator.return(21)).toEqual({ value: 42, done: true });
  expect(iterator.return('return value')).toEqual({ value: 'return value', done: true });
  expect(iterator.next()).toEqual({ value: undefined, done: true });
});
