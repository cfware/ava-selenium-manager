import test from 'ava';
import seleniumManager from '..';

test('proper exports', t => {
	const fns = ['setup', 'page', 'builderChrome', 'builderFirefox'];

	t.is(typeof seleniumManager, 'object');
	t.deepEqual(Object.keys(seleniumManager).sort(), fns.sort());
	t.true(fns.every(fn => typeof seleniumManager[fn] === 'function'));
});

test('setup errors', t => {
	const browserBuilder = () => {};
	const daemonFactory = () => {};
	const daemonGetURL = () => {};

	t.throws(() => seleniumManager.setup({browserBuilder, daemonFactory}), 'Invalid instance');
	t.throws(() => seleniumManager.setup({browserBuilder, daemonGetURL}), 'Invalid instance');
	t.throws(() => seleniumManager.setup({daemonFactory, daemonGetURL}), 'Invalid instance');
	t.throws(() => seleniumManager.setup({browserBuilder, daemonFactory, daemonGetURL}), 'No pages declared');
});
