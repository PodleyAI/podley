//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import React from "react";
import { Box, Text } from "retuink";
import TaskGraphUI from "./TaskGraphUI";
import { ITaskGraph } from "@podley/task-graph";

type AppProps = {
  graph: ITaskGraph;
};

const App: React.FC<AppProps> = ({ graph }) => {
  return (
    <Box flexDirection="column" height="100%" flexGrow={1}>
      <Box height={1}>
        <Text bold>Podley Task Graph Runner</Text>
      </Box>
      <Box flexDirection="column" flexGrow={1} overflow="hidden">
        <TaskGraphUI graph={graph} />
      </Box>
    </Box>
  );
};

export default App;
