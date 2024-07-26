import DiffPatcher from './diffpatcher';

export {
  default as DiffPatcher,
} from './diffpatcher';

export function create(options) {
  return new DiffPatcher(options);
}

export {
  default as dateReviver,
} from './date-reviver';

export function diff() {
  return staticCall('diff', arguments);
}

export function patch() {
  return staticCall('patch', arguments);
}

export function unpatch() {
  return staticCall('unpatch', arguments);
}

export function reverse() {
  return staticCall('reverse', arguments);
}

export function clone() {
  return staticCall('clone', arguments);
}

function staticCall(method, args) {
  const instance = new DiffPatcher();

  return instance[method](...args);
}
