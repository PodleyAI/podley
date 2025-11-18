/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { ITaskGraph } from "@podley/task-graph";
import React from "react";
import { Box, Text } from "retuink";
import TaskGraphUI from "./TaskGraphUI";

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
