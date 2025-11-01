/**
 * Copyright (c) 2025 xwra
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createHtmlStream } from "./http.ts";
import App from "./app.tsx";
import { render } from "interest/jsx-runtime";

Deno.serve({
  port: 8080,
  async handler() {
    const stream = await createHtmlStream({ lang: "en" });
    await render(App(), stream.chunks);
    return stream.response;
  },
});
