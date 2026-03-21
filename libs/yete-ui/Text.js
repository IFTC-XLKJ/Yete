class Text extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    color: var(--text-color, #757575);
                    user-select: none;
                }
            </style>
            <slot></slot>
        `;
    }
}

customElements.define('yete-text', Text);