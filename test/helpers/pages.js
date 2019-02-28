import path from 'path';

import fastify from 'fastify';
import fastifyStatic from 'fastify-static';
import fastifyBabel from 'fastify-babel';
import hasha from 'hasha';

import {setup, page} from '../..';
import imageFile from '../../image-file';

const rootDir = path.resolve(__dirname, '..', '..');

page('check-text.html', async t => {
	const {selenium, checkText} = t.context;
	const ele = await selenium.findElement({id: 'test'});

	await checkText(ele, 'This is a test!');

	t.throws(() => setup({
		browserBuilder() {},
		daemonFactory() {},
		daemonGetURL() {}
	}), 'Already have a selenium session');
});

page('check-image.html', async t => {
	const {selenium, snapshotImage, grabImage} = t.context;
	const ele = await selenium.findElement({id: 'test'});

	await snapshotImage(ele, 'Image Snapshot');

	await grabImage(ele, 'image-id');
	t.snapshot(await hasha.fromFile(imageFile(t, 'image-id')), 'with image-id');

	await grabImage(ele);
	t.snapshot(await hasha.fromFile(imageFile(t)), 'without image-id');
});

export function setupTesting(browserBuilder) {
	setup({
		browserBuilder,
		async daemonFactory() {
			const daemon = fastify()
				.register(fastifyStatic, {
					root: path.resolve(rootDir, 'test', 'fixtures'),
					prefix: '/test'
				})
				.register(fastifyBabel, {
					babelrc: {
						babelrc: false,
						configFile: false,
						plugins: ['istanbul']
					},
					maskError: false
				});

			await daemon.listen(0);

			return daemon;
		},
		daemonStop(daemon) {
			daemon.server.unref();
		},
		daemonGetURL(daemon, pathname) {
			return `http://localhost:${daemon.server.address().port}/test/${pathname}`;
		}
	});
}
