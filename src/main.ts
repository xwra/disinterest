/**
 * Copyright (c) 2025 xwra
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { html } from "./html.ts";
import { createHtmlStream } from "./http.ts";

Deno.serve({
  port: 8080,
  async handler() {
    const stream = await createHtmlStream({ lang: "en" });
    const { h1, ol, p, li } = html(stream.chunks);

    await h1`Normal Streaming Page`;
    await p({ class: "oh hey" }, "meowing chunk by chunk");

    ol(async () => {
      const fruits = ["Apple", "Banana", "Cherry"];
      for (const fruit of fruits) {
        await new Promise((r) => setTimeout(r, 500));
        await li(fruit);
      }
    });

    return stream.response;
  },
});
