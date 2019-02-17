'use strict';
/* eslint ava/no-ignored-test-files: ["off"] */
/* global window */
const path = require('path');
const _fs = require('fs');

const test = require('ava');
const {createCoverageMap} = require('istanbul-lib-coverage');
const pify = require('pify');
const makeDir = require('make-dir');

const imageFile = require('./image-file');
const builderFirefox = require('./builder-firefox');
const builderChrome = require('./builder-chrome');

const fs = pify(_fs);

/* istanbul ignore next */
const getBrowserCoverage = () => window.__coverage__;

const globalScope = (new Function('return this'))(); // eslint-disable-line no-new-func
const coverageMap = createCoverageMap();

const pages = [];
let selenium = null;

function skipPages() {
	pages.forEach(({pathname}) => {
		test.skip(pathname, // eslint-disable-line ava/no-skip-test
			/* istanbul ignore next */
			() => {}
		);
	});
}

function initPages(daemonFactory, daemonStop, daemonGetURL) {
	let serializer = Promise.resolve();
	pages.forEach(({pathname, impl}) => {
		async function runTest(t) {
			await serializer;

			Object.assign(t.context, {
				selenium,
				async snapshotImage(element, message) {
					const promise = element.takeScreenshot().catch(
						/* istanbul ignore next */
						() => 'Element screenshot not supported by this browser.'
					);
					const image64 = await promise;

					t.snapshot(`![](data:image/png;base64,${image64})`, message);
				},
				async grabImage(element, imageID) {
					const imageFileName = imageFile(t, imageID);
					try {
						const image64 = await element.takeScreenshot();
						/* istanbul ignore next */
						if (!image64) {
							throw new Error('No image found');
						}

						await makeDir(path.dirname(imageFileName));
						await fs.writeFile(imageFileName, Buffer.from(image64, 'base64'));
					} catch (error) {
						/* If the browser doesn't support capture */
						/* istanbul ignore next */
						await fs.unlink(imageFileName).catch(() => {});
					}
				},
				async checkText(ele, text) {
					t.is(await ele.getText(), text);
				}
			});

			const daemon = await daemonFactory(t);
			await selenium.get(daemonGetURL(t, daemon, pathname));
			await impl(t);

			const coverage = await selenium.executeScript(getBrowserCoverage);
			if (coverage && typeof coverage === 'object') {
				/* Merge coverage object from the browser running this test. */
				coverageMap.merge(coverage);
			}

			daemonStop(daemon);
		}

		test(pathname, async t => {
			await (serializer = runTest(t));
		});
	});

	test.after.always(async () => {
		await selenium.quit();

		/* istanbul ignore else */
		if (globalScope.__coverage__) {
			coverageMap.merge(globalScope.__coverage__);
		}

		globalScope.__coverage__ = coverageMap.toJSON();
	});
}

function setup({browserBuilder, daemonFactory, daemonStop, daemonGetURL}) {
	if (typeof browserBuilder !== 'function' || typeof daemonFactory !== 'function' || typeof daemonGetURL !== 'function') {
		throw new TypeError('Invalid arguments');
	}

	if (selenium) {
		throw new Error('Already have a selenium session');
	}

	if (pages.length === 0) {
		throw new Error('No pages declared');
	}

	try {
		selenium = browserBuilder().build();
		if (!selenium) {
			throw new Error('Missing selenium');
		}

		/* Verify the browser can start */
		selenium.get('data:text/plain,')
			.then(() => { // eslint-disable-line promise/prefer-await-to-then
				initPages(daemonFactory, daemonStop, daemonGetURL);
			})
			.catch(skipPages);
	} catch (error) {
		/* Failed to build the browser. */
		skipPages();
	}
}

function page(pathname, impl) {
	pages.push({pathname, impl});
}

module.exports = {
	setup,
	page,
	builderChrome,
	builderFirefox
};
