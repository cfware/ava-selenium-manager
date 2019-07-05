import {setupTesting} from './_pages.js';

setupTesting(() => {
	return {
		async build() {
			return {
				async get() {
					throw new Error('Simulated browser startup failure');
				}
			};
		}
	};
});
