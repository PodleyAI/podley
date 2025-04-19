//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import React from "react";

type JsonValueProps = {
  value: unknown;
};

/**
 * Component for displaying primitive JSON values (string, number, boolean, null, undefined)
 */
export const JsonValue: React.FC<JsonValueProps> = ({ value }) => {
  // Format value based on its type
  const getFormattedValue = () => {
    if (value === null) {
      return <span className="json-null">null</span>;
    }

    if (value === undefined) {
      return <span className="json-undefined">undefined</span>;
    }

    if (typeof value === "boolean") {
      return <span className="json-boolean">{value.toString()}</span>;
    }

    if (typeof value === "number") {
      return <span className="json-number">{value}</span>;
    }

    if (typeof value === "string") {
      return (
        <span className="json-string">
          "{value.length > 100 ? `${value.substring(0, 100)}...` : value}"
        </span>
      );
    }

    // Fallback for any other types
    return <span>{String(value)}</span>;
  };

  return <span className="json-value">{getFormattedValue()}</span>;
};
