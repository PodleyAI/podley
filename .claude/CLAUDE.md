# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- Build: `bun run build` or `turbo run build-types build-package build-example`
- Test: `bun test` (specific test: `bun test <testname>`)
- Lint/Format: `bun run format`
- Dev: `bun run dev` or `turbo run watch`

## Code Style
- Use TypeScript for type safety
- Prefix interfaces with `I` (e.g., `ITask`, `IWorkflow`)
- Avoid imports from files named: index, node, bun, browser
- Follow existing patterns for error handling (using `TaskFailedError`)
- Use `bun` instead of `jest` for testing
- Write tests using `describe`/`it` pattern
- Format with Prettier (tabs, double quotes)

## TypeScript Guidelines
- Default to `unknown` instead of `any` for untyped values
- Always define input/output types for tasks
- Use interfaces for public APIs and types for internal structures
- Export well-defined interfaces from packages