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
    const listeners: EventListeners<EventListenerTypes, Event> =
      this.listeners[event] || (this.listeners[event] = []);
    listeners.push({ listener });
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
    const listeners = this.listeners[event];
    if (!listeners) return this;
    const index = listeners.findIndex((l) => l.listener === listener);
    if (index >= 0) listeners.splice(index, 1);
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
    const listeners: EventListeners<EventListenerTypes, Event> =
      this.listeners[event] || (this.listeners[event] = []);
    listeners.push({ listener, once: true });
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
    const listeners: EventListeners<EventListenerTypes, Event> | undefined = this.listeners[event];
    if (listeners) {
      listeners.forEach(({ listener }) => listener(...args));
      // Remove once listeners we just called
      this.listeners[event] = listeners.filter((l) => !l.once);
    }
  }
}
