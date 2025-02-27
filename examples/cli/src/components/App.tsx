import React from "react";
import { Box, Text } from "ink";
import { TaskGraph, TaskGraphRunner } from "@ellmers/task-graph";
import TaskGraphUI from "./TaskGraphUI";

type AppProps = {
  runner: TaskGraphRunner;
};

const App: React.FC<AppProps> = ({ runner }) => {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Ellmers Task Graph Runner</Text>
      </Box>
      <TaskGraphUI graph={runner.dag} />
    </Box>
  );
};

export default App;
