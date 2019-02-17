import path from 'path';
import test from 'ava';
import artifactDir from './artifact-dir';

test('artifact-dir outside of test and __tests__', t => {
	t.is(artifactDir('image'), path.resolve(__dirname));
});
