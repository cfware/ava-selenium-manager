customElements.define('this-test', class extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({mode: 'open'}).innerHTML = `
			<style>
				:host {
					display: inline-block;
					width: 50px;
					height: 50px;
					background: red
				}
			</style>
		`;
	}
});
