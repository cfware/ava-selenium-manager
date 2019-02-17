'use strict';

const {Builder} = require('selenium-webdriver');
const {Options, ServiceBuilder} = require('selenium-webdriver/chrome');
const {findInPath} = require('selenium-webdriver/io');
const platformBin = require('./platform-bin');

module.exports = () => {
	return new Builder()
		.forBrowser('chrome')
		.setChromeOptions(new Options().headless())
		.setChromeService(new ServiceBuilder(findInPath(platformBin('chromedriver'))));
};
