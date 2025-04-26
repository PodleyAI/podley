//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, NamedGraphResult, Task, TaskGraph } from "@ellmers/task-graph";
import { FetchQuarterlyIndexTask, FetchQuarterlyIndexTaskOutput } from "./FetchQuarterlyIndexTask";

// NOTE: ONLY PREVIOUS QUARTERS' master index are immutable, current one is not (though should switch to daily)

type FetchQuarterlyIndexRangeTaskInput = {
  startYear: number;
  startQuarter?: number;
  endYear?: number;
  endQuarter?: number;
};

type FetchQuarterlyIndexRangeTaskOutput = {
  updateList: [cik: number, last_known_update: string][];
};

export class FetchQuarterlyIndexRangeTask extends Task<
  FetchQuarterlyIndexRangeTaskInput,
  FetchQuarterlyIndexRangeTaskOutput
> {
  static readonly type = "FetchQuarterlyIndexRangeTask";
  static readonly category = "SEC";
  static readonly cacheable = true;

  static readonly inputs = [
    {
      id: "startYear",
      name: "Start Year",
      valueType: "number",
    },
    {
      id: "startQuarter",
      name: "Start Quarter",
      valueType: "number",
      optional: true,
    },
    {
      id: "endYear",
      name: "End Year",
      valueType: "number",
      optional: true,
    },
    {
      id: "endQuarter",
      name: "End Quarter",
      valueType: "number",
      optional: true,
    },
  ] as const;

  static readonly outputs = [
    {
      id: "updateList",
      name: "Update List",
      valueType: "object",
      isArray: true,
    },
  ] as const;

  async execute(
    input: FetchQuarterlyIndexRangeTaskInput,
    config: IExecuteConfig
  ): Promise<FetchQuarterlyIndexRangeTaskOutput> {
    if (!input.startYear) return { updateList: [] };

    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth() + 1;

    const startYear = input.startYear;
    const startQuarter = input.startQuarter ?? 1;
    const endYear = input.endYear ?? todayYear;
    const endQuarter = input.endQuarter ?? Math.ceil(todayMonth / 3);

    const tasks = config.own(new TaskGraph());

    // from the date to the current date, fetch the quarterly index
    const quarters = (endYear - startYear) * 4 + (endQuarter - startQuarter);
    for (let i = 0; i < quarters; i++) {
      const fetchYear = startYear + Math.floor(i / 4);
      const fetchMonth = (i % 4) * 3 + 1;
      const fetchDay = 1;
      const task = new FetchQuarterlyIndexTask({
        date: `${fetchYear}-${fetchMonth}-${fetchDay}`,
      });
      tasks.addTask(task);
    }

    const results: NamedGraphResult<FetchQuarterlyIndexTaskOutput> = await tasks.run();

    const updateList: Record<number, string> = {};
    for (const result of results) {
      const updateListQuarter = result.data.updateList;
      for (const [cik, last_known_update] of updateListQuarter) {
        if (updateList[cik] === undefined || updateList[cik] < last_known_update) {
          updateList[cik] = last_known_update;
        }
      }
    }

    return {
      updateList: Object.entries(updateList).map(([cik, last_known_update]) => [
        parseInt(cik),
        last_known_update,
      ]),
    };
  }
}
