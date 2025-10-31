/**
 * Copyright (c) 2025 xwra
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export class ChunkedStream<T> implements AsyncIterable<T> {
  private readonly chunks: T[] = [];
  private readonly queue: ((result: IteratorResult<T>) => void)[] = [];
  private _closed = false;

  get closed(): boolean {
    return this._closed;
  }

  write(chunk: T): void {
    if (this._closed) throw new Error("Cannot write to closed stream");
    this.queue.shift()?.({ value: chunk, done: false }) ??
      this.chunks.push(chunk);
  }

  close(): void {
    this._closed = true;
    this.queue.splice(0).forEach((r) => r({ value: undefined, done: true }));
  }

  next(): Promise<IteratorResult<T>> {
    if (this.chunks.length) {
      return Promise.resolve({
        value: this.chunks.shift()!,
        done: false,
      });
    }
    if (this._closed) {
      return Promise.resolve({
        value: undefined as any,
        done: true,
      });
    }
    return new Promise((resolve) => this.queue.push(resolve));
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    return this;
  }
}

export async function* mapStream<T, U>(
  source: AsyncIterable<T>,
  fn: (chunk: T, index: number) => U | Promise<U>,
): AsyncIterable<U> {
  let index = 0;
  for await (const chunk of source) {
    yield await fn(chunk, index++);
  }
}

export async function* filterStream<T>(
  source: AsyncIterable<T>,
  predicate: (chunk: T, index: number) => boolean | Promise<boolean>,
): AsyncIterable<T> {
  let index = 0;
  for await (const chunk of source) {
    if (await predicate(chunk, index++)) {
      yield chunk;
    }
  }
}

export async function* composeStreams<T>(
  ...sources: AsyncIterable<T>[]
): AsyncIterable<T> {
  for (const source of sources) {
    yield* source;
  }
}

export async function* takeStream<T>(
  source: AsyncIterable<T>,
  count: number,
): AsyncIterable<T> {
  let taken = 0;
  for await (const chunk of source) {
    if (taken++ >= count) break;
    yield chunk;
  }
}

export async function* skipStream<T>(
  source: AsyncIterable<T>,
  count: number,
): AsyncIterable<T> {
  let skipped = 0;
  for await (const chunk of source) {
    if (skipped++ >= count) {
      yield chunk;
    }
  }
}

export async function* batchStream<T>(
  source: AsyncIterable<T>,
  size: number,
): AsyncIterable<T[]> {
  let batch: T[] = [];

  for await (const chunk of source) {
    batch.push(chunk);
    if (batch.length >= size) {
      yield batch, batch = [];
    }
  }

  if (batch.length > 0) {
    yield batch;
  }
}

export async function* flatMapStream<T, U>(
  source: AsyncIterable<T>,
  fn: (chunk: T, index: number) => AsyncIterable<U> | Iterable<U>,
): AsyncIterable<U> {
  let index = 0;
  for await (const chunk of source) {
    yield* fn(chunk, index++);
  }
}

export async function* tapStream<T>(
  source: AsyncIterable<T>,
  fn: (chunk: T, index: number) => void | Promise<void>,
): AsyncIterable<T> {
  let index = 0;
  for await (const chunk of source) {
    yield chunk;
    await fn(chunk, index++);
  }
}
