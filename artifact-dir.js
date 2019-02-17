'use strict';

const path = require('path');
const test = require('ava');

const testCWD = process.cwd();
const testDir = path.dirname(test.meta.file);

function artifactDir(artifactType) {
	const parts = new Set(path.relative(testCWD, testDir).split(path.sep));
	if (parts.has('__tests__')) {
		return path.join(testDir, `__${artifactType}__`);
	}

	if (parts.has('test')) {
		return path.join(testDir, artifactType);
	}

	return testDir;
}

module.exports = artifactDir;
