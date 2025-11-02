/**
 * Copyright (c) 2025 xwra
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/// <reference types="interest/jsx-runtime" />

import type { JsxElement } from "interest/jsx-runtime";

type HTMLAttributeMap<T = HTMLElement> = Partial<
	Omit<T, keyof Element | "children" | "style"> & {
		style?: string;
		class?: string;
		children?: any;
		[key: `data-${string}`]: string | number | boolean | null | undefined;
		[key: `aria-${string}`]: string | number | boolean | null | undefined;
	}
>;

declare global {
	namespace JSX {
		type Element = JsxElement;

		export interface ElementChildrenAttribute {
			// deno-lint-ignore ban-types
			children: {};
		}

		export type IntrinsicElements =
			& {
				[K in keyof HTMLElementTagNameMap]: HTMLAttributeMap<
					HTMLElementTagNameMap[K]
				>;
			}
			& {
				[K in keyof SVGElementTagNameMap]: HTMLAttributeMap<
					SVGElementTagNameMap[K]
				>;
			};
	}
}
