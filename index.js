'use strict';
/* eslint ava/no-ignored-test-files: 0 */
/* eslint promise/prefer-await-to-then: 0 */
/* global window */
const path = require('path');
const {promises: fs} = require('fs');

const test = require('ava');
const {createCoverageMap} = require('istanbul-lib-coverage');
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
	for (const {pathname} of pages) {
		test.skip(pathname, // eslint-disable-line ava/no-skip-test
			/* istanbul ignore next */
			() => {}
		);
	}
}

async function seleniumBuilt(inst) {
	/* Verify the browser can start */
	await selenium.get('data:text/plain,');
	initPages(inst);
}

function normalizePNG(image64) {
	return PNG.sync.write(PNG.sync.read(Buffer.from(image64, 'base64')));
}

function initPages(inst) {
	for (const {pathname, impl} of pages) {
		test.serial(pathname, async t => {
			Object.assign(t.context, {
				selenium,
				async snapshotImage(element, message) {
					try {
						const image64 = normalizePNG(await element.takeScreenshot()).toString('base64');

						t.snapshot(`![](data:image/png;base64,${image64})`, message);
					} catch (_) {
						/* istanbul ignore next */
						t.log('Could not retrieve screenshot of element.');
					}
				},
				async grabImage(element, imageID) {
					const imageFileName = imageFile(t, imageID);
					try {
						const image64 = normalizePNG(await element.takeScreenshot());

						await fs.mkdir(path.dirname(imageFileName), {recursive: true});
						await fs.writeFile(imageFileName, image64);
					} catch (_) {
						/* If the browser doesn't support capture */
						/* istanbul ignore next */
						await fs.unlink(imageFileName).catch(() => {});
						/* istanbul ignore next */
						t.log('Could not retrieve screenshot of element.');
					}
				},
				async checkText(ele, text) {
					t.is(await ele.getText(), text);
				}
			});

			const daemon = await inst.daemonFactory();
			await selenium.get(inst.daemonGetURL(daemon, pathname));
			await impl(t);

			const coverage = await selenium.executeScript(getBrowserCoverage);
			if (coverage && typeof coverage === 'object') {
				/* Merge coverage object from the browser running this test. */
				coverageMap.merge(coverage);
			}

			inst.daemonStop(daemon);
		});
	}

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

	selenium = inst.browserBuilder().build();
	if (!selenium || !selenium.then) {
		skipPages();

		return;
	}

	selenium.then(() => seleniumBuilt(inst)).catch(skipPages);
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
