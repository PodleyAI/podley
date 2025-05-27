//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Handle, Position } from "@xyflow/react";
import { TaskStatus } from "@podley/task-graph";
import React from "react";

// A standard node container with handles
export const NodeContainer: React.FC<{
  children: React.ReactNode;
  status: TaskStatus;
  isConnectable?: boolean;
}> = ({ children, isConnectable, status }) => (
  <div className={`wrapper gradient ${status.toLowerCase()}`}>
    <div className="inner">
      <div className="body">
        <div className={`shadow-md w-full`}>
          <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
          {children}
          <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
        </div>
      </div>
    </div>
  </div>
);
