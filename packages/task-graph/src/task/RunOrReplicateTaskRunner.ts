// //    *******************************************************************************
// //    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
// //    *                                                                             *
// //    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
// //    *   Licensed under the Apache License, Version 2.0 (the "License");           *
// //    *******************************************************************************

// import { TaskConfig, TaskInput, TaskOutput } from "./TaskTypes";
// import { RunOrReplicateTask } from "./RunOrReplicateTask";
// import { TaskWithSubgraphRunner } from "./TaskWithSubgraphRunner";

// export class RunOrReplicateTaskRunner<
//   RunInput extends TaskInput = TaskInput,
//   RunOutput extends TaskOutput = TaskOutput,
//   Config extends TaskConfig = TaskConfig,
//   ExecuteInput extends TaskInput = RunInput,
//   ExecuteOutput extends TaskOutput = RunOutput,
// > extends TaskWithSubgraphRunner<RunInput, RunOutput, Config> {
//   declare task: RunOrReplicateTask<RunInput, RunOutput, Config, ExecuteInput, ExecuteOutput>;
// }
