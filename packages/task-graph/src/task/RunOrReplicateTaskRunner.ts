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
//   Input extends TaskInput = TaskInput,
//   Output extends TaskOutput = TaskOutput,
//   Config extends TaskConfig = TaskConfig,
//   ExecuteInput extends TaskInput = Input,
//   ExecuteOutput extends TaskOutput = Output,
// > extends TaskWithSubgraphRunner<Input, Output, Config> {
//   declare task: RunOrReplicateTask<Input, Output, Config, ExecuteInput, ExecuteOutput>;
// }
