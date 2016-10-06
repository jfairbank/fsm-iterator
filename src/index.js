const hasOwnProperty = Object.prototype.hasOwnProperty;

export default function fsmIterator(initialState, definition) {
  const fsm = { ...definition };

  let currentState = initialState;
  let done = false;

  function processResult(result, handlerName) {
    if (done) {
      return {
        value: undefined,
        done,
      };
    }

    if (result.next && result.done) {
      const errorMessage = 'You supplied a next state while specifying to end '
                         + 'the iterator. This is more than likely an accident. '
                         + `Please check your "${handlerName}" handler.`;

      throw new Error(errorMessage);
    }

    fsm.previousState = currentState;
    currentState = result.next || currentState;
    done = !!result.done;

    return {
      value: result.value,
      done,
    };
  }

  const iterator = {
    next(value) {
      if (!hasOwnProperty.call(fsm, currentState)) {
        return {
          value: undefined,
          done: true,
        };
      }

      const result = fsm[currentState](value, fsm);
      return processResult(result, currentState);
    },

    throw(e) {
      if (!hasOwnProperty.call(fsm, 'throw')) {
        throw e;
      }

      const result = fsm.throw(e, fsm);
      return processResult(result, 'throw');
    },

    return(value) {
      return {
        value,
        done: true,
      };
    },
  };

  if (typeof Symbol === 'function' && Symbol.iterator) {
    iterator[Symbol.iterator] = () => iterator;
  }

  return iterator;
}
