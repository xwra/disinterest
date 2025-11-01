/**
 * Copyright (c) 2025 xwra
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { html } from "./html.ts";
import { createHtmlStream } from "./http.ts";
import App from "./app.tsx";

Deno.serve({
  port: 8080,
  async handler() {
    const stream = await createHtmlStream({ lang: "en" });
    const { ol, li } = html(stream.chunks);

    await App()(stream.chunks);

    ol(async () => {
      const fruits = ["TSX support", "Apple", "Banana", "Cherry"];
      for (const fruit of fruits) {
        await new Promise((r) => setTimeout(r, 500));
        await li(fruit);
      }
    });

    return stream.response;
  },
});
