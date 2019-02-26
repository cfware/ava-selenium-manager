'use strict';
/* eslint ava/no-ignored-test-files: ["off"] */
/* global window */
const path = require('path');
const fs = require('fs');
const {promisify} = require('util');

const test = require('ava');
const {createCoverageMap} = require('istanbul-lib-coverage');
const makeDir = require('make-dir');
const {PNG} = require('pngjs');

const imageFile = require('./image-file');
const builderFirefox = require('./builder-firefox');
const builderChrome = require('./builder-chrome');

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

function normalizePNG(image64) {
	return PNG.sync.write(PNG.sync.read(Buffer.from(image64, 'base64')));
}

function initPages(inst) {
	pages.forEach(({pathname, impl}) => {
		test.serial(pathname, async t => {
			Object.assign(t.context, {
				selenium,
				async snapshotImage(element, message) {
					try {
						const image64 = normalizePNG(await element.takeScreenshot()).toString('base64');

						t.snapshot(`![](data:image/png;base64,${image64})`, message);
					} catch (error) {
						/* istanbul ignore next */
						t.log('Could not retrieve screenshot of element.');
					}
				},
				async grabImage(element, imageID) {
					const imageFileName = imageFile(t, imageID);
					try {
						const image64 = normalizePNG(await element.takeScreenshot());

						await makeDir(path.dirname(imageFileName));
						await promisify(fs.writeFile)(imageFileName, image64);
					} catch (error) {
						/* If the browser doesn't support capture */
						/* istanbul ignore next */
						await promisify(fs.unlink)(imageFileName).catch(() => {});
						/* istanbul ignore next */
						t.log('Could not retrieve screenshot of element.');
					}
				},
				async checkText(ele, text) {
					t.is(await ele.getText(), text);
				}
			});

			const daemon = await inst.daemonFactory(t);
			await selenium.get(inst.daemonGetURL(t, daemon, pathname));
			await impl(t);

			const coverage = await selenium.executeScript(getBrowserCoverage);
			if (coverage && typeof coverage === 'object') {
				/* Merge coverage object from the browser running this test. */
				coverageMap.merge(coverage);
			}

			inst.daemonStop(daemon);
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

function setup(inst) {
	if (typeof inst.browserBuilder !== 'function' || typeof inst.daemonFactory !== 'function' || typeof inst.daemonGetURL !== 'function') {
		throw new TypeError('Invalid instance');
	}

	if (selenium) {
		throw new Error('Already have a selenium session');
	}

	if (pages.length === 0) {
		throw new Error('No pages declared');
	}

	try {
		selenium = inst.browserBuilder().build();
		if (!selenium) {
			throw new Error('Missing selenium');
		}

		/* Verify the browser can start */
		selenium.get('data:text/plain,')
			.then(() => { // eslint-disable-line promise/prefer-await-to-then
				initPages(inst);
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
