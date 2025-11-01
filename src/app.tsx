/**
 * Copyright (c) 2025 xwra
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { close, open } from "interest/jsx-runtime";

async function* Fruits() {
  const fruits = ["TSX", "Apple", "Banana", "Cherry"];
  yield open("ol");
  for (const fruit of fruits) {
    await new Promise((r) => setTimeout(r, 500));
    yield <li>{fruit}</li>;
  }
  yield close("ol");
}

export default function App() {
  return (
    <>
      <h1>JSX Page</h1>
      <p class="oh hey">meowing chunk by chunk</p>
      <Fruits />
    </>
  );
}
