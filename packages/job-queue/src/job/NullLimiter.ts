//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ILimiter } from "./ILimiter";

export class NullLimiter implements ILimiter {
  async canProceed(): Promise<boolean> {
    return true;
  }

  async recordJobStart(): Promise<void> {
    // Do nothing
  }

  async recordJobCompletion(): Promise<void> {
    // Do nothing
  }

  async getNextAvailableTime(): Promise<Date> {
    return new Date();
  }

  async setNextAvailableTime(date: Date): Promise<void> {
    // Do nothing
  }

  async clear(): Promise<void> {
    // Do nothing
  }
}
