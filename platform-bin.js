'use strict';

module.exports = bin => process.platform === 'win32' ? `${bin}.cmd` : bin;
