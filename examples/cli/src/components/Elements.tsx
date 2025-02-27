//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import chalk from "chalk";
import React, { useState, useEffect } from "react";
import type { FC } from "react";
import { Text } from "ink";

/**
 * createBar
 *
 * Features:
 * - Unicode-based progress bar generation
 * - Customizable bar length and progress indication
 * - Color-coded output using chalk
 *
 * Used to create visual feedback for long-running tasks in the CLI interface,
 * with smooth progress transitions and clear visual indicators.
 */
export function createBar(progress: number, length: number): string {
  let distance = progress * length;
  let bar = "";
  // Add main portion
  bar += "\u2588".repeat(Math.floor(distance));
  // Add intermediate porttion
  const c = Math.round((distance % 1) * 7) + 1;
  switch (c) {
    case 1:
      bar += "\u258F";
      break;
    case 2:
      bar += "\u258E";
      break;
    case 3:
      bar += "\u258D";
      break;
    case 4:
      bar += "\u258C";
      break;
    case 5:
      bar += "\u258B";
      break;
    case 6:
      bar += "\u258A";
      break;
    case 7:
      bar += "\u2589";
      break;
    case 8:
      bar += "\u2588";
      break;
    default:
      bar += c;
  }

  // Extend empty bar
  bar += "\u258F".repeat(length > bar.length ? length - bar.length : 0);

  return chalk.rgb(70, 70, 240)("\u2595" + chalk.bgRgb(20, 20, 70)(bar) + "\u258F");
}

export const symbols = {
  arrowRight: "→",
  tick: "✔",
  info: "ℹ",
  warning: "⚠",
  cross: "✖",
  squareSmallFilled: "◼",
  pointer: "❯",
};

export type Spinner = {
  interval: number;
  frames: string[];
};

export const Spinner: FC<{
  spinner: Spinner;
}> = ({ spinner }) => {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrameIndex((currentFrameIndex) => {
        const isLastFrame = currentFrameIndex === spinner.frames.length - 1;
        return isLastFrame ? 0 : currentFrameIndex + 1;
      });
    }, spinner.interval);

    return () => {
      clearInterval(timer);
    };
  }, [spinner]);

  return <Text>{spinner.frames[frameIndex]}</Text>;
};
