//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import ReactDOM from "react-dom/client";
import { App } from "./App";
import { Task, TaskGraph, Workflow } from "@ellmers/task-graph";
import "./main.css";
import {
  TaskConsoleFormatter,
  CreateWorkflowConsoleFormatter,
  WorkflowConsoleFormatter,
  WorkflowAPIConsoleFormatter,
  isDarkMode,
} from "./ConsoleFormatters";
import {
  DownloadModelTask,
  TextRewriterTask,
  TextEmbeddingTask,
  TextTranslationTask,
} from "@ellmers/ai";
import { DebugLogTask, DelayTask, FetchTask, JsonTask, LambdaTask } from "@ellmers/tasks";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
);

window["devtoolsFormatters"] = [
  new WorkflowAPIConsoleFormatter(),
  new CreateWorkflowConsoleFormatter(),
  new WorkflowConsoleFormatter(),
  new TaskConsoleFormatter(),
];
[
  Workflow,
  DownloadModelTask,
  TextRewriterTask,
  TextEmbeddingTask,
  TextTranslationTask,
  TextRewriterTask,
  DebugLogTask,
  Task,
  TaskGraph,
  JsonTask,
  DelayTask,
  FetchTask,
  LambdaTask,
].forEach((item) => {
  window[item.name] = item;
});

const dark = isDarkMode();
const grey = dark ? "#aaa" : "#333";
const yellow = dark ? "#f3ce49" : "#a68307";
const orange = dark ? "#da885e" : "#953402";

console.log("%cWelcome to Ellmers!", "color: green; font-size: 16px;");
console.log(
  "%cOpen DevTools settings, and under Console, turn on 'enable custom formatters' for best experience. Then reload the page.",
  "color: red;"
);
console.log("console.log(Workflow.prototype):", Workflow.prototype);
console.log(
  "To get started, type 'workflow.reset()' in the console. Then you can build a task graph using the workflow API, and it will be reflected in the web page. For example, here is how the page started: "
);
console.log(
  `  %cworkflow = new Workflow();
  workflow.%creset%c();
  workflow.%cDownloadModel%c({ %cmodel%c: [%c'onnx:Xenova/LaMini-Flan-T5-783M:q8']%c });
  workflow.%cTextRewriter%c({ %ctext%c: %c'The quick brown fox jumps over the lazy dog.'%c, %cprompt%c: [%c'Rewrite the following text in reverse:'%c, %c'Rewrite this to sound like a pirate:'%c] });
  workflow.%crename%c(%c'*'%c, %c'console'%c);
  workflow.%cDebugLog%c({ %clevel%c: %c'info'%c });
  
  console.log(JSON.stringify(workflow.toDependencyJSON(),null,2));
  `,
  `color: ${grey}; font-weight: normal;`,
  `color: ${yellow}; font-weight: normal;`,
  `color: ${grey}; font-weight: normal;`,
  `color: ${yellow}; font-weight: bold;`,
  `color: ${grey}; font-weight: normal;`,
  `color: ${yellow}; font-weight: normal;`,
  `color: ${grey}; font-weight: normal;`,
  `color: ${orange}; font-weight: normal;`,
  `color: ${grey}; font-weight: normal;`,
  `color: ${yellow}; font-weight: bold;`,
  `color: ${grey}; font-weight: normal;`,
  `color: ${yellow}; font-weight: normal;`,
  `color: ${grey}; font-weight: normal;`,
  `color: ${orange}; font-weight: normal;`,
  `color: ${grey}; font-weight: normal;`,
  `color: ${yellow}; font-weight: normal;`,
  `color: ${grey}; font-weight: normal;`,
  `color: ${orange}; font-weight: normal;`,
  `color: ${grey}; font-weight: normal;`,
  `color: ${orange}; font-weight: normal;`,
  `color: ${grey}; font-weight: normal;`,

  // rename
  `color: ${yellow}; font-weight: normal;`,
  "color: #ddd; font-weight: normal;",
  `color: ${orange}; font-weight: normal;`,
  `color: ${grey}; font-weight: normal;`,
  `color: ${orange}; font-weight: normal;`,
  `color: ${grey}; font-weight: normal;`,

  // DebugLog
  `color: ${yellow}; font-weight: bold;`,
  `color: ${grey}; font-weight: normal;`,
  `color: ${yellow}; font-weight: normal;`,
  `color: ${grey}; font-weight: normal;`,
  `color: ${orange}; font-weight: normal;`,
  `color: ${grey}; font-weight: normal;`
);
setTimeout(() => {
  console.log("console.log(workflow):", window["workflow"]);
}, 100);
