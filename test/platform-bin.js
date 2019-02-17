import test from 'ava';
import platformBin from '../platform-bin';

function platformTest(t, testPlatform) {
	const {platform} = process;
	Object.defineProperty(process, 'platform', {
		value: testPlatform
	});

	t.is(platformBin('test-bin'), testPlatform === 'win32' ? 'test-bin.cmd' : 'test-bin');

	Object.defineProperty(process, 'platform', {
		value: platform
	});
}

test.serial('platformBin for linux', platformTest, 'linux');
test.serial('platformBin for mac', platformTest, 'mac');
test.serial('platformBin for win32', platformTest, 'win32');
