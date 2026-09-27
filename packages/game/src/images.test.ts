import assert from "node:assert/strict";
import { test } from "node:test";

import { imageWidth, isImageWidth } from "./images.ts";

test("image widths round up to a step and stop at the max", () => {
	assert.equal(imageWidth(1), 256);
	assert.equal(imageWidth(288), 512);
	assert.equal(imageWidth(512), 512);
	assert.equal(imageWidth(1170), 1280);
	assert.equal(imageWidth(9000), 3072);
	assert.ok(isImageWidth(1280));
	assert.ok(!isImageWidth(1000));
	assert.ok(!isImageWidth(4096));
	assert.ok(!isImageWidth(0));
	assert.ok(!isImageWidth(256.5));
});
