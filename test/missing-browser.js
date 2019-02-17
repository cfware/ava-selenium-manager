import {setupTesting} from './helpers/pages';

setupTesting(() => {
	return {
		build() {
			return {
				async get() {
					throw new Error('Simulated browser startup failure');
				}
			};
		}
	};
});
