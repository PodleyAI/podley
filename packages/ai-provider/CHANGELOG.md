# @podley/ai-provider

## 0.0.41

### Patch Changes

- Update type helpers used to auto generate primary key and value shapes
- Updated dependencies
  - @podley/util@0.0.41
  - @podley/ai@0.0.41
  - @podley/job-queue@0.0.41
  - @podley/storage@0.0.41
  - @podley/task-graph@0.0.41

## 0.0.40

### Patch Changes

- All packages use native json schema tooling from the util package
- Updated dependencies
  - @podley/task-graph@0.0.40
  - @podley/util@0.0.40
  - @podley/ai@0.0.40
  - @podley/job-queue@0.0.40
  - @podley/storage@0.0.40

## 0.0.39

### Patch Changes

- Tasks use native json-schema with no Typebox
- Updated dependencies
  - @podley/ai@0.0.39
  - @podley/job-queue@0.0.39
  - @podley/storage@0.0.39
  - @podley/task-graph@0.0.39
  - @podley/util@0.0.39

## 0.0.38

### Patch Changes

- Refactor JobQueueTask to account for automatically creating queues
- Updated dependencies
  - @podley/task-graph@0.0.38
  - @podley/ai@0.0.38
  - @podley/job-queue@0.0.38
  - @podley/storage@0.0.38
  - @podley/util@0.0.38

## 0.0.37

### Patch Changes

- runReactive need not throw
- Updated dependencies
  - @podley/task-graph@0.0.37
  - @podley/ai@0.0.37
  - @podley/job-queue@0.0.37
  - @podley/storage@0.0.37
  - @podley/util@0.0.37

## 0.0.36

### Patch Changes

- Update JavaScriptTask to use input
- Updated dependencies
  - @podley/ai@0.0.36
  - @podley/job-queue@0.0.36
  - @podley/storage@0.0.36
  - @podley/task-graph@0.0.36
  - @podley/util@0.0.36

## 0.0.35

### Patch Changes

- Enhance TextGenerationTask schema with configuration grouping and update DebugLogTask input schema for log level handling
- Updated dependencies
  - @podley/task-graph@0.0.35
  - @podley/ai@0.0.35
  - @podley/job-queue@0.0.35
  - @podley/storage@0.0.35
  - @podley/util@0.0.35

## 0.0.34

### Patch Changes

- Allow x- style annotations in json schema
- Updated dependencies
  - @podley/task-graph@0.0.34
  - @podley/job-queue@0.0.34
  - @podley/storage@0.0.34
  - @podley/util@0.0.34
  - @podley/ai@0.0.34

## 0.0.33

### Patch Changes

- Use actual JSONSchema7 (includin boolean shortcut)
- Updated dependencies
  - @podley/task-graph@0.0.33
  - @podley/ai@0.0.33
  - @podley/job-queue@0.0.33
  - @podley/storage@0.0.33
  - @podley/util@0.0.33

## 0.0.32

### Patch Changes

- input and output schemas are not @types/json-schema based
- Updated dependencies
  - @podley/task-graph@0.0.32
  - @podley/ai@0.0.32
  - @podley/job-queue@0.0.32
  - @podley/storage@0.0.32
  - @podley/util@0.0.32

## 0.0.31

### Patch Changes

- Fix logic bug in memory storage
- Updated dependencies
  - @podley/ai@0.0.31
  - @podley/job-queue@0.0.31
  - @podley/storage@0.0.31
  - @podley/task-graph@0.0.31
  - @podley/util@0.0.31

## 0.0.30

### Patch Changes

- Add CachedTabularRepository and browser only SharedInMemoryTabularRepository
- Updated dependencies
  - @podley/task-graph@0.0.30
  - @podley/job-queue@0.0.30
  - @podley/storage@0.0.30
  - @podley/util@0.0.30
  - @podley/ai@0.0.30

## 0.0.29

### Patch Changes

- Cleanup GraphAsTask input/output schemas
- Updated dependencies
  - @podley/task-graph@0.0.29
  - @podley/job-queue@0.0.29
  - @podley/storage@0.0.29
  - @podley/util@0.0.29
  - @podley/ai@0.0.29

## 0.0.28

### Patch Changes

- 6915093: Calculate input and output schemas for GraphAsTask via inputSchema and outputSchema
- inputSchema and outputSchema dynamically created for GraphAsTask
- Updated dependencies [6915093]
- Updated dependencies
- Updated dependencies [6915093]
  - @podley/ai@0.0.28
  - @podley/task-graph@0.0.28
  - @podley/job-queue@0.0.28
  - @podley/storage@0.0.28
  - @podley/util@0.0.28

## 0.0.20

### Patch Changes

- Updated dependencies [323373c]
  - @podley/storage@0.0.20
  - @podley/ai@0.0.20
  - @podley/job-queue@0.0.20
  - @podley/task-graph@0.0.20
  - @podley/util@0.0.20

## 0.0.19

### Patch Changes

- Small fixes for task title and dataflow exports a createId util
- Updated dependencies
  - @podley/ai@0.0.19
  - @podley/job-queue@0.0.19
  - @podley/storage@0.0.19
  - @podley/task-graph@0.0.19
  - @podley/util@0.0.19

## 0.0.18

### Patch Changes

- Rename SimilaryTask to VectorSimilarityTask and ensure category and title on Task
- Updated dependencies
  - @podley/ai@0.0.18
  - @podley/job-queue@0.0.18
  - @podley/storage@0.0.18
  - @podley/task-graph@0.0.18
  - @podley/util@0.0.18

## 0.0.17

### Patch Changes

- Add config.extras as optional property object for other users, to be saved as part of toJSON
- Updated dependencies
  - @podley/ai@0.0.17
  - @podley/job-queue@0.0.17
  - @podley/storage@0.0.17
  - @podley/task-graph@0.0.17
  - @podley/util@0.0.17

## 0.0.16

### Patch Changes

- Convience method to get task id, other task meta data like title added
- Updated dependencies
  - @podley/task-graph@0.0.16
  - @podley/ai@0.0.16
  - @podley/job-queue@0.0.16
  - @podley/storage@0.0.16
  - @podley/util@0.0.16

## 0.0.15

### Patch Changes

- Fix peer deps
- Updated dependencies
  - @podley/ai@0.0.15
  - @podley/job-queue@0.0.15
  - @podley/storage@0.0.15
  - @podley/task-graph@0.0.15
  - @podley/util@0.0.15

## 0.0.14

### Patch Changes

- Add Supabase as storaged
- Updated dependencies
  - @podley/task-graph@0.0.14
  - @podley/job-queue@0.0.14
  - @podley/storage@0.0.14
  - @podley/util@0.0.14
  - @podley/ai@0.0.14

## 0.0.13

### Patch Changes

- Updates based on testing with node
- Updated dependencies
  - @podley/ai@0.0.13
  - @podley/job-queue@0.0.13
  - @podley/storage@0.0.13
  - @podley/task-graph@0.0.13
  - @podley/util@0.0.13

## 0.0.12

### Patch Changes

- dev dep sync
- Updated dependencies
  - @podley/storage@0.0.12
  - @podley/ai@0.0.12
  - @podley/job-queue@0.0.12
  - @podley/task-graph@0.0.12
  - @podley/util@0.0.12

## 0.0.11

### Patch Changes

- Update dependecies and docs
- Updated dependencies
  - @podley/task-graph@0.0.11
  - @podley/storage@0.0.11
  - @podley/util@0.0.11
  - @podley/ai@0.0.11
  - @podley/job-queue@0.0.11

## 0.0.8

### Patch Changes

- Fixed publishing bug
- Updated dependencies
  - @podley/ai@0.0.8
  - @podley/job-queue@0.0.8
  - @podley/storage@0.0.8
  - @podley/task-graph@0.0.8
  - @podley/util@0.0.8

## 0.0.7

### Patch Changes

- Fix glob usage
- Updated dependencies
  - @podley/ai@0.0.7
  - @podley/job-queue@0.0.7
  - @podley/storage@0.0.7
  - @podley/task-graph@0.0.7
  - @podley/util@0.0.7

## 0.0.6

### Patch Changes

- Initial Release
- Updated dependencies
  - @podley/task-graph@0.0.6
  - @podley/job-queue@0.0.6
  - @podley/storage@0.0.6
  - @podley/util@0.0.6
  - @podley/ai@0.0.6
