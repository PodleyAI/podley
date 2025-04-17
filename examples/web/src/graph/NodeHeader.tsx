//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskStatus } from "@ellmers/task-graph";
import React from "react";
import { getStatusColorBg } from "./util";

// A standard header for all node types
export const NodeHeader: React.FC<{
  title: string;
  description: string;
  status: TaskStatus;
}> = ({ title, description, status }) => (
  <>
    <div className="flex items-center mb-2">
      <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColorBg(status)}`}></div>
      <div className="font-semibold truncate">{title}</div>
    </div>
    <div className="text-xs max-h-24 overflow-hidden line-clamp-2">
      {description !== title ? description : null}
    </div>
  </>
);
