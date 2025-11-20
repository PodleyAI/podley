# @podley/cli

## 0.0.40

### Patch Changes

- All packages use native json schema tooling from the util package
- Updated dependencies
  - @podley/task-graph@0.0.40
  - @podley/util@0.0.40
  - @podley/ai@0.0.40
  - @podley/ai-provider@0.0.40
  - @podley/job-queue@0.0.40
  - @podley/sqlite@0.0.40
  - @podley/storage@0.0.40
  - @podley/tasks@0.0.40
  - @podley/test@0.0.40

## 0.0.39

### Patch Changes

- Tasks use native json-schema with no Typebox
- Updated dependencies
  - @podley/ai@0.0.39
  - @podley/ai-provider@0.0.39
  - @podley/job-queue@0.0.39
  - @podley/sqlite@0.0.39
  - @podley/storage@0.0.39
  - @podley/task-graph@0.0.39
  - @podley/tasks@0.0.39
  - @podley/test@0.0.39
  - @podley/util@0.0.39

## 0.0.38

### Patch Changes

- Refactor JobQueueTask to account for automatically creating queues
- Updated dependencies
  - @podley/ai-provider@0.0.38
  - @podley/task-graph@0.0.38
  - @podley/tasks@0.0.38
  - @podley/test@0.0.38
  - @podley/ai@0.0.38
  - @podley/job-queue@0.0.38
  - @podley/sqlite@0.0.38
  - @podley/storage@0.0.38
  - @podley/util@0.0.38

## 0.0.37

### Patch Changes

- runReactive need not throw
- Updated dependencies
  - @podley/task-graph@0.0.37
  - @podley/ai@0.0.37
  - @podley/ai-provider@0.0.37
  - @podley/job-queue@0.0.37
  - @podley/sqlite@0.0.37
  - @podley/storage@0.0.37
  - @podley/tasks@0.0.37
  - @podley/test@0.0.37
  - @podley/util@0.0.37

## 0.0.36

### Patch Changes

- Update JavaScriptTask to use input
- Updated dependencies
  - @podley/tasks@0.0.36
  - @podley/test@0.0.36
  - @podley/ai@0.0.36
  - @podley/ai-provider@0.0.36
  - @podley/job-queue@0.0.36
  - @podley/sqlite@0.0.36
  - @podley/storage@0.0.36
  - @podley/task-graph@0.0.36
  - @podley/util@0.0.36

## 0.0.35

### Patch Changes

- Enhance TextGenerationTask schema with configuration grouping and update DebugLogTask input schema for log level handling
- Updated dependencies
  - @podley/task-graph@0.0.35
  - @podley/tasks@0.0.35
  - @podley/ai@0.0.35
  - @podley/ai-provider@0.0.35
  - @podley/job-queue@0.0.35
  - @podley/sqlite@0.0.35
  - @podley/storage@0.0.35
  - @podley/test@0.0.35
  - @podley/util@0.0.35

## 0.0.34

### Patch Changes

- Allow x- style annotations in json schema
- Updated dependencies
  - @podley/ai-provider@0.0.34
  - @podley/task-graph@0.0.34
  - @podley/job-queue@0.0.34
  - @podley/storage@0.0.34
  - @podley/sqlite@0.0.34
  - @podley/tasks@0.0.34
  - @podley/test@0.0.34
  - @podley/util@0.0.34
  - @podley/ai@0.0.34

## 0.0.33

### Patch Changes

- Use actual JSONSchema7 (includin boolean shortcut)
- Updated dependencies
  - @podley/task-graph@0.0.33
  - @podley/ai@0.0.33
  - @podley/ai-provider@0.0.33
  - @podley/job-queue@0.0.33
  - @podley/sqlite@0.0.33
  - @podley/storage@0.0.33
  - @podley/tasks@0.0.33
  - @podley/test@0.0.33
  - @podley/util@0.0.33

## 0.0.32

### Patch Changes

- input and output schemas are not @types/json-schema based
- Updated dependencies
  - @podley/task-graph@0.0.32
  - @podley/tasks@0.0.32
  - @podley/ai@0.0.32
  - @podley/ai-provider@0.0.32
  - @podley/job-queue@0.0.32
  - @podley/sqlite@0.0.32
  - @podley/storage@0.0.32
  - @podley/test@0.0.32
  - @podley/util@0.0.32

## 0.0.31

### Patch Changes

- Fix logic bug in memory storage
- Updated dependencies
  - @podley/ai@0.0.31
  - @podley/ai-provider@0.0.31
  - @podley/job-queue@0.0.31
  - @podley/sqlite@0.0.31
  - @podley/storage@0.0.31
  - @podley/task-graph@0.0.31
  - @podley/tasks@0.0.31
  - @podley/test@0.0.31
  - @podley/util@0.0.31

## 0.0.30

### Patch Changes

- Add CachedTabularRepository and browser only SharedInMemoryTabularRepository
- Updated dependencies
  - @podley/ai-provider@0.0.30
  - @podley/task-graph@0.0.30
  - @podley/job-queue@0.0.30
  - @podley/storage@0.0.30
  - @podley/sqlite@0.0.30
  - @podley/tasks@0.0.30
  - @podley/test@0.0.30
  - @podley/util@0.0.30
  - @podley/ai@0.0.30

## 0.0.29

### Patch Changes

- Cleanup GraphAsTask input/output schemas
- Updated dependencies
  - @podley/ai-provider@0.0.29
  - @podley/task-graph@0.0.29
  - @podley/job-queue@0.0.29
  - @podley/storage@0.0.29
  - @podley/sqlite@0.0.29
  - @podley/tasks@0.0.29
  - @podley/test@0.0.29
  - @podley/util@0.0.29
  - @podley/ai@0.0.29

## 0.0.28

### Patch Changes

- inputSchema and outputSchema dynamically created for GraphAsTask
- 6915093: inputSchema and outputSchema for GraphAsTask
- Updated dependencies [6915093]
- Updated dependencies
- Updated dependencies [6915093]
  - @podley/ai-provider@0.0.28
  - @podley/ai@0.0.28
  - @podley/task-graph@0.0.28
  - @podley/test@0.0.28
  - @podley/job-queue@0.0.28
  - @podley/sqlite@0.0.28
  - @podley/storage@0.0.28
  - @podley/tasks@0.0.28
  - @podley/util@0.0.28

## 0.0.20

### Patch Changes

- 323373c: Update put and putBulk methods to return stored entities across all tabular repositories
  update package dependencies
- Updated dependencies [323373c]
  - @podley/storage@0.0.20
  - @podley/test@0.0.20
  - @podley/ai@0.0.20
  - @podley/ai-provider@0.0.20
  - @podley/job-queue@0.0.20
  - @podley/task-graph@0.0.20
  - @podley/tasks@0.0.20
  - @podley/sqlite@0.0.20
  - @podley/util@0.0.20

## 0.0.6

### Patch Changes

- Initial Release
- Updated dependencies
  - @podley/ai-provider@0.0.6
  - @podley/task-graph@0.0.6
  - @podley/storage@0.0.6
  - @podley/tasks@0.0.6
  - @podley/test@0.0.6
  - @podley/util@0.0.6
  - @podley/ai@0.0.6
