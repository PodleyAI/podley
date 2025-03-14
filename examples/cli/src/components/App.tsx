//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import React from "react";
import { Box, Text } from "tuir";
import { TaskGraphRunner } from "@ellmers/task-graph";
import TaskGraphUI from "./TaskGraphUI";

type AppProps = {
  runner: TaskGraphRunner;
};

const App: React.FC<AppProps> = ({ runner }) => {
  return (
    <Box flexDirection="column" borderStyle="double" paddingLeft={1} paddingRight={1}>
      <Box marginBottom={1}>
        <Text bold>Ellmers Task Graph Runner</Text>
      </Box>
      <TaskGraphUI graph={runner.graph} />
    </Box>
  );
};

export default App;
