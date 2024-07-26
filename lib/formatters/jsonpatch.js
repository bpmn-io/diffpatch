import BaseFormatter from './base.js';

const OPERATIONS = {
  add: 'add',
  remove: 'remove',
  replace: 'replace',
  move: 'move',
};

export default class JSONPatchFormatter extends BaseFormatter {
  constructor() {
    super();
    this.includeMoveDestinations = true;
  }

  prepareContext(context) {
    super.prepareContext(context);
    context.result = [];
    context.path = [];
    context.pushCurrentOp = function(obj) {
      const { op, value } = obj;
      const val = {
        op,
        path: this.currentPath(),
      };
      if (typeof value !== 'undefined') {
        val.value = value;
      }
      this.result.push(val);
    };

    context.pushMoveOp = function(to) {
      const finalTo = `/${to}`;
      const from = this.currentPath();
      this.result.push({ op: OPERATIONS.move, from: from, path: finalTo });
    };

    context.currentPath = function() {
      return `/${this.path.join('/')}`;
    };
  }

  typeFormattterErrorFormatter(context, err) {
    context.out(`[ERROR] ${err}`);
  }

  rootBegin() {}
  rootEnd() {}

  nodeBegin({ path }, key, leftKey) {
    path.push(leftKey);
  }

  nodeEnd({ path }) {
    path.pop();
  }

  /* jshint camelcase: false */
  /* eslint-disable camelcase */

  format_unchanged() {}

  format_movedestination() {}

  format_node(context, delta, left) {
    this.formatDeltaChildren(context, delta, left);
  }

  format_added(context, delta) {
    context.pushCurrentOp({ op: OPERATIONS.add, value: delta[0] });
  }

  format_modified(context, delta) {
    context.pushCurrentOp({ op: OPERATIONS.replace, value: delta[1] });
  }

  format_deleted(context) {
    context.pushCurrentOp({ op: OPERATIONS.remove });
  }

  format_moved(context, delta) {
    const to = delta[1];
    context.pushMoveOp(to);
  }

  format_textdiff() {
    throw new Error('Not implemented');
  }

  format(delta, left) {
    let context = {};
    this.prepareContext(context);
    this.recurse(context, delta, left);
    return reorderOps(context.result);
  }
}

/* jshint camelcase: true */
/* eslint-enable camelcase */

const last = arr => arr[arr.length - 1];

const sortBy = (arr, pred) => {
  arr.sort(pred);
  return arr;
};

const compareByIndexDesc = (indexA, indexB) => {
  const lastA = parseInt(indexA, 10);
  const lastB = parseInt(indexB, 10);
  if (!(isNaN(lastA) || isNaN(lastB))) {
    return lastB - lastA;
  } else {
    return 0;
  }
};

const opsByDescendingOrder = removeOps => sortBy(removeOps, (a, b) => {
  const splitA = a.path.split('/');
  const splitB = b.path.split('/');
  if (splitA.length !== splitB.length) {
    return splitA.length - splitB.length;
  } else {
    return compareByIndexDesc(last(splitA), last(splitB));
  }
});

const partition = (arr, pred) => {
  const left = [];
  const right = [];

  arr.forEach(el => {
    const coll = pred(el) ? left : right;
    coll.push(el);
  });
  return [ left, right ];
};

const partitionRemovedOps = jsonFormattedDiff => {
  const isRemoveOp = ({ op }) => op === 'remove';
  return partition(
    jsonFormattedDiff,
    isRemoveOp
  );
};

const reorderOps = jsonFormattedDiff => {
  const removeOpsOtherOps = partitionRemovedOps(jsonFormattedDiff);
  const removeOps = removeOpsOtherOps[0];
  const otherOps = removeOpsOtherOps[1];
  const removeOpsReverse = opsByDescendingOrder(removeOps);
  return removeOpsReverse.concat(otherOps);
};
