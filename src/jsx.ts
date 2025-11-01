/**
 * Copyright (c) 2025 xwra
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { html, type HtmlProxy } from "./html.ts";
import { ChunkedStream } from "./stream.ts";

let context;

export function jsx(
  tag: string | typeof Fragment,
  { children }: Record<string, any> = {},
) {
  return async (chunks: ChunkedStream<string>) => {
    if (tag === Fragment) {
      context = html(chunks);
      for (const child of children) {
        await context.render?.(child);
      }
      return;
    }
    await (context ||= html(chunks))[tag](...children);
  };
}

export const Fragment = Symbol("Fragment");

export const jsxs = jsx;
