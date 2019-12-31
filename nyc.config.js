'use strict';

module.exports = require('@cfware/nyc')
	.exclude('!fixtures/*.js')
	.fullCoverage();
