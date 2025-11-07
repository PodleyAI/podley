# @podley/test

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
  - @podley/util@0.0.29
  - @podley/ai@0.0.29

## 0.0.28

### Patch Changes

- 6915093: Calculate input and output schemas for GraphAsTask via inputSchema and outputSchema
- inputSchema and outputSchema dynamically created for GraphAsTask
- 6915093: inputSchema and outputSchema for GraphAsTask
- Updated dependencies [6915093]
- Updated dependencies
- Updated dependencies [6915093]
  - @podley/ai-provider@0.0.28
  - @podley/ai@0.0.28
  - @podley/task-graph@0.0.28
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
  - @podley/ai@0.0.20
  - @podley/ai-provider@0.0.20
  - @podley/job-queue@0.0.20
  - @podley/task-graph@0.0.20
  - @podley/tasks@0.0.20
  - @podley/sqlite@0.0.20
  - @podley/util@0.0.20

## 0.0.19

### Patch Changes

- Small fixes for task title and dataflow exports a createId util
- Updated dependencies
  - @podley/sqlite@0.0.19
  - @podley/ai@0.0.19
  - @podley/ai-provider@0.0.19
  - @podley/job-queue@0.0.19
  - @podley/storage@0.0.19
  - @podley/task-graph@0.0.19
  - @podley/tasks@0.0.19
  - @podley/util@0.0.19

## 0.0.18

### Patch Changes

- Rename SimilaryTask to VectorSimilarityTask and ensure category and title on Task
- Updated dependencies
  - @podley/ai@0.0.18
  - @podley/ai-provider@0.0.18
  - @podley/job-queue@0.0.18
  - @podley/sqlite@0.0.18
  - @podley/storage@0.0.18
  - @podley/task-graph@0.0.18
  - @podley/tasks@0.0.18
  - @podley/util@0.0.18

## 0.0.17

### Patch Changes

- Add config.extras as optional property object for other users, to be saved as part of toJSON
- Updated dependencies
  - @podley/ai@0.0.17
  - @podley/ai-provider@0.0.17
  - @podley/job-queue@0.0.17
  - @podley/sqlite@0.0.17
  - @podley/storage@0.0.17
  - @podley/task-graph@0.0.17
  - @podley/tasks@0.0.17
  - @podley/util@0.0.17

## 0.0.16

### Patch Changes

- Convience method to get task id, other task meta data like title added
- Updated dependencies
  - @podley/task-graph@0.0.16
  - @podley/ai@0.0.16
  - @podley/ai-provider@0.0.16
  - @podley/job-queue@0.0.16
  - @podley/sqlite@0.0.16
  - @podley/storage@0.0.16
  - @podley/tasks@0.0.16
  - @podley/util@0.0.16

## 0.0.15

### Patch Changes

- Fix peer deps
- Updated dependencies
  - @podley/ai@0.0.15
  - @podley/ai-provider@0.0.15
  - @podley/job-queue@0.0.15
  - @podley/sqlite@0.0.15
  - @podley/storage@0.0.15
  - @podley/task-graph@0.0.15
  - @podley/tasks@0.0.15
  - @podley/util@0.0.15

## 0.0.14

### Patch Changes

- Add Supabase as storaged
- Updated dependencies
  - @podley/ai-provider@0.0.14
  - @podley/task-graph@0.0.14
  - @podley/job-queue@0.0.14
  - @podley/storage@0.0.14
  - @podley/sqlite@0.0.14
  - @podley/tasks@0.0.14
  - @podley/util@0.0.14
  - @podley/ai@0.0.14

## 0.0.13

### Patch Changes

- Updates based on testing with node
- Updated dependencies
  - @podley/ai@0.0.13
  - @podley/ai-provider@0.0.13
  - @podley/job-queue@0.0.13
  - @podley/sqlite@0.0.13
  - @podley/storage@0.0.13
  - @podley/task-graph@0.0.13
  - @podley/tasks@0.0.13
  - @podley/util@0.0.13

## 0.0.12

### Patch Changes

- dev dep sync
- Updated dependencies
  - @podley/ai-provider@0.0.12
  - @podley/storage@0.0.12
  - @podley/ai@0.0.12
  - @podley/job-queue@0.0.12
  - @podley/sqlite@0.0.12
  - @podley/task-graph@0.0.12
  - @podley/tasks@0.0.12
  - @podley/util@0.0.12

## 0.0.11

### Patch Changes

- Update dependecies and docs
- Updated dependencies
  - @podley/ai-provider@0.0.11
  - @podley/task-graph@0.0.11
  - @podley/storage@0.0.11
  - @podley/tasks@0.0.11
  - @podley/util@0.0.11
  - @podley/ai@0.0.11
  - @podley/job-queue@0.0.11
  - @podley/sqlite@0.0.11

## 0.0.8

### Patch Changes

- Fixed publishing bug
- Updated dependencies
  - @podley/ai@0.0.8
  - @podley/ai-provider@0.0.8
  - @podley/job-queue@0.0.8
  - @podley/sqlite@0.0.8
  - @podley/storage@0.0.8
  - @podley/task-graph@0.0.8
  - @podley/tasks@0.0.8
  - @podley/util@0.0.8

## 0.0.7

### Patch Changes

- Fix glob usage
- Updated dependencies
  - @podley/ai@0.0.7
  - @podley/ai-provider@0.0.7
  - @podley/job-queue@0.0.7
  - @podley/sqlite@0.0.7
  - @podley/storage@0.0.7
  - @podley/task-graph@0.0.7
  - @podley/tasks@0.0.7
  - @podley/util@0.0.7

## 0.0.6

### Patch Changes

- Initial Release
- Updated dependencies
  - @podley/ai-provider@0.0.6
  - @podley/task-graph@0.0.6
  - @podley/job-queue@0.0.6
  - @podley/storage@0.0.6
  - @podley/sqlite@0.0.6
  - @podley/tasks@0.0.6
  - @podley/util@0.0.6
  - @podley/ai@0.0.6
