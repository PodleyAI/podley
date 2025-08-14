# Instrumentation

## Introduction

Instrumentation is the process of adding code to a program to collect data about its execution. Since we are going to be using a lot of different tools, we need to be able to collect data about how they are performing. We need to be able to compare them and see which ones are working best for our data.

Some of these tools cost money, so we need to track and estimate costs.

- Tasks emit status/progress events (`TaskStatus`, progress percent)
- Dataflows emit start/complete/error events and carry provenance
- Task graphs emit start/progress/complete/error events
