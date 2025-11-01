/**
 * Copyright (c) 2025 xwra
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/// <reference types="interest/jsx-runtime" />

import type { ChunkedStream } from "./stream.ts";

declare global {
  namespace JSX {
    type Element = (chunks: ChunkedStream<string>) => Promise<void>;
    interface IntrinsicElements {
      [key: string]: ElementProps;
    }
    interface ElementProps {
      [key: string]: any;
    }
  }
}
