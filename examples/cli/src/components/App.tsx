//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import React from "react";
import { Box, Text } from "tuir";
import { TaskGraph } from "@ellmers/task-graph";
import TaskGraphUI from "./TaskGraphUI";

type AppProps = {
  graph: TaskGraph;
};

const App: React.FC<AppProps> = ({ graph }) => {
  return (
    <Box flexDirection="column" borderStyle="double" paddingLeft={1} paddingRight={1}>
      <Box marginBottom={1}>
        <Text bold>Ellmers Task Graph Runner</Text>
      </Box>
      <TaskGraphUI graph={graph} />
    </Box>
  );
};

export default App;
