//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Container, globalContainer } from "./Container";

/**
 * Service token type for type-safe dependency injection
 */
export interface ServiceToken<T> {
  readonly _type: T;
  readonly id: string;
}

/**
 * Create a typed service token
 * @param id Unique identifier for the service
 * @returns A typed service token
 */
export function createServiceToken<T>(id: string): ServiceToken<T> {
  return { id, _type: null as any };
}

/**
 * Service registry for managing and accessing services
 */
export class ServiceRegistry {
  private container: Container;

  /**
   * Create a new service registry
   * @param container Optional container to use (defaults to global container)
   */
  constructor(container: Container = globalContainer) {
    this.container = container;
  }

  /**
   * Register a service factory
   * @param token Service token
   * @param factory Factory function to create the service
   * @param singleton Whether the service should be a singleton
   */
  register<T>(token: ServiceToken<T>, factory: () => T, singleton = true): void {
    this.container.register(token.id, factory, singleton);
  }

  /**
   * Register a service instance
   * @param token Service token
   * @param instance Service instance to register
   */
  registerInstance<T>(token: ServiceToken<T>, instance: T): void {
    this.container.registerInstance(token.id, instance);
  }

  /**
   * Get a service by its token
   * @param token Service token
   * @returns The service instance
   */
  get<T>(token: ServiceToken<T>): T {
    return this.container.get<T>(token.id);
  }

  /**
   * Check if a service is registered
   * @param token Service token
   * @returns True if the service is registered
   */
  has<T>(token: ServiceToken<T>): boolean {
    return this.container.has(token.id);
  }
}

/**
 * Global service registry instance
 */
export const globalServiceRegistry = new ServiceRegistry(globalContainer);
