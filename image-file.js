'use strict';

const path = require('path');
const test = require('ava');
const artifactDir = require('./artifact-dir');

function imageFile(t, imageID) {
	const dir = artifactDir('images');
	const parts = [
		path.basename(test.meta.file, '.js'),
		path.basename(t.title, '.html')
	];

	if (typeof imageID === 'string') {
		parts.push(imageID);
	}

	return path.join(dir, parts.join('-') + '.png');
}

module.exports = imageFile;
