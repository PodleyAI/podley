//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, expect, it, beforeEach, mock } from "bun:test";
import { EventEmitter, EventParameters } from "../utilities/EventEmitter";

// Define event types for testing
interface TestEvents extends Record<string, (...args: any) => any> {
  test: (value: string) => void;
  multipleArgs: (arg1: string, arg2: number, arg3: boolean) => void;
  noArgs: () => void;
}

describe("EventEmitter", () => {
  let emitter: EventEmitter<TestEvents>;

  beforeEach(() => {
    emitter = new EventEmitter<TestEvents>();
  });

  describe("on and emit", () => {
    it("should register and trigger an event listener", () => {
      const listener = mock((value: string) => {});

      emitter.on("test", listener);
      emitter.emit("test", "hello");

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith("hello");
    });

    it("should handle multiple listeners for the same event", () => {
      const listener1 = mock((value: string) => {});
      const listener2 = mock((value: string) => {});

      emitter.on("test", listener1);
      emitter.on("test", listener2);
      emitter.emit("test", "hello");

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener1).toHaveBeenCalledWith("hello");
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledWith("hello");
    });

    it("should handle events with multiple arguments", () => {
      const listener = mock((arg1: string, arg2: number, arg3: boolean) => {});

      emitter.on("multipleArgs", listener);
      emitter.emit("multipleArgs", "test", 42, true);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith("test", 42, true);
    });

    it("should handle events with no arguments", () => {
      const listener = mock(() => {});

      emitter.on("noArgs", listener);
      emitter.emit("noArgs");

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith();
    });
  });

  describe("off", () => {
    it("should remove a specific listener", () => {
      const listener1 = mock((value: string) => {});
      const listener2 = mock((value: string) => {});

      emitter.on("test", listener1);
      emitter.on("test", listener2);
      emitter.off("test", listener1);
      emitter.emit("test", "hello");

      expect(listener1).toHaveBeenCalledTimes(0);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it("should do nothing when removing a non-existent listener", () => {
      const listener1 = mock((value: string) => {});
      const listener2 = mock((value: string) => {});

      emitter.on("test", listener1);
      emitter.off("test", listener2); // listener2 was never registered
      emitter.emit("test", "hello");

      expect(listener1).toHaveBeenCalledTimes(1);
    });
  });

  describe("once", () => {
    it("should trigger a listener only once", () => {
      const listener = mock((value: string) => {});

      emitter.once("test", listener);
      emitter.emit("test", "first");
      emitter.emit("test", "second");

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith("first");
    });

    it("should handle multiple once listeners", () => {
      const listener1 = mock((value: string) => {});
      const listener2 = mock((value: string) => {});

      emitter.once("test", listener1);
      emitter.once("test", listener2);
      emitter.emit("test", "hello");

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe("removeAllListeners", () => {
    it("should remove all listeners for a specific event", () => {
      const testListener = mock((value: string) => {});
      const multipleArgsListener = mock((arg1: string, arg2: number, arg3: boolean) => {});

      emitter.on("test", testListener);
      emitter.on("multipleArgs", multipleArgsListener);

      emitter.removeAllListeners("test");

      emitter.emit("test", "hello");
      emitter.emit("multipleArgs", "test", 42, true);

      expect(testListener).toHaveBeenCalledTimes(0);
      expect(multipleArgsListener).toHaveBeenCalledTimes(1);
    });

    it("should remove all listeners for all events when no event is specified", () => {
      const testListener = mock((value: string) => {});
      const multipleArgsListener = mock((arg1: string, arg2: number, arg3: boolean) => {});

      emitter.on("test", testListener);
      emitter.on("multipleArgs", multipleArgsListener);

      emitter.removeAllListeners();

      emitter.emit("test", "hello");
      emitter.emit("multipleArgs", "test", 42, true);

      expect(testListener).toHaveBeenCalledTimes(0);
      expect(multipleArgsListener).toHaveBeenCalledTimes(0);
    });
  });

  describe("emitted", () => {
    it("should return a promise that resolves when the event is emitted with an array containing the argument", async () => {
      const promise = emitter.emitted("test");
      emitter.emit("test", "hello");

      const result = await promise;
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(["hello"]);
    });

    it("should handle events with multiple arguments and return all arguments as an array", async () => {
      const promise = emitter.emitted("multipleArgs");
      emitter.emit("multipleArgs", "test", 42, true);

      const result = await promise;
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(["test", 42, true]);
    });

    it("should handle events with no arguments and return an empty array", async () => {
      const promise = emitter.emitted("noArgs");
      emitter.emit("noArgs");

      const result = await promise;
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });
  });
});
