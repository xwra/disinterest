#!/usr/bin/env -S deno run --allow-read --allow-write
/**
 * Copyright (c) 2025 xwra
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { walk } from "https://deno.land/std/fs/walk.ts";

const copyrightHeader = `/**
 * Copyright (c) 2025 xwra
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
`;

const dir = "./";

for await (
  const entry of walk(dir, {
    exts: [".ts", ".tsx"],
    includeDirs: false,
    skip: [/node_modules/, /copyright\.ts$/],
  })
) {
  const filePath = entry.path;
  const content = await Deno.readTextFile(filePath);

  if (!content.startsWith(copyrightHeader)) {
    await Deno.writeTextFile(filePath, copyrightHeader + "\n" + content);
    console.log(`Added header to ${filePath}`);
  }
}
