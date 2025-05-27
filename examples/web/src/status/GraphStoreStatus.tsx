//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskGraphRepository } from "@podley/task-graph";
import { useCallback } from "react";

export function GraphStoreStatus({ repository }: { repository: TaskGraphRepository }) {
  const clear = useCallback(() => {
    repository.clear();
  }, [repository]);

  return (
    <div>
      <span>{repository.type}</span>
      <button className="float-right" onClick={clear}>
        Reset
      </button>
    </div>
  );
}
