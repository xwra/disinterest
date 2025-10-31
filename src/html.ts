/**
 * Copyright (c) 2025 xwra
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { type Chunk, ChunkedWriter } from "./http.ts";
import { ChunkedStream } from "./stream.ts";

type Attrs = Record<string, string | number | boolean>;

const SELF_CLOSING_TAGS = new Set([
  "br",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "track",
  "source",
]);

export function escape(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function attrsToString(
  attrs: Attrs | undefined,
  escape: (str: string) => string,
): string {
  if (!attrs) return "";
  const pairs = Object.entries(attrs)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      if (value === true) return key;
      if (value === false) return "";
      return `${key}="${escape(String(value))}"`;
    })
    .filter(Boolean);
  return pairs.length ? " " + pairs.join(" ") : "";
}

type TagFunction = {
  (attrs: Attrs, ...children: Chunk[]): Promise<void>;
  (...children: Chunk[]): Promise<void>;
};

type HtmlBuilder = {
  [K: string]: TagFunction;
};

export function html(
  chunks: ChunkedStream<string>,
  write: ChunkedWriter,
): HtmlBuilder {
  const tags = new Map<string, (...args: any[]) => Promise<void>>();

  const handler: ProxyHandler<Record<string, TagFunction>> = {
    get(_, tag: string) {
      if (tags.has(tag)) {
        return tags.get(tag);
      }

      const fn = async (...args: (Chunk | Attrs)[]) => {
        const isTemplate = args.length === 1 && Array.isArray(args[0]) &&
          "raw" in args[0];
        const hasAttrs = !isTemplate && args.length &&
          typeof args[0] === "object";

        const attrs: Attrs | undefined = hasAttrs
          ? args.shift() as Attrs
          : undefined;
        const children: Chunk[] = args as Chunk[];

        const attributes = attrsToString(attrs, escape);
        const isSelfClosing = SELF_CLOSING_TAGS.has(tag.toLowerCase());
        if (!isSelfClosing && !children.length) return;
        chunks.write(`<${tag}${attributes}${isSelfClosing ? " /" : ""}>`);

        if (!isSelfClosing) {
          if (isTemplate) {
            await (write as any)(...children);
          } else {
            for (const child of children) {
              typeof child === "function"
                ? await (child as any)()
                : chunks.write(String(await child));
            }
          }
          chunks.write(`</${tag}>`);
        }
      };

      tags.set(tag, fn);
      return fn;
    },
  };
  return new Proxy({}, handler);
}
