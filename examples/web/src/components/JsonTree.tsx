/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { JsonArray } from "./JsonArray";
import { JsonObject } from "./JsonObject";
import "./JsonTreeStyles.css";
import { JsonValue } from "./JsonValue";

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
  expandLevel = 1,
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
