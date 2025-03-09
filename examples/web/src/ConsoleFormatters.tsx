//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  Workflow,
  TaskInputDefinition,
  TaskOutputDefinition,
  TaskStatus,
  Task,
  TaskGraph,
} from "@ellmers/task-graph";

type Config = Record<string, any>;

type JsonMLTagName = string;

interface JsonMLAttributes {
  [key: string]: any;
}

type JsonMLNode = JsonMLText | JsonMLElementDef;

type JsonMLText = string;

type JsonMLElementDef = [JsonMLTagName, JsonMLAttributes?, ...JsonMLNode[]];

abstract class ConsoleFormatter {
  abstract header(value: any, config?: Config): JsonMLElementDef | null;
  abstract hasBody(value: any, config?: Config): boolean;
  abstract body(value: any, config?: Config): JsonMLElementDef;
}

export function isDarkMode() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export class WorkflowConsoleFormatter extends ConsoleFormatter {
  header(workflow: Workflow, config?: Config) {
    if (workflow instanceof Workflow) {
      const header = new JsonMLElement("div");
      header.sectionHeader("Workflow");
      header.styledText(
        `(${workflow.graph.getTasks().length} tasks)`,
        "color: green; margin-left: 10px;"
      );
      if (workflow.error) {
        header.styledText(workflow.error, "color: red; margin-left: 10px;");
      }

      return header.toJsonML();
    }
    return null;
  }

  hasBody(value: any, config?: Config) {
    return true;
  }

  body(obj: any, config?: Config) {
    const body = new JsonMLElement("div");

    // Move API methods to a separate section in the WorkflowAPIConsoleFormatter

    const nodes = body.createStyledList();
    const tasks = obj._graph.getTasks();
    if (tasks.length) {
      nodes.createTextChild("Tasks:");
      for (const node of tasks) {
        const nodeTag = nodes.createListItem("", "list-style-type: none;");
        for (const df of obj._graph.getSourceDataflows(node.config.id)) {
          const edgeTag = nodeTag.createChild("li").setStyle("padding-left: 20px;");
          if (df.sourceTaskPortId === df.targetTaskPortId) continue;
          const num =
            tasks.findIndex((t) => t.config.id === df.sourceTaskId) -
            tasks.findIndex((t) => t.config.id === node.config.id);

          edgeTag.highlightText("rename");
          edgeTag.functionCall((el) => {
            el.greyText('"');
            el.outputText(`${df.sourceTaskPortId}`);
            el.greyText('", "');
            el.inputText(`${df.targetTaskPortId}`);
            el.greyText('"');
            if (num !== -1) el.greyText(`, ${num}`);
          });
        }
        nodeTag.createObjectTag(node, { graph: obj._graph, workspace: obj });
      }
    }
    return body.toJsonML();
  }
}

// New formatter for Workflow API methods
export class WorkflowAPIConsoleFormatter extends ConsoleFormatter {
  header(obj: any, config?: Config) {
    if (obj === Workflow.prototype || obj === Workflow) {
      const header = new JsonMLElement("div");
      header.sectionHeader("Workflow API");
      return header.toJsonML();
    }
    return null;
  }

  hasBody(value: any, config?: Config) {
    return true;
  }

  body() {
    const body = new JsonMLElement("div");
    const apiSection = body.createChild("div");
    const apiList = apiSection.createStyledList();
    const apiTag = apiList.createListItem("", "list-style-type: none;");
    apiTag.createHighlightedListItem(".reset()");
    apiTag.createHighlightedListItem(".rename(outputName, inputName)");
    apiTag.createHighlightedListItem(".run()");
    apiTag.createHighlightedListItem(".abort()");
    apiTag.createHighlightedListItem(".toJSON()");
    apiTag.createHighlightedListItem(".toDependencyJSON()");

    for (const [key, value] of Object.entries(Workflow.prototype)) {
      if (typeof value === "function" && key !== "constructor") {
        const item = apiTag.createListItem("");
        item.createChild("span").createObjectTag(value);
      }
    }

    return body.toJsonML();
  }
}

export class CreateWorkflowConsoleFormatter extends ConsoleFormatter {
  header(obj: any, config?: Config) {
    if (obj.workflowCreate) {
      const header = new JsonMLElement("div");
      const name = obj.constructor.runtype ?? obj.constructor.type ?? obj.type.replace(/Task$/, "");
      const inputs = obj.inputs.map((i: TaskInputDefinition) => i.id + ": …");
      const outputs = obj.outputs.map((i: TaskOutputDefinition) => i.id + ": …");

      header.methodSignature(name);
      header.functionCall((el) => {
        el.objectBraces((obj) => {
          obj.inputText(`${inputs.join(", ")}`);
        });
      });
      header.greyText("): ");
      header.objectBraces((el) => {
        el.outputText(`${outputs.join(", ")}`);
      });

      return header.toJsonML();
    }
    return null;
  }

  hasBody(value: any, config?: Config) {
    return false;
  }

  body(obj: any, config?: Config) {
    return null;
  }
}

export class TaskConsoleFormatter extends ConsoleFormatter {
  header(task: Task, config?: Config) {
    if (!task) return null;

    if (
      task instanceof Task &&
      task.inputs &&
      task.outputs &&
      task.runInputData &&
      task.runOutputData
    ) {
      const header = new JsonMLElement("div");
      let name = task.type ?? task.constructor.name;
      if (config?.workspace) name = name.replace(/Task$/, "");
      const inputs = task.inputs
        .filter((i) => task.runInputData[i.id] !== undefined)
        .map((i: TaskInputDefinition) => {
          const name = i.id;
          let value = task.runInputData[i.id];
          return { name, value };
        });

      const outputs = task.outputs
        .filter((i) => task.runOutputData[i.id] !== undefined && task.runOutputData[i.id] !== "")
        .filter(
          (i) => !(Array.isArray(task.runOutputData[i.id]) && task.runOutputData[i.id].length === 0)
        )
        .map((i: TaskInputDefinition) => {
          return { name: i.id, value: task.runOutputData[i.id] };
        });

      header.highlightText(name);
      header.functionCall((el) => {
        el.objectBraces((obj) => {
          obj.parameterList(inputs);
        });
      });

      if (task.status === TaskStatus.COMPLETED) {
        header.greyText(": ");
        header.objectBraces((el) => {
          el.parameterList(outputs, true);
        });
      }
      return header.toJsonML();
    }
    return null;
  }

  hasBody(task: any, config?: Config) {
    return task instanceof Task;
  }

  body(task: Task, config?: Config) {
    if (!task) return null;
    if (!(task instanceof Task)) return null;

    const body = new JsonMLElement("div").setStyle("padding-left: 10px;");

    const inputs = body.createStyledList("Inputs:");
    const inboundEdges = (config?.graph as TaskGraph)?.getSourceDataflows(task.config.id);

    for (const input of task.inputs) {
      const value = task.runInputData[input.id];
      const li = inputs.createListItem("", "padding-left: 20px;");
      li.inputText(`${input.id}: `);
      const inboundEdge = inboundEdges?.filter((e) => e.targetTaskPortId === input.id);
      if (inboundEdge) {
        let sources: string[] = [];
        let sourceValues: any[] = [];
        inboundEdge.forEach((e) => {
          const sourceTask = config?.graph?.getTask(e.sourceTaskId);
          sources.push(`${sourceTask?.type}->Output{${e.sourceTaskPortId}}`);
          const sourceValue = sourceTask?.runOutputData[e.sourceTaskPortId];
          if (sourceValue) {
            sourceValues.push(sourceValue);
          }
        });
        if (sources.length > 1) {
          li.createTextChild(`[${sources.join(", ")}]`);
          if (sourceValues.length > 0) {
            li.createValueObject(sourceValues);
            li.createTextChild(" ");
          }
          li.createTextChild(`from [${sources.join(", ")}]`);
        } else if (sources.length === 1) {
          if (sourceValues.length > 0) {
            li.createValueObject(sourceValues[0]);
            li.createTextChild(" ");
          }
          li.createTextChild("from " + sources[0]);
        } else {
          li.createValueObject(value);
        }
      } else {
        li.createValueObject(value);
      }
    }

    const outputs = body.createStyledList("Outputs:");
    for (const out of task.outputs) {
      const value = task.runOutputData[out.id];
      const li = outputs.createListItem("", "padding-left: 20px;");
      li.outputText(`${out.id}: `);
      li.createValueObject(value);
    }

    return body.toJsonML();
  }
}

export class ReactElementConsoleFormatter extends ConsoleFormatter {
  header(obj: any, config?: Config) {
    if (obj?.$$typeof?.toString() === "Symbol(react.transitional.element)" && !config?.parent) {
      const header = new JsonMLElement("div");
      const isMemo = obj.type?.$$typeof?.toString() === "Symbol(react.memo)";
      const name = !isMemo
        ? obj.displayName || obj.type?.displayName || obj.type?.name
        : obj.type?.type?.displayName || obj.type?.type?.name;
      header.greyText(`<`);
      header.sectionHeader(`${name}`);
      header.greyText(`/>`);
      if (obj.key) {
        header.createTextChild(" ");
        header.inputText(`key={${obj.key}}`);
      }
      if (isMemo) {
        header.createTextChild(" ");
        header.pill(`Memo`);
      }
      // header.createObjectTag(obj, { parent: obj });
      return header.toJsonML();
    }
    return null;
  }

  hasBody(value: any, config?: Config) {
    return true;
  }

  body(obj: any, config?: Config) {
    const body = new JsonMLElement("div");
    const props = body.createStyledList("Props:");
    props.propertyBlock(obj.props);
    return body.toJsonML();
  }
}

class JsonMLElement {
  _attributes: Record<string, any>;
  _jsonML: JsonMLElementDef;

  // Color constants
  static getColors() {
    const dark = isDarkMode();
    return {
      grey: dark ? "#aaa" : "#333",
      inputColor: dark ? "#ada" : "#363",
      outputColor: dark ? "#caa" : "#633",
      yellow: dark ? "#f3ce49" : "#a68307",
      undefined: "#888",
    };
  }

  constructor(tagName: JsonMLTagName) {
    this._attributes = {};
    this._jsonML = [tagName, this._attributes];
  }

  // Add a helper method for creating colored text in one call
  coloredText(text: string, color: string): JsonMLElement {
    this.createChild("span").setStyle(`color:${color};`).createTextChild(text);
    return this;
  }

  // Helper for creating styled text with any style
  styledText(text: string, style: string): JsonMLElement {
    this.createChild("span").setStyle(style).createTextChild(text);
    return this;
  }

  // Helper specifically for input-colored text
  inputText(text: string): JsonMLElement {
    const colors = JsonMLElement.getColors();
    return this.coloredText(text, colors.inputColor);
  }

  // Helper specifically for output-colored text
  outputText(text: string): JsonMLElement {
    const colors = JsonMLElement.getColors();
    return this.coloredText(text, colors.outputColor);
  }

  // Helper for grey text which is commonly used
  greyText(text: string): JsonMLElement {
    const colors = JsonMLElement.getColors();
    return this.coloredText(text, colors.grey);
  }

  // Helper for yellow/highlight text
  highlightText(text: string): JsonMLElement {
    const colors = JsonMLElement.getColors();
    return this.coloredText(text, colors.yellow);
  }

  // Helper for creating a section header
  sectionHeader(text: string): JsonMLElement {
    return this.styledText(text, "font-weight: bold;");
  }

  pill(text: string): JsonMLElement {
    return this.styledText(
      text,
      "color: #009; background-color: #ccf; padding: 2px 4px; border-radius: 4px; font-size: 0.7em;"
    );
  }

  // Helper for creating a method signature
  methodSignature(name: string, params: string = ""): JsonMLElement {
    const colors = JsonMLElement.getColors();
    this.styledText("." + name, `font-weight: bold;color:${colors.yellow}`);
    if (params) this.greyText(`(${params})`);
    return this;
  }

  // Helper for creating a parameter list with input/output coloring
  parameterList(
    params: Array<{ name: string; value: any }>,
    isOutput: boolean = false
  ): JsonMLElement {
    params.forEach((param, i) => {
      if (i > 0) this.greyText(`, `);
      if (isOutput) {
        this.outputText(param.name);
      } else {
        this.inputText(param.name);
      }
      this.greyText(`: `);
      this.createValueObject(param.value);
    });
    return this;
  }

  // Helper for creating a parameter list with coloring
  propertyBlock(params: Record<string, any>): JsonMLElement {
    for (const [key, value] of Object.entries(params)) {
      const item = this.createListItem("");
      item.inputText(key);
      item.greyText(`: `);
      item.createValueObject(value);
    }
    return this;
  }

  // Helper for creating list items with padding
  createListItem(text: string, style?: string): JsonMLElement {
    const li = this.createChild("li").setStyle(`padding-left: 10px;${style ? " " + style : ""}`);
    if (text) li.createTextChild(text);
    return li;
  }

  // Helper for creating highlighted list items (commonly used in API sections)
  createHighlightedListItem(text: string): JsonMLElement {
    const colors = JsonMLElement.getColors();
    this.createChild("li")
      .setStyle(`color:${colors.yellow}; padding-left: 10px;`)
      .createTextChild(text);
    return this;
  }

  // Helper for creating a styled list
  createStyledList(title?: string): JsonMLElement {
    const list = this.createChild("ol").setStyle("list-style-type: none; padding-left: 10px;");
    if (title) list.createTextChild(title);
    return list;
  }

  // Helper for creating an object-like structure with braces
  objectBraces(content: (element: JsonMLElement) => void): JsonMLElement {
    this.greyText("{ ");
    content(this);
    this.greyText(" }");
    return this;
  }

  // Helper for creating a function call-like structure with parentheses
  functionCall(content: (element: JsonMLElement) => void): JsonMLElement {
    this.greyText("(");
    content(this);
    this.greyText(")");
    return this;
  }

  createChild(tagName: JsonMLTagName) {
    const c = new JsonMLElement(tagName);
    this._jsonML.push(c.toJsonML());
    return c;
  }

  createObjectTag(object: any, config?: Config) {
    const tag = this.createChild("object");
    tag.addAttribute("object", object);
    if (config) {
      tag.addAttribute("config", config);
    }
    return tag;
  }

  createValueObject(value: any, config?: Config) {
    if (Array.isArray(value)) return this.createArrayChild(value, config);
    if (typeof value === "undefined") {
      const colors = JsonMLElement.getColors();
      return this.createChild("span")
        .setStyle(`color:${colors.undefined};`)
        .createTextChild("undefined");
    }

    return this.createObjectTag(value, config);
  }

  setStyle(style: string) {
    this._attributes["style"] = style;
    return this;
  }

  addAttribute(key: string, value: any) {
    this._attributes[key] = value;
    return this;
  }

  createTextChild(text: string): JsonMLElement {
    this._jsonML.push(text + "");
    return this;
  }

  createArrayChild(array: any[], config?: Config) {
    const j = new JsonMLElement("span");
    j.createTextChild("[");
    for (let i = 0; i < array.length; ++i) {
      if (i != 0) j.createTextChild(", ");
      j.createValueObject(array[i], config);
    }
    j.createTextChild("]");
    this._jsonML.push(j.toJsonML());
    return j;
  }

  toJsonML() {
    return this._jsonML;
  }
}

export function installDevToolsFormatters() {
  window["devtoolsFormatters"] = window["devtoolsFormatters"] || [];
  window["devtoolsFormatters"].push(
    new WorkflowAPIConsoleFormatter(),
    new CreateWorkflowConsoleFormatter(),
    new WorkflowConsoleFormatter(),
    new TaskConsoleFormatter(),
    new ReactElementConsoleFormatter()
  );
}
