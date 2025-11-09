# Tasks and Task Graphs

## Requirements

- We need to have tasks, and some tasks will be chained together as a "strategy" or list of subtasks.
- We need to sometimes run tasks in parallel and sometimes in series.
- Tasks can take a long time, so we need to be able to save the state of a task run and resume it later.
- We do NOT need to be able to run tasks in a distributed manner. v1.2 thing
- A task and a task graph (a compound task) should have a similar interface.
- We need progress events.
- Authentication and authorization will be supplied to the task by the task runner.
- provide CLI/console runner feedback via events emitted by tasks, dataflows, and graphs
- be able to represent in a UI (graph, tree, whatever).
- Have an "editor" graph (coded by the user) and a "runner" graph (run by the system). Inputs might change the run graph.

## Questions

- How do we handle errors?
- How do we handle logging?
- Do we use an eventbus?
- If we use an eventbus, do we use a global one or a local one?

## Task

A task is a single step in the chain where most tasks output will be input for the next task.

Tasks may be posted to a job queue (see `JobQueueTask`) and run by a job queue runner, or executed inline by the `TaskRunner`/`TaskGraphRunner`.

## Compound Task

A compound task is `GraphAsTask` that contains a group of tasks (in DAG format) chained together to look like a single task.

## Streaming Between Tasks

- Tasks can stream partial results to dependants without waiting for `execute()` to finish by declaring stream-capable outputs via the static `streaming()` descriptor.
- Ports marked with readiness `first-chunk` allow downstream tasks to begin work as soon as the first chunk is emitted. Ports with readiness `final` defer dependants until streaming completes.
- `IExecuteContext` now exposes `pushChunk`, `closeStream`, and `attachStreamController` helpers so tasks can enqueue chunks directly or adapt custom `ReadableStream` producers.
- Dataflows track streaming state and expose async iterables so consumers can react to chunk updates while still receiving the final aggregated output when the stream ends.
