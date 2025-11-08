// A simple in-memory state manager for the canvas.

// operationStack holds the history of all completed drawings.
// This is our Single Source of Truth.
let operationStack = [];

// redoStack holds operations that have been "undone".
let redoStack = [];

/**
 * Adds a completed drawing operation to the main stack.
 * A new operation clears the redo stack.
 * @param {object} operation - The drawing operation (e.g., a path).
 */
function pushOperation(operation) {
  operationStack.push(operation);
  redoStack = []; // Any new action invalidates the old redo history
}

/**
 * Removes the last operation from the stack and returns it.
 * @returns {object | undefined} The undone operation.
 */
function popOperation() {
  return operationStack.pop();
}

/**
 * Adds an "undone" operation to the redo stack.
 * @param {object} operation - The operation to add.
 */
function pushRedo(operation) {
  redoStack.push(operation);
}

/**
 * Removes the last operation from the redo stack and returns it.
 * @returns {object | undefined} The redone operation.
 */
function popRedo() {
  return redoStack.pop();
}

/**
 * Returns the entire current operation stack.
 * @returns {Array<object>} The stack.
 */
function getStack() {
  return operationStack;
}

/**
 * Clears all drawing history.
 */
function clearAll() {
  operationStack = [];
  redoStack = [];
}

module.exports = {
  pushOperation,
  popOperation,
  pushRedo,
  popRedo,
  getStack,
  clearAll
};