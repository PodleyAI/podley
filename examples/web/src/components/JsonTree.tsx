//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import React, { useState } from "react";
import { JsonValue } from "./JsonValue";
import { JsonObject } from "./JsonObject";
import { JsonArray } from "./JsonArray";
import "./JsonTreeStyles.css";

type JsonTreeProps = {
  data: unknown;
  expandLevel?: number;
  label?: string;
  isRoot?: boolean;
};

/**
 * Root component for rendering JSON data in a tree structure
 */
export const JsonTree: React.FC<JsonTreeProps> = ({
  data,
  expandLevel = 3,
  label,
  isRoot = true,
}) => {
  // Choose the appropriate component based on data type
  const renderValue = () => {
    if (data === null || data === undefined) {
      return <JsonValue value={data} />;
    }

    if (Array.isArray(data)) {
      return <JsonArray data={data} expandLevel={expandLevel} />;
    }

    if (typeof data === "object") {
      return <JsonObject data={data as Record<string, unknown>} expandLevel={expandLevel} />;
    }

    return <JsonValue value={data} />;
  };

  return (
    <div className={`json-tree ${isRoot ? "json-tree-root" : ""}`}>
      {label && <span className="json-tree-label">{label}:</span>}
      {renderValue()}
    </div>
  );
};
