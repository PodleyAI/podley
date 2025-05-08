//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import React from "react";
import { Box, Text } from "retuink";
import TaskGraphUI from "./TaskGraphUI";
import { ITaskGraph } from "@ellmers/task-graph";

type AppProps = {
  graph: ITaskGraph;
};

const App: React.FC<AppProps> = ({ graph }) => {
  return (
    <Box flexDirection="column">
      <Text bold>Ellmers Task Graph Runner</Text>

      <TaskGraphUI graph={graph} />
    </Box>
  );
};

export default App;
