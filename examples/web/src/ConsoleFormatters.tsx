//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Dataflow, Task, TaskGraph, TaskStatus, Workflow } from "@podley/task-graph";
import { DirectedAcyclicGraph } from "@podley/util";

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

class WorkflowConsoleFormatter extends ConsoleFormatter {
  header(workflow: Workflow | TaskGraph, config?: Config) {
    // @ts-ignore
    if (workflow instanceof Workflow || workflow instanceof TaskGraph) {
      const graph: TaskGraph = workflow instanceof TaskGraph ? workflow : workflow.graph;
      const error = workflow instanceof Workflow ? workflow.error : "";
      const title = workflow instanceof Workflow ? "Workflow" : "TaskGraph";
      const header = new JsonMLElement("div");
      header.sectionHeader(title);
      header.styledText(`(${graph.getTasks().length} tasks)`, "color: green; margin-left: 10px;");
      if (error) {
        header.styledText(error, "color: red; margin-left: 10px;");
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
    const graph: TaskGraph = obj instanceof TaskGraph ? obj : obj.graph;
    const nodes = body.createStyledList();
    const tasks = graph.getTasks();
    if (tasks.length) {
      nodes.createTextChild("Tasks:");
      for (const node of tasks) {
        const nodeTag = nodes.createListItem("", "list-style-type: none;");
        if (obj instanceof Workflow) {
          for (const df of graph.getSourceDataflows(node.config.id)) {
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
        }
        nodeTag.createObjectTag(node, { graph, workflow: obj });
      }
    }
    if (obj instanceof TaskGraph) {
      const dfList = nodes.createTextChild("Dataflows:");
      for (const df of obj.getDataflows()) {
        const dfTag = dfList.createListItem("", "list-style-type: none;");
        dfTag.createObjectTag(df);
      }
    }
    // @ts-ignore
    const dag = obj._dag ?? obj.graph._dag;

    if (dag && dag.getNodes().length > 0) body.createObjectTag(dag);

    return body.toJsonML();
  }
}

// New formatter for Workflow API methods
class WorkflowAPIConsoleFormatter extends ConsoleFormatter {
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

class CreateWorkflowConsoleFormatter extends ConsoleFormatter {
  header(obj: any, config?: Config) {
    if (obj.workflowCreate) {
      const header = new JsonMLElement("div");
      const name = obj.constructor.runtype ?? obj.constructor.type ?? obj.type.replace(/Task$/, "");
      const inputSchema = obj.inputSchema();
      const outputSchema = obj.outputSchema();
      const inputs = Object.keys(typeof inputSchema === 'boolean' ? {} : (inputSchema.properties || {})).map((key) => `${key}: …`);
      const outputs = Object.keys(typeof outputSchema === 'boolean' ? {} : (outputSchema.properties || {})).map((key) => `${key}: …`);

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

class TaskConsoleFormatter extends ConsoleFormatter {
  header(task: Task, config?: Config) {
    if (!task) return null;

    if (
      task instanceof Task &&
      task.inputSchema &&
      task.outputSchema &&
      task.runInputData &&
      task.runOutputData
    ) {
      const header = new JsonMLElement("div");
      let name = task.type ?? task.constructor.name;
      if (config?.workflow) name = name.replace(/Task$/, "");
      const inputSchema = task.inputSchema();
      const outputSchema = task.outputSchema();
      const inputs = Object.keys(typeof inputSchema === 'boolean' ? {} : (inputSchema.properties || {}))
        .filter((key) => task.runInputData[key] !== undefined)
        .map((key) => {
          let value = task.runInputData[key];
          return { name: key, value };
        });

      const outputs = Object.keys(typeof outputSchema === 'boolean' ? {} : (outputSchema.properties || {}))
        .filter((key) => task.runOutputData[key] !== undefined && task.runOutputData[key] !== "")
        .filter(
          (key) => !(Array.isArray(task.runOutputData[key]) && task.runOutputData[key].length === 0)
        )
        .map((key) => {
          return { name: key, value: task.runOutputData[key] };
        });

      header.highlightText(name);
      header.functionCall((el) => {
        el.objectBraces((obj) => {
          obj.parameterList(inputs);
        });
        el.greyText(", ");
        el.objectBraces((obj) => {
          obj.parameterList([{ name: "id", value: task.config.id }]);
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
    const allInboundDataflows = (config?.graph as TaskGraph)?.getSourceDataflows(task.config.id);

    const inputSchema = task.inputSchema();
    for (const key of Object.keys(typeof inputSchema === 'boolean' ? {} : (inputSchema.properties || {}))) {
      const value = task.runInputData[key];
      const li = inputs.createListItem("", "padding-left: 20px;");
      li.inputText(`${key}: `);
      const inputInboundDataflows = allInboundDataflows?.filter((e) => e.targetTaskPortId === key);
      if (inputInboundDataflows) {
        let sources: string[] = [];
        let sourceValues: any[] = [];
        inputInboundDataflows.forEach((df) => {
          const sourceTask = config?.graph?.getTask(df.sourceTaskId);
          sources.push(`${sourceTask?.type}->Output{${df.sourceTaskPortId}}`);
          if (df.status === TaskStatus.COMPLETED) {
            sourceValues.push(df.value);
          }
        });
        if (sources.length > 1) {
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
    const outputSchema = task.outputSchema();
    for (const key of Object.keys(typeof outputSchema === 'boolean' ? {} : (outputSchema.properties || {}))) {
      const value = task.runOutputData[key];
      const li = outputs.createListItem("", "padding-left: 20px;");
      li.outputText(`${key}: `);
      li.createValueObject(value);
    }

    const taskConfig = body.createStyledList("Config:");
    for (const [key, value] of Object.entries(task.config)) {
      if (value === undefined) continue;
      if (key == "provenance") continue;
      const li = taskConfig.createListItem("", "padding-left: 20px;");
      li.inputText(`${key}: `);
      li.createValueObject(value);
    }

    body.createStatusListItem(task.status);

    // @ts-ignore
    const dag = task.subGraph?._dag;

    if (dag && dag.getNodes().length > 0) body.createObjectTag(dag);

    return body.toJsonML();
  }
}

class DAGConsoleFormatter extends ConsoleFormatter {
  header(obj: any, config?: Config) {
    if (obj instanceof DirectedAcyclicGraph) {
      const header = new JsonMLElement("div");
      header.createTextChild("DAG");
      return header.toJsonML();
    }
    return null;
  }

  hasBody(value: any, config?: Config) {
    return true;
  }

  body(obj: any, config?: Config) {
    const body = new JsonMLElement("div");
    const nodes = body.createStyledList();
    if (obj.getNodes().length > 0) {
      // @ts-ignore
      const { dataURL, height } = generateGraphImage(obj);
      if (dataURL) {
        const imageTag = body.createChild("div");
        imageTag.addAttribute(
          "style",
          `background-image: url(${dataURL}); background-size: cover; background-position: center; width: 800px; height: ${height}px;`
        );
      }
    }
    return body.toJsonML();
  }
}

class DataflowConsoleFormatter extends ConsoleFormatter {
  header(obj: any, config?: Config) {
    if (obj instanceof Dataflow) {
      const header = new JsonMLElement("div");
      header.highlightText("Dataflow ");
      header.inputText(`${obj.sourceTaskId}.${obj.sourceTaskPortId}`);
      header.createTextChild(" -> ");
      header.outputText(`${obj.targetTaskId}.${obj.targetTaskPortId}`);
      if (obj.status === TaskStatus.COMPLETED) {
        header.greyText(" = ");
        header.createValueObject(obj.value);
      }
      return header.toJsonML();
    }
    return null;
  }

  hasBody(value: any, config?: Config) {
    return true;
  }

  body(obj: any, config?: Config) {
    return null;
  }
}

class ReactElementConsoleFormatter extends ConsoleFormatter {
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

  createStatusListItem(text: string): JsonMLElement {
    this.createStyledList("Status: ");
    let color = "grey";
    switch (text) {
      case TaskStatus.COMPLETED:
        color = "green";
        break;
      case TaskStatus.ABORTING:
      case TaskStatus.FAILED:
        color = "red";
        break;
      default:
        color = "grey";
    }
    return this.createListItem(text, `padding-left: 30px;color: ${color};`);
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

function computeLayout(
  graph: DirectedAcyclicGraph<any, any, any, any>,
  canvasWidth: number
): { positions: { [id: string]: { x: number; y: number } }; requiredHeight: number } {
  const positions: { [id: string]: { x: number; y: number } } = {};
  const layers: Map<number, string[]> = new Map();
  const depths: { [id: string]: number } = {};

  // Compute depth (longest path from any root)
  for (const node of graph.topologicallySortedNodes()) {
    const incomingEdges = graph.inEdges(node.config.id).map(([from]) => from);
    const depth =
      incomingEdges.length > 0 ? Math.max(...incomingEdges.map((from) => depths[from])) + 1 : 0;
    depths[node.config.id] = depth;

    if (!layers.has(depth)) layers.set(depth, []);
    layers.get(depth)!.push(node.config.id);
  }

  // Compute spacing based on available canvas size
  const totalLayers = layers.size;
  const layerSpacing = totalLayers > 1 ? Math.max(canvasWidth / totalLayers, 150) : 150;

  // Determine the required height dynamically
  const maxNodesInLayer = Math.max(...Array.from(layers.values()).map((layer) => layer.length));
  const nodeSpacing = 100;
  const requiredHeight = maxNodesInLayer * nodeSpacing + 100; // Extra padding

  layers.forEach((layerNodes, layerIndex) => {
    const yStart = (requiredHeight - layerNodes.length * nodeSpacing) / 2;
    layerNodes.forEach((nodeId, index) => {
      positions[nodeId] = {
        x: layerIndex * layerSpacing + layerSpacing / 2,
        y: yStart + index * nodeSpacing,
      };
    });
  });

  return { positions, requiredHeight };
}

function generateGraphImage(
  graph: DirectedAcyclicGraph<any, any, any, any>,
  width = 800
): { dataURL: string; height: number } {
  const ratio = window.devicePixelRatio || 1;
  const { positions, requiredHeight } = computeLayout(graph, width);
  const canvas = document.createElement("canvas");
  canvas.width = width * ratio;
  canvas.height = requiredHeight * ratio;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    console.error("Canvas context is not available.");
    return { dataURL: "", height: requiredHeight };
  }
  ctx.scale(ratio, ratio);

  // Draw edges first
  ctx.clearRect(0, 0, width, requiredHeight);
  ctx.strokeStyle = "#aaa";
  ctx.lineWidth = 2;
  for (const [source, target] of graph.getEdges()) {
    const fromNode = positions[source];
    const toNode = positions[target];
    if (fromNode && toNode) {
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.stroke();
    }
  }

  // Draw nodes over the edges
  ctx.fillStyle = "#3498db";
  for (const node of graph.getNodes()) {
    const pos = positions[node.config.id];
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.font = `12px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(node.type, pos.x, pos.y - 15);
    ctx.fillStyle = "#3498db";
  }

  const dataURL = canvas.toDataURL("image/png");

  return { dataURL, height: requiredHeight };
}

export function installDevToolsFormatters() {
  window["devtoolsFormatters"] = window["devtoolsFormatters"] || [];
  window["devtoolsFormatters"].push(
    new WorkflowAPIConsoleFormatter(),
    new CreateWorkflowConsoleFormatter(),
    new WorkflowConsoleFormatter(),
    new TaskConsoleFormatter(),
    new ReactElementConsoleFormatter(),
    new DataflowConsoleFormatter(),
    new DAGConsoleFormatter()
  );
}
