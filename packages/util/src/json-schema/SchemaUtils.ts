/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Semantic Compatibility Utilities for Task Graph Dataflows
 *
 * In this project, task graphs have connections between tasks called dataflows.
 * These dataflows have different kinds of compatibility checks:
 *
 * **Static Compatibility:**
 * Static rules help decide if an edge should be connected at all. A connection
 * is statically compatible if:
 * - The source and target are the same exact type
 * - The source connects to the equivalent of "any" (target accepts anything)
 * - The source type is acceptable to the target (e.g., a string to something
 *   that accepts oneOf[string[], string])
 *
 * **Runtime Compatibility:**
 * Assuming the connection is allowed at design time (passes static check),
 * runtime rules determine if they are compatible during execution.
 *
 * Currently, there is one runtime compatibility check:
 * - If both input and output schemas have 'x-semantic' annotations attached
 *   to type string, the semantic annotation has the format /\w+(:\w+)?/ where
 *   the first part is the "name" and if alone matches any other with the same
 *   "name". If there is a second part, then that narrows the type.
 *
 * Example: In the AI package, 'x-semantic':'model' and 'x-semantic': 'model:EmbeddingTask'
 * are used. An input with property `model` and 'x-semantic':'model' connects to a
 * target with property `model` and 'x-semantic':'model:EmbeddingTask' -- this
 * compatibility is called "runtime". It first passes the static check as compatible
 * and then notices a difference in semantic runtime.
 *
 * Only connections that pass the runtime check will pass data at runtime.
 */

import type { JsonSchema } from "./JsonSchema";

/**
 * Checks if two semantic annotation strings are compatible.
 * Format: /\w+(:\w+)?/ where first part is the "name" and optional second part narrows the type.
 * - Same name without narrowing: static compatible
 * - Source name matches target narrowed name: runtime compatible
 * - Different names or incompatible narrowing: incompatible
 */
function areSemanticAnnotationsCompatible(
  sourceSemantic: string,
  targetSemantic: string
): "static" | "runtime" | "incompatible" {
  const semanticPattern = /^\w+(:\w+)?$/;
  if (!semanticPattern.test(sourceSemantic) || !semanticPattern.test(targetSemantic)) {
    return "incompatible";
  }

  const [sourceName, sourceNarrow] = sourceSemantic.split(":");
  const [targetName, targetNarrow] = targetSemantic.split(":");

  // Different base names are incompatible
  if (sourceName !== targetName) {
    return "incompatible";
  }

  // Same name, no narrowing on either: static compatible
  if (!sourceNarrow && !targetNarrow) {
    return "static";
  }

  // Source has narrowing, target doesn't: static compatible (source is more specific)
  if (sourceNarrow && !targetNarrow) {
    return "static";
  }

  // Target has narrowing, source doesn't: runtime compatible (target is more specific)
  if (!sourceNarrow && targetNarrow) {
    return "runtime";
  }

  // Both have narrowing: must match exactly for static, otherwise incompatible
  if (sourceNarrow === targetNarrow) {
    return "static";
  }

  return "incompatible";
}

/**
 * Checks if a source type is statically compatible with a target type.
 * Handles cases like string to oneOf[string[], string] or string to any.
 */
function isTypeStaticallyCompatible(sourceType: unknown, targetType: unknown): boolean {
  // Target accepts any type (no type constraint)
  if (!targetType) {
    return true;
  }

  // Source has no type constraint
  if (!sourceType) {
    return false;
  }

  // Convert to arrays for comparison
  const sourceTypes = Array.isArray(sourceType) ? sourceType : [sourceType];
  const targetTypes = Array.isArray(targetType) ? targetType : [targetType];

  // Check if any source type matches any target type
  return sourceTypes.some((st) => targetTypes.includes(st as any));
}

/**
 * Checks if a source schema is compatible with a target schema in a oneOf/anyOf union.
 */
function isCompatibleWithUnion(
  sourceSchema: JsonSchema,
  unionSchemas: JsonSchema[]
): "static" | "runtime" | "incompatible" {
  let hasStatic = false;
  let hasRuntime = false;

  for (const unionSchema of unionSchemas) {
    const compatibility = areSemanticallyCompatible(sourceSchema, unionSchema);
    if (compatibility === "static") {
      hasStatic = true;
    } else if (compatibility === "runtime") {
      hasRuntime = true;
    }
  }

  if (hasStatic) return "static";
  if (hasRuntime) return "runtime";
  return "incompatible";
}

/**
 * Checks if two JSON schemas are semantically compatible.
 * Returns:
 * - "static": Compatible at design time, no runtime check needed
 * - "runtime": Compatible at design time, but needs runtime semantic check
 * - "incompatible": Not compatible
 */
export function areSemanticallyCompatible(
  sourceSchema: JsonSchema,
  targetSchema: JsonSchema
): "static" | "runtime" | "incompatible" {
  // Handle undefined schemas (non-existent ports)
  if (sourceSchema === undefined || targetSchema === undefined) {
    return "incompatible";
  }

  // Handle boolean schemas
  if (typeof targetSchema === "boolean") {
    if (targetSchema === false) return "incompatible";
    if (targetSchema === true) return "static"; // target accepts anything
    return "incompatible";
  }

  if (typeof sourceSchema === "boolean") {
    if (sourceSchema === false) return "incompatible";
    // sourceSchema === true means source can be anything, which is compatible with any target, but may not be at runtime
    if (sourceSchema === true) return "runtime";
  }

  // Handle allOf in source (intersection types - all must be compatible)
  if (sourceSchema.allOf && Array.isArray(sourceSchema.allOf)) {
    let hasStatic = false;
    let hasRuntime = false;
    let hasIncompatible = false;

    for (const allOfSchema of sourceSchema.allOf) {
      const compatibility = areSemanticallyCompatible(allOfSchema as JsonSchema, targetSchema);
      if (compatibility === "incompatible") {
        hasIncompatible = true;
      } else if (compatibility === "static") {
        hasStatic = true;
      } else if (compatibility === "runtime") {
        hasRuntime = true;
      }
    }

    // If any allOf schema is incompatible, the whole thing is incompatible
    if (hasIncompatible) return "incompatible";
    if (hasRuntime) return "runtime";
    if (hasStatic) return "static";
    return "incompatible";
  }

  // Check type compatibility first
  const sourceType = sourceSchema.type;
  const targetType = targetSchema.type;

  // Handle oneOf/anyOf in source first
  if (sourceSchema.oneOf && Array.isArray(sourceSchema.oneOf)) {
    let hasStatic = false;
    let hasRuntime = false;

    for (const sourceOption of sourceSchema.oneOf) {
      const compatibility = areSemanticallyCompatible(sourceOption as JsonSchema, targetSchema);
      if (compatibility === "static") {
        hasStatic = true;
      } else if (compatibility === "runtime") {
        hasRuntime = true;
      }
    }

    // If any option requires runtime check, the whole thing requires runtime check
    if (hasRuntime) return "runtime";
    if (hasStatic) return "static";
    return "incompatible";
  }

  if (sourceSchema.anyOf && Array.isArray(sourceSchema.anyOf)) {
    let hasStatic = false;
    let hasRuntime = false;

    for (const sourceOption of sourceSchema.anyOf) {
      const compatibility = areSemanticallyCompatible(sourceOption as JsonSchema, targetSchema);
      if (compatibility === "static") {
        hasStatic = true;
      } else if (compatibility === "runtime") {
        hasRuntime = true;
      }
    }

    // If any option requires runtime check, the whole thing requires runtime check
    if (hasRuntime) return "runtime";
    if (hasStatic) return "static";
    return "incompatible";
  }

  // Handle oneOf/anyOf in target (e.g., oneOf[string[], string])
  if (targetSchema.oneOf && Array.isArray(targetSchema.oneOf)) {
    return isCompatibleWithUnion(sourceSchema, targetSchema.oneOf);
  }

  if (targetSchema.anyOf && Array.isArray(targetSchema.anyOf)) {
    return isCompatibleWithUnion(sourceSchema, targetSchema.anyOf);
  }

  // Handle allOf in target (intersection types - source must be compatible with all)
  if (targetSchema.allOf && Array.isArray(targetSchema.allOf)) {
    let hasStatic = false;
    let hasRuntime = false;

    for (const allOfSchema of targetSchema.allOf) {
      const compatibility = areSemanticallyCompatible(sourceSchema, allOfSchema as JsonSchema);
      if (compatibility === "incompatible") {
        return "incompatible";
      } else if (compatibility === "static") {
        hasStatic = true;
      } else if (compatibility === "runtime") {
        hasRuntime = true;
      }
    }

    if (hasRuntime) return "runtime";
    if (hasStatic) return "static";
    return "incompatible";
  }

  // Handle object types - check if properties are compatible
  if (sourceType === "object" && targetType === "object") {
    const sourceProperties = sourceSchema.properties;
    const targetProperties = targetSchema.properties;

    // If target has no properties constraint, it accepts any object
    if (!targetProperties) {
      return "static";
    }

    // If source has no properties but target does, check if target allows additional properties
    if (!sourceProperties) {
      // If target doesn't allow additional properties, incompatible
      if (targetSchema.additionalProperties === false) {
        return "incompatible";
      }
      // Otherwise, source (any object) is compatible with target that allows additional properties
      return "static";
    }

    // Check if all required target properties are present and compatible in source
    const targetRequired = targetSchema.required || [];
    let hasStatic = true;
    let hasRuntime = false;

    for (const propName of targetRequired) {
      const targetProp = (targetProperties as Record<string, JsonSchema>)?.[propName];
      const sourceProp = (sourceProperties as Record<string, JsonSchema>)?.[propName];

      // If target requires a property that source doesn't have, incompatible
      if (!sourceProp) {
        return "incompatible";
      }

      // Check compatibility of the property
      if (targetProp) {
        const propCompatibility = areSemanticallyCompatible(sourceProp, targetProp);
        if (propCompatibility === "incompatible") {
          return "incompatible";
        } else if (propCompatibility === "runtime") {
          hasRuntime = true;
          hasStatic = false;
        }
      }
    }

    // Check if target allows additional properties
    if (targetSchema.additionalProperties === false) {
      // Target doesn't allow additional properties, so source can't have extra properties
      const sourcePropNames = Object.keys(sourceProperties as Record<string, JsonSchema>);
      const targetPropNames = Object.keys(targetProperties as Record<string, JsonSchema>);
      const extraProps = sourcePropNames.filter((name) => !targetPropNames.includes(name));
      if (extraProps.length > 0) {
        return "incompatible";
      }
    }

    if (hasRuntime) return "runtime";
    return "static";
  }

  // Handle array types - check compatibility of array items
  if (sourceType === "array" && targetType === "array") {
    const sourceItems = sourceSchema.items;
    const targetItems = targetSchema.items;

    // If both have items schemas, recursively check compatibility
    if (
      sourceItems &&
      typeof sourceItems === "object" &&
      !Array.isArray(sourceItems) &&
      targetItems &&
      typeof targetItems === "object" &&
      !Array.isArray(targetItems)
    ) {
      return areSemanticallyCompatible(sourceItems as JsonSchema, targetItems as JsonSchema);
    }

    // If target accepts any array items, it's statically compatible
    if (!targetItems) {
      return "static";
    }

    // If source has no items but target does, incompatible
    if (!sourceItems) {
      return "incompatible";
    }

    // If target items is an array (tuple), check if source is compatible with any item
    if (Array.isArray(targetItems)) {
      return isCompatibleWithUnion(sourceItems as JsonSchema, targetItems as JsonSchema[]);
    }

    // Fallback to static if we can't determine
    return "static";
  }

  // If source has no type constraint, it can be anything (compatible with any target)
  // But we need to check if target has constraints that might require runtime checks
  if (!sourceType) {
    // Source accepts any type, but target might have semantic annotations requiring runtime check
    const targetSemantic = targetSchema["x-semantic"];
    if (targetSemantic && targetSchema.type === "string") {
      return "runtime";
    }
    return "static";
  }

  // If target has no type constraint, it accepts anything
  if (!targetType) {
    return "static";
  }

  // Check if types are statically compatible
  if (!isTypeStaticallyCompatible(sourceType, targetType)) {
    return "incompatible";
  }

  // If types are compatible, check semantic annotations on string types
  const sourceSemantic = sourceSchema["x-semantic"];
  const targetSemantic = targetSchema["x-semantic"];

  if (sourceSemantic && targetSemantic) {
    // Check semantic annotations on string types
    if (sourceSchema.type === "string" && targetSchema.type === "string") {
      return areSemanticAnnotationsCompatible(sourceSemantic, targetSemantic);
    }
    // Note: Semantic annotations on other types (like array items) are handled
    // recursively when we check array items compatibility above
  }

  // Types are compatible, no semantic annotations or not string types
  return "static";
}

/**
 * Checks if two object schemas are semantically compatible.
 * This is a helper function for checking object-level schema compatibility.
 */
export function areObjectSchemasSemanticallyCompatible(
  sourceSchema: JsonSchema,
  targetSchema: JsonSchema
): "static" | "runtime" | "incompatible" {
  return areSemanticallyCompatible(sourceSchema, targetSchema);
}
