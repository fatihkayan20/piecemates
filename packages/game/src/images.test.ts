import assert from "node:assert/strict";
import { test } from "node:test";

import {
	imageProblem,
	imageWidth,
	isImageAspect,
	isImageWidth,
	uploadType,
} from "./images.ts";

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

test("a photo must be an allowed type, big enough and not huge", () => {
	const ok = { format: "image/jpeg", width: 800, height: 600 };
	assert.equal(imageProblem(ok), undefined);
	assert.equal(imageProblem({ ...ok, format: "image/svg+xml" }), "notAnImage");
	assert.equal(imageProblem({ ...ok, height: 399 }), "imageTooSmall");
	assert.equal(
		imageProblem({ ...ok, width: 10_000, height: 5001 }),
		"imageTooLarge",
	);
	assert.equal(
		imageProblem({ ...ok, width: 1601, height: 400 }),
		"imageTooNarrow",
	);
	assert.equal(imageProblem({ ...ok, width: 1600, height: 400 }), undefined);
	assert.ok(!isImageAspect(1, 1_000_000_000));
	assert.equal(uploadType("image/png"), "image/png");
	assert.equal(uploadType("image/gif"), undefined);
});
