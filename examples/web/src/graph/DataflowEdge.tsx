//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Dataflow, TaskStatus } from "@ellmers/task-graph";
import {
  BaseEdge,
  Edge,
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  ViewportPortal,
} from "@xyflow/react";
import React, { useEffect, useState, useContext } from "react";
import { getStatusColorBg } from "./util";
import { DialogContext } from "./RunGraphFlow";
import { DataDialog } from "../components/DataDialog";

export type DataflowEdgeData = {
  dataflow: Dataflow;
};

// Edge style options for each status
const EDGE_STYLE_MAP = {
  [TaskStatus.PROCESSING]: {
    stroke: "url(#edge-gradient)",
    strokeWidth: 2,
    strokeDasharray: "3 3",
    transition: "stroke 0.3s",
  },
  [TaskStatus.COMPLETED]: {
    stroke: "#2ecc71",
    strokeWidth: 2,
    transition: "stroke 0.3s",
  },
  [TaskStatus.FAILED]: {
    stroke: "#e74c3c",
    strokeWidth: 2,
    transition: "stroke 0.3s",
  },
  [TaskStatus.ABORTING]: {
    stroke: "#e74c3c",
    strokeWidth: 2,
    transition: "stroke 0.3s",
  },
  [TaskStatus.SKIPPED]: {
    stroke: "#bbb",
    strokeWidth: 1.5,
    transition: "stroke 0.3s",
  },
  [TaskStatus.PENDING]: {
    stroke: "#bbb",
    strokeWidth: 1.5,
    transition: "stroke 0.3s",
  },
};

export const DataflowEdge: React.FC<EdgeProps<Edge<DataflowEdgeData, string>>> = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
  markerEnd,
}) => {
  const [status, setStatus] = useState<TaskStatus>(data?.dataflow?.status || TaskStatus.PENDING);
  const [animatedDashOffset, setAnimatedDashOffset] = useState(0);
  type EdgePathParams = [string, { strokePath: string }];
  const [edgePathParams, setEdgePathParams] = useState<EdgePathParams | null>(null);
  const { showDialog } = useContext(DialogContext);
  const [showDataDialog, setShowDataDialog] = useState(false);

  useEffect(() => {
    // Update status from data
    if (data?.dataflow?.status) {
      setStatus(data.dataflow.status);
    }
  }, [data]);

  useEffect(() => {
    // Calculate path once
    const [edgePath] = getBezierPath({
      sourceX: sourceX - 10,
      sourceY,
      sourcePosition,
      targetX: targetX + 10,
      targetY,
      targetPosition,
    });

    setEdgePathParams([edgePath, { strokePath: edgePath }]);
  }, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]);

  useEffect(() => {
    // Animate the flow when status is 'flowing'
    if (status === TaskStatus.PROCESSING) {
      const interval = setInterval(() => {
        setAnimatedDashOffset((prev) => (prev - 1) % 20);
      }, 50);

      return () => clearInterval(interval);
    }
  }, [status]);

  if (!edgePathParams) {
    return null;
  }

  const [edgePath] = edgePathParams;

  // Get the base style for current status
  const baseStyle = EDGE_STYLE_MAP[status] || EDGE_STYLE_MAP[TaskStatus.PENDING];

  // Add animated dash offset for flowing status
  const statusStyle =
    status === TaskStatus.PROCESSING
      ? { ...baseStyle, strokeDashoffset: animatedDashOffset }
      : baseStyle;

  const edgeStyles = { ...style, ...statusStyle };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyles} />

      {/* Data particle effect for flowing data */}
      {status === TaskStatus.PROCESSING && (
        <>
          <circle
            cx={0}
            cy={0}
            r={3}
            fill="#3498db"
            className="data-particle"
            style={{
              offsetPath: `path('${edgePath}')`,
            }}
          />
          <circle
            cx={0}
            cy={0}
            r={3}
            fill="#e74c3c"
            className="data-particle"
            style={{
              offsetPath: `path('${edgePath}')`,
              animationDelay: "0.7s",
            }}
          />
        </>
      )}

      {/* Data label for completed edges with data */}
      {data?.dataflow?.value && (
        <>
          <foreignObject
            width={80}
            height={20}
            x={(sourceX + targetX) / 2 - 40}
            y={(sourceY + targetY) / 2 - 10}
            style={{
              fontSize: "10px",
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <span
              onClick={() => setShowDataDialog(true)}
              className={`ml-2 text-xs px-1.5 rounded-full mr-2 border border-blue-800 ${getStatusColorBg(
                status
              )}`}
              style={{ pointerEvents: "all", cursor: "pointer" }}
            >
              {Object.keys(data.dataflow.value).length}
            </span>
          </foreignObject>
          <EdgeLabelRenderer>
            {showDataDialog && (
              <DataDialog
                isOpen={showDataDialog}
                onClose={() => setShowDataDialog(false)}
                data={data.dataflow.value}
                title={`Dataflow - ${data.dataflow.id}`}
              />
            )}
          </EdgeLabelRenderer>
        </>
      )}
    </>
  );
};
