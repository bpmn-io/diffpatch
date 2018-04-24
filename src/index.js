import DiffPatcher from './diffpatcher';
export DiffPatcher from './diffpatcher';

export function create(options) {
  return new DiffPatcher(options);
}

export dateReviver from './date-reviver';

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

export {
  AnnotatedFormatter,
  BaseFormatter,
  ConsoleFormatter,
  HtmlFormatter,
  JsonPatchFormatter,
} from './formatters';