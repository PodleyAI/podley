/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

export class BaseError {
  public static type: string = "BaseError";
  public message: string;
  public name: string;
  public stack?: string;

  constructor(message: string = "") {
    this.message = message;
    const constructor = this.constructor as any;
    this.name = constructor.type ?? this.constructor.name;

    // Capture stack trace if available
    if (typeof Error !== "undefined" && Error.captureStackTrace) {
      const temp = { stack: "" };
      Error.captureStackTrace(temp, this.constructor);
      this.stack = temp.stack;
    } else {
      try {
        throw new Error(message);
      } catch (err) {
        if (err instanceof Error) {
          this.stack = err.stack;
        }
      }
    }
  }

  toString(): string {
    return `${this.name}: ${this.message}`;
  }
}
