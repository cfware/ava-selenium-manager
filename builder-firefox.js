'use strict';

const {Builder} = require('selenium-webdriver');
const {Options, ServiceBuilder} = require('selenium-webdriver/firefox');
const {findInPath} = require('selenium-webdriver/io');
const platformBin = require('./platform-bin');

module.exports = () => {
	return new Builder()
		.forBrowser('firefox')
		.setFirefoxOptions(new Options().headless())
		.setFirefoxService(new ServiceBuilder(findInPath(platformBin('geckodriver'))));
};
