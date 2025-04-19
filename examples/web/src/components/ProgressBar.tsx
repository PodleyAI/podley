//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskStatus } from "@ellmers/task-graph";
import React from "react";
import { getStatusColorBg } from "../graph/util";

// A standard progress bar for all node types
export const ProgressBar: React.FC<{
  progress: number;
  status: TaskStatus;
  showText: boolean;
}> = ({ progress, status, showText }) => (
  <>
    <div className="w-full bg-[rgba(28,35,50,0.6)] rounded-full overflow-hidden h-2 my-2">
      <div
        className={`h-full rounded-full transition-[width] duration-300 ease-in-out ${
          status === TaskStatus.PROCESSING
            ? "bg-gradient-to-r from-[#2a8af6] via-[#a853ba] to-[#2a8af6] bg-[length:200%_100%] animate-progress"
            : getStatusColorBg(status)
        }`}
        style={{
          width: `${Math.round(progress)}%`,
        }}
      />
    </div>
    {showText && <div className="text-xs text-gray-500">Progress: {Math.round(progress)}%</div>}
  </>
);
