/**
 * Copyright (c) 2025 xwra
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChunkedStream } from "./stream.ts";

export interface StreamOptions {
  headContent?: string;
  bodyAttributes?: string;
  lang?: string;
}

export type Chunk =
  | string
  | AsyncIterable<string>
  | Promise<string>
  | Iterable<string>;

async function* normalize(
  value: Chunk | undefined | null,
): AsyncIterable<string> {
  if (value == null) return;
  if (typeof value === "string") {
    yield value;
  } else if (value instanceof Promise) {
    const resolved = await value;
    if (resolved != null) yield String(resolved);
  } else if (
    typeof value === "object" &&
    (Symbol.asyncIterator in value || Symbol.iterator in value)
  ) {
    for await (const chunk of value as AsyncIterable<string>) {
      if (chunk != null) yield String(chunk);
    }
  } else {
    yield String(value);
  }
}

export type ChunkedWriter = (
  strings: TemplateStringsArray,
  ...values: Chunk[]
) => Promise<void>;

export function makeChunkWriter(stream: ChunkedStream<string>): ChunkedWriter {
  const emit = (chunk: string) => {
    if (stream.closed) return;
    chunk === "EOF" ? stream.close() : stream.write(chunk);
  };

  return async function (strings: TemplateStringsArray, ...values: Chunk[]) {
    for (let i = 0; i < strings.length; i++) {
      if (strings[i]) emit(strings[i]);
      for await (const chunk of normalize(values[i])) {
        emit(chunk);
      }
    }
  };
}

export function chunkedHtml(): {
  chunks: ChunkedStream<string>;
  stream: ReadableStream<Uint8Array>;
} {
  const encoder = new TextEncoder();
  const chunks = new ChunkedStream<string>();

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (chunks.closed) return;
      const result = await chunks.next();
      result.done
        ? controller.close()
        : controller.enqueue(encoder.encode(result.value));
    },
    cancel() {
      chunks.close();
    },
  });

  return { chunks, stream };
}

export async function createHtmlStream(options: StreamOptions = {}) {
  const { chunks, stream } = chunkedHtml();
  const writer = makeChunkWriter(chunks);

  await writer`<!DOCTYPE html>
<html lang="${options.lang || "en"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${options.headContent || ""}
</head>
<body ${options.bodyAttributes || ""}>`;

  return {
    write: writer,
    stream,
    chunks,
    close() {
      if (chunks.closed) return;
      chunks.write("</body></html>");
      chunks.close();
    },
    get response(): Response {
      return new Response(stream, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Transfer-Encoding": "chunked",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    },
  };
}
