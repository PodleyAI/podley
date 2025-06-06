// original source: https://github.com/SegFaultx64/typescript-graph
// previous fork: https://github.com/sroussey/typescript-graph
// license: MIT

import { BaseError } from "../utilities/BaseError";

/**
 * # NodeAlreadyExistsError
 *
 * This error is thrown when trying to create a node with the same identity as an existing node.
 *
 * @category Errors
 */
export class NodeAlreadyExistsError<T> extends BaseError {
  public static type: string = "NodeAlreadyExistsError";
  public newNode: T;
  public oldNode: T;
  public identity: unknown;

  constructor(newNode: T, oldNode: T, identity: unknown) {
    super(
      `${JSON.stringify(newNode)} shares an identity (${String(identity)}) with ${JSON.stringify(
        oldNode
      )}`
    );
    this.newNode = newNode;
    this.oldNode = oldNode;
    this.identity = identity;
    this.name = "NodeAlreadyExistsError";

    // This bs is due to a limitation of Typescript: https://github.com/facebook/jest/issues/8279
    Object.setPrototypeOf(this, NodeAlreadyExistsError.prototype);
  }
}

/**
 * # NodeDoesntExistError
 * This error is thrown when trying to access a node in a graph by it's identity when that node doesn't exist
 *
 * @category Errors
 */
export class NodeDoesntExistError extends BaseError {
  public static type: string = "NodeDoesntExistError";
  public identity: unknown;

  constructor(identity: unknown) {
    super(`A node with identity ${String(identity)} doesn't exist in the graph`);
    this.identity = identity;
    this.name = "NodeDoesntExistError";

    // This bs is due to a limitation of Typescript: https://github.com/facebook/jest/issues/8279
    Object.setPrototypeOf(this, NodeDoesntExistError.prototype);
  }
}

/**
 * # CycleError
 *
 * This error is thrown when attempting to create or update a Directed Acyclic Graph that contains a cycle.
 *
 * @category Errors
 */
export class CycleError extends BaseError {
  public static type: string = "CycleError";
  constructor(message: string) {
    super(message);
    this.name = "CycleError";

    // This bs is due to a limitation of Typescript: https://github.com/facebook/jest/issues/8279
    Object.setPrototypeOf(this, CycleError.prototype);
  }
}
