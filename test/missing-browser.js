import {setupTesting} from './helpers/pages';

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
