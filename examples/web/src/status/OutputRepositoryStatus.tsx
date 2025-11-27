/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { TaskOutputRepository } from "@workglow/task-graph";
import { useCallback, useEffect, useState } from "react";

export function OutputRepositoryStatus({ repository }: { repository: TaskOutputRepository }) {
  const [size, setSize] = useState<number>(0);
  const clear = useCallback(() => {
    repository.clear();
    setSize(0);
  }, []);
  useEffect(() => {
    async function listen() {
      setSize(await repository.size());
    }

    repository.on("output_saved", listen);
    repository.on("output_cleared", listen);

    listen();

    return () => {
      repository.off("output_saved", listen);
      repository.off("output_cleared", listen);
    };
  }, []);

  return (
    <div>
      <span title={repository.constructor.name}>Output Cache</span>: {size}
      <button onClick={clear} className="float-right">
        Clear
      </button>
    </div>
  );
}
