/**
 * Copyright (c) 2025 xwra
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export class ChunkedStream<T> implements AsyncIterable<T> {
  private readonly chunks: T[] = [];
  private readonly resolvers: ((result: IteratorResult<T>) => void)[] = [];
  private _closed = false;

  get closed(): boolean {
    return this._closed;
  }

  write(chunk: T) {
    if (this._closed) throw new Error("Cannot write to closed stream");

    const resolver = this.resolvers.shift();
    if (resolver) {
      resolver({ value: chunk, done: false });
    } else {
      this.chunks.push(chunk);
    }
  }

  close(): void {
    this._closed = true;
    while (this.resolvers.length) {
      this.resolvers.shift()!({ value: undefined! as any, done: true });
    }
  }

  async next(): Promise<IteratorResult<T>> {
    if (this.chunks.length) {
      return { value: this.chunks.shift()!, done: false };
    }
    if (this._closed) return { value: undefined as any, done: true };
    return new Promise((resolve) => this.resolvers.push(resolve));
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    return this;
  }
}

export const mapStream = <T, U>(
  fn: (chunk: T, i: number) => U | Promise<U>,
) =>
  async function* (source: AsyncIterable<T>): AsyncIterable<U> {
    let i = 0;
    for await (const chunk of source) yield await fn(chunk, i++);
  };

export const filterStream = <T>(
  pred: (chunk: T, i: number) => boolean | Promise<boolean>,
) =>
  async function* (source: AsyncIterable<T>): AsyncIterable<T> {
    let i = 0;
    for await (const chunk of source) {
      if (await pred(chunk, i++)) yield chunk;
    }
  };

export const takeStream = <T>(count: number) =>
  async function* (source: AsyncIterable<T>): AsyncIterable<T> {
    let taken = 0;
    for await (const chunk of source) {
      if (taken++ >= count) return;
      yield chunk;
    }
  };

export const skipStream = <T>(count: number) =>
  async function* (source: AsyncIterable<T>): AsyncIterable<T> {
    let i = 0;
    for await (const chunk of source) {
      if (i++ >= count) yield chunk;
    }
  };

export const batchStream = <T>(size: number) =>
  async function* (source: AsyncIterable<T>): AsyncIterable<T[]> {
    let batch: T[] = [];
    for await (const chunk of source) {
      batch.push(chunk);
      if (batch.length >= size) {
        yield batch;
        batch = [];
      }
    }
    batch.length && (yield batch);
  };

export const tapStream = <T>(
  fn: (chunk: T, i: number) => void | Promise<void>,
) =>
  async function* (source: AsyncIterable<T>): AsyncIterable<T> {
    let i = 0;
    for await (const chunk of source) {
      yield chunk;
      await fn(chunk, i++);
    }
  };

export const pipe =
  <T>(...fns: Array<(src: AsyncIterable<T>) => AsyncIterable<any>>) =>
  (source: AsyncIterable<T>) => fns.reduce((acc, fn) => fn(acc), source);
