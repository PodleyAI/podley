# @podley/tasks

## 0.0.51

### Patch Changes

- Changed x-semantic to format
- Updated dependencies
  - @podley/job-queue@0.0.51
  - @podley/storage@0.0.51
  - @podley/task-graph@0.0.51
  - @podley/util@0.0.51

## 0.0.50

### Patch Changes

- ConditionalTask and better support (static flag and event emitter) for dynamic input and output schemas
- Updated dependencies
  - @podley/job-queue@0.0.50
  - @podley/storage@0.0.50
  - @podley/task-graph@0.0.50
  - @podley/util@0.0.50

## 0.0.49

### Patch Changes

- Indexeddb non-destructive migrations
- Updated dependencies
  - @podley/job-queue@0.0.49
  - @podley/storage@0.0.49
  - @podley/task-graph@0.0.49
  - @podley/util@0.0.49

## 0.0.48

### Patch Changes

- update how optional (non-required) properties are stored in databases
- Updated dependencies
  - @podley/storage@0.0.48
  - @podley/job-queue@0.0.48
  - @podley/task-graph@0.0.48
  - @podley/util@0.0.48

## 0.0.47

### Patch Changes

- Update json schema annotations for ui generation
- Updated dependencies
  - @podley/job-queue@0.0.47
  - @podley/storage@0.0.47
  - @podley/task-graph@0.0.47
  - @podley/util@0.0.47

## 0.0.46

### Patch Changes

- Open ended custom props requires custom props when working with TypeBox so go narrower
- Updated dependencies
  - @podley/task-graph@0.0.46
  - @podley/job-queue@0.0.46
  - @podley/storage@0.0.46
  - @podley/util@0.0.46

## 0.0.45

### Patch Changes

- Fix x-ui-xxxxx as a requirement
- Updated dependencies
  - @podley/util@0.0.45
  - @podley/job-queue@0.0.45
  - @podley/storage@0.0.45
  - @podley/task-graph@0.0.45

## 0.0.44

### Patch Changes

- Update JsonSchema to allow any x-ui-\* property names
- Updated dependencies
  - @podley/job-queue@0.0.44
  - @podley/storage@0.0.44
  - @podley/task-graph@0.0.44
  - @podley/util@0.0.44

## 0.0.43

### Patch Changes

- Update license and ensure build of examples includes types
- Updated dependencies
  - @podley/task-graph@0.0.43
  - @podley/job-queue@0.0.43
  - @podley/storage@0.0.43
  - @podley/util@0.0.43

## 0.0.42

### Patch Changes

- Change order of generics for ITabularRepository et al
- Updated dependencies
  - @podley/job-queue@0.0.42
  - @podley/storage@0.0.42
  - @podley/task-graph@0.0.42
  - @podley/util@0.0.42

## 0.0.41

### Patch Changes

- Update type helpers used to auto generate primary key and value shapes
- Updated dependencies
  - @podley/util@0.0.41
  - @podley/job-queue@0.0.41
  - @podley/storage@0.0.41
  - @podley/task-graph@0.0.41

## 0.0.40

### Patch Changes

- All packages use native json schema tooling from the util package
- Updated dependencies
  - @podley/task-graph@0.0.40
  - @podley/util@0.0.40
  - @podley/job-queue@0.0.40
  - @podley/storage@0.0.40

## 0.0.39

### Patch Changes

- Tasks use native json-schema with no Typebox
- Updated dependencies
  - @podley/job-queue@0.0.39
  - @podley/storage@0.0.39
  - @podley/task-graph@0.0.39
  - @podley/util@0.0.39

## 0.0.38

### Patch Changes

- Refactor JobQueueTask to account for automatically creating queues
- Updated dependencies
  - @podley/task-graph@0.0.38
  - @podley/job-queue@0.0.38
  - @podley/storage@0.0.38
  - @podley/util@0.0.38

## 0.0.37

### Patch Changes

- runReactive need not throw
- Updated dependencies
  - @podley/task-graph@0.0.37
  - @podley/job-queue@0.0.37
  - @podley/storage@0.0.37
  - @podley/util@0.0.37

## 0.0.36

### Patch Changes

- Update JavaScriptTask to use input
- Updated dependencies
  - @podley/job-queue@0.0.36
  - @podley/storage@0.0.36
  - @podley/task-graph@0.0.36
  - @podley/util@0.0.36

## 0.0.35

### Patch Changes

- Enhance TextGenerationTask schema with configuration grouping and update DebugLogTask input schema for log level handling
- Updated dependencies
  - @podley/task-graph@0.0.35
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

## 0.0.33

### Patch Changes

- Use actual JSONSchema7 (includin boolean shortcut)
- Updated dependencies
  - @podley/task-graph@0.0.33
  - @podley/job-queue@0.0.33
  - @podley/storage@0.0.33
  - @podley/util@0.0.33

## 0.0.32

### Patch Changes

- input and output schemas are not @types/json-schema based
- Updated dependencies
  - @podley/task-graph@0.0.32
  - @podley/job-queue@0.0.32
  - @podley/storage@0.0.32
  - @podley/util@0.0.32

## 0.0.31

### Patch Changes

- Fix logic bug in memory storage
- Updated dependencies
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

## 0.0.29

### Patch Changes

- Cleanup GraphAsTask input/output schemas
- Updated dependencies
  - @podley/task-graph@0.0.29
  - @podley/job-queue@0.0.29
  - @podley/storage@0.0.29
  - @podley/util@0.0.29

## 0.0.28

### Patch Changes

- inputSchema and outputSchema dynamically created for GraphAsTask
- Updated dependencies [6915093]
- Updated dependencies
- Updated dependencies [6915093]
  - @podley/task-graph@0.0.28
  - @podley/job-queue@0.0.28
  - @podley/storage@0.0.28
  - @podley/util@0.0.28

## 0.0.20

### Patch Changes

- Updated dependencies [323373c]
  - @podley/storage@0.0.20
  - @podley/job-queue@0.0.20
  - @podley/task-graph@0.0.20
  - @podley/util@0.0.20

## 0.0.19

### Patch Changes

- Small fixes for task title and dataflow exports a createId util
- Updated dependencies
  - @podley/job-queue@0.0.19
  - @podley/storage@0.0.19
  - @podley/task-graph@0.0.19
  - @podley/util@0.0.19

## 0.0.18

### Patch Changes

- Rename SimilaryTask to VectorSimilarityTask and ensure category and title on Task
- Updated dependencies
  - @podley/job-queue@0.0.18
  - @podley/storage@0.0.18
  - @podley/task-graph@0.0.18
  - @podley/util@0.0.18

## 0.0.17

### Patch Changes

- Add config.extras as optional property object for other users, to be saved as part of toJSON
- Updated dependencies
  - @podley/job-queue@0.0.17
  - @podley/storage@0.0.17
  - @podley/task-graph@0.0.17
  - @podley/util@0.0.17

## 0.0.16

### Patch Changes

- Convience method to get task id, other task meta data like title added
- Updated dependencies
  - @podley/task-graph@0.0.16
  - @podley/job-queue@0.0.16
  - @podley/storage@0.0.16
  - @podley/util@0.0.16

## 0.0.15

### Patch Changes

- Fix peer deps
- Updated dependencies
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

## 0.0.13

### Patch Changes

- Updates based on testing with node
- Updated dependencies
  - @podley/job-queue@0.0.13
  - @podley/storage@0.0.13
  - @podley/task-graph@0.0.13
  - @podley/util@0.0.13

## 0.0.12

### Patch Changes

- dev dep sync
- Updated dependencies
  - @podley/storage@0.0.12
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
  - @podley/job-queue@0.0.11

## 0.0.8

### Patch Changes

- Fixed publishing bug
- Updated dependencies
  - @podley/task-graph@0.0.8
  - @podley/util@0.0.8

## 0.0.7

### Patch Changes

- Fix glob usage
- Updated dependencies
  - @podley/task-graph@0.0.7
  - @podley/util@0.0.7

## 0.0.6

### Patch Changes

- Initial Release
- Updated dependencies
  - @podley/task-graph@0.0.6
  - @podley/util@0.0.6
