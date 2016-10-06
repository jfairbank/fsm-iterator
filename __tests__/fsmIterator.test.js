import fsmIterator from '../src';

const FOO = 'FOO';
const BAR = 'BAR';
const BAZ = 'BAZ';

function createIterator(includeThrow = true) {
  function throwError(e, fsm) {
    return {
      value: `${e.message} : ${fsm.previousState}`,
      next: FOO,
    };
  }

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
  };

  if (includeThrow) {
    definition.throw = throwError;
  }

  return fsmIterator(FOO, definition);
}

test('normal flow', () => {
  const iterator = createIterator();

  expect(iterator.next()).toEqual({
    value: 'foo',
    done: false,
  });

  expect(iterator.next(21)).toEqual({
    value: 42,
    done: false,
  });

  expect(iterator.next()).toEqual({
    value: `baz : ${BAR}`,
    done: false,
  });

  expect(iterator.next()).toEqual({
    value: 'foo',
    done: false,
  });

  expect(iterator.next(-42)).toEqual({
    value: -21,
    done: true,
  });

  expect(iterator.next()).toEqual({
    value: undefined,
    done: true,
  });
});

test('Symbol.iterator', () => {
  const iterator = createIterator();

  expect(iterator[Symbol.iterator]()).toBe(iterator);
});

test('throwing error', () => {
  const iterator = createIterator();
  const error = new Error('hello');

  expect(iterator.next()).toEqual({
    value: 'foo',
    done: false,
  });

  expect(iterator.next(21)).toEqual({
    value: 42,
    done: false,
  });

  expect(iterator.throw(error)).toEqual({
    value: `hello : ${BAR}`,
    done: false,
  });

  expect(iterator.next()).toEqual({
    value: 'foo',
    done: false,
  });
});

test('throwing without throw handler', () => {
  const iterator = createIterator(false);
  const error = new Error('hello');

  expect(iterator.next()).toEqual({
    value: 'foo',
    done: false,
  });

  expect(iterator.next(21)).toEqual({
    value: 42,
    done: false,
  });

  expect(() => iterator.throw(error)).toThrow();
});

test('returning', () => {
  const iterator = createIterator();

  expect(iterator.next()).toEqual({
    value: 'foo',
    done: false,
  });

  expect(iterator.next(21)).toEqual({
    value: 42,
    done: false,
  });

  expect(iterator.return('the end')).toEqual({
    value: 'the end',
    done: true,
  });
});

test('stays in the same state if next is not supplied', () => {
  const iterator = fsmIterator(FOO, {
    [FOO]: () => ({ value: 'foo' }),
    [BAR]: () => ({ value: 'bar' }),
  });

  expect(iterator.next()).toEqual({
    value: 'foo',
    done: false,
  });

  expect(iterator.next()).toEqual({
    value: 'foo',
    done: false,
  });
});

test('throws if next and done: true are both supplied', () => {
  const iterator = fsmIterator(FOO, {
    [FOO]: () => ({
      value: 'foo',
      next: BAR,
      done: true,
    }),

    [BAR]: () => ({
      value: 'bar',
      next: FOO,
    }),
  });

  expect(() => iterator.next()).toThrow();
});
