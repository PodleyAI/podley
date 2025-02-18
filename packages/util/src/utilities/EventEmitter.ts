//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/**
 * A type that represents a listener function for an event.
 * @template Events - A record of event names and their corresponding listener functions
 * @template EventType - The name of the event
 */
type EventListener<Events, EventType extends keyof Events> = Events[EventType];

/**
 * A type that represents a list of listener functions for an event.
 * @template Events - A record of event names and their corresponding listener functions
 * @template EventType - The name of the event
 */
type EventListeners<Events, EventType extends keyof Events> = Array<{
  listener: EventListener<Events, EventType>;
  once?: boolean;
}>;

/**
 * A type that represents the parameters of an event.
 * @template Events - A record of event names and their corresponding listener functions
 * @template EventType - The name of the event
 */
export type EventParameters<Events, EventType extends keyof Events> = {
  [Event in EventType]: EventListener<Events, EventType> extends (...args: infer P) => any
    ? P
    : never;
}[EventType];

/**
 * A class that implements an event emitter pattern.
 * @template EventListenerTypes - A record of event names and their corresponding listener functions
 */
export class EventEmitter<EventListenerTypes extends Record<string, (...args: any) => any>> {
  private listeners: {
    [Event in keyof EventListenerTypes]?: EventListeners<EventListenerTypes, Event>;
  } = {};

  private weakListeners: WeakMap<
    object,
    {
      event: keyof EventListenerTypes;
      listener: Function;
      once?: boolean;
    }
  > = new WeakMap();

  // Keep track of weak listener keys since WeakMap isn't iterable
  private weakListenerKeys: Set<object> = new Set();

  /**
   * Remove all listeners for a specific event or all events
   * @param event - Optional event name. If not provided, removes all listeners for all events
   * @returns this, so that calls can be chained
   */
  removeAllListeners<Event extends keyof EventListenerTypes>(event?: Event): this {
    if (event) {
      delete this.listeners[event];
      // Remove weak listeners for this event
      for (const key of this.weakListenerKeys) {
        const value = this.weakListeners.get(key);
        if (value && value.event === event) {
          this.weakListeners.delete(key);
          this.weakListenerKeys.delete(key);
        }
      }
    } else {
      this.listeners = {};
      this.weakListeners = new WeakMap();
      this.weakListenerKeys.clear();
    }
    return this;
  }

  /**
   * Adds a listener function for the event
   * @param event - The event name to listen for
   * @param listener - The listener function to add
   * @returns this, so that calls can be chained
   */
  on<Event extends keyof EventListenerTypes>(
    event: Event,
    listener: EventListener<EventListenerTypes, Event>
  ): this {
    // If the listener is an object method, store it in the WeakMap
    if (typeof listener === "object" && listener !== null) {
      this.weakListeners.set(listener as object, {
        event,
        listener: listener as Function,
        once: false,
      });
      this.weakListenerKeys.add(listener as object);
    } else {
      // Regular function listeners go in the normal array storage
      const listeners: EventListeners<EventListenerTypes, Event> =
        this.listeners[event] || (this.listeners[event] = []);
      listeners.push({ listener });
    }

    return this;
  }

  /**
   * Removes a listener function for the event
   * @param event - The event name to remove the listener from
   * @param listener - The listener function to remove
   * @returns this, so that calls can be chained
   */
  off<Event extends keyof EventListenerTypes>(
    event: Event,
    listener: EventListener<EventListenerTypes, Event>
  ): this {
    if (typeof listener === "object" && listener !== null) {
      this.weakListeners.delete(listener as object);
      this.weakListenerKeys.delete(listener as object);
    } else {
      const listeners = this.listeners[event];
      if (!listeners) return this;

      const index = listeners.findIndex((l) => l.listener === listener);
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    }
    return this;
  }

  /**
   * Adds a listener function for the event that will be called only once
   * @param event - The event name to listen for
   * @param listener - The listener function to add
   * @returns this, so that calls can be chained
   */
  once<Event extends keyof EventListenerTypes>(
    event: Event,
    listener: EventListener<EventListenerTypes, Event>
  ): this {
    if (typeof listener === "object" && listener !== null) {
      this.weakListeners.set(listener as object, {
        event,
        listener: listener as Function,
        once: true,
      });
      this.weakListenerKeys.add(listener as object);
    } else {
      const listeners: EventListeners<EventListenerTypes, Event> =
        this.listeners[event] || (this.listeners[event] = []);
      listeners.push({ listener, once: true });
    }
    return this;
  }

  /**
   * Returns a promise that resolves when the event is emitted
   * @param event - The event name to listen for
   * @returns a promise that resolves to the event parameters
   */
  emitted<Event extends keyof EventListenerTypes>(
    event: Event
  ): Promise<
    EventParameters<EventListenerTypes, Event> extends [infer Param]
      ? Param
      : EventParameters<EventListenerTypes, Event> extends []
        ? void
        : EventParameters<EventListenerTypes, Event>
  > {
    return new Promise((resolve, reject) => {
      this.once(event, resolve as EventListener<EventListenerTypes, Event>);
    });
  }

  /**
   * Emits an event with the specified name and arguments
   * @param event - The event name to emit
   * @param args - Arguments to pass to the event listeners
   */
  public emit<Event extends keyof EventListenerTypes>(
    this: EventEmitter<EventListenerTypes>,
    event: Event,
    ...args: EventParameters<EventListenerTypes, Event>
  ) {
    // Handle regular function listeners
    const listeners: EventListeners<EventListenerTypes, Event> | undefined = this.listeners[event];
    if (listeners) {
      listeners.forEach(({ listener, once }) => {
        listener(...args);
      });
      // Remove once listeners we just called
      this.listeners[event] = listeners.filter((l) => !l.once);
    }

    // Handle weak listeners
    for (const key of this.weakListenerKeys) {
      const value = this.weakListeners.get(key);
      if (value && value.event === event) {
        value.listener.apply(key, args);
        if (value.once) {
          this.weakListeners.delete(key);
          this.weakListenerKeys.delete(key);
        }
      }
    }
  }
}
