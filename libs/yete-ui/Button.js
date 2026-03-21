class Button extends HTMLElement {
    static get observedAttributes() {
        return ['variant', 'size', 'disabled', 'loading', 'icon', 'icon-position'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._rippleElement = null;
    }

    connectedCallback() {
        this._render();
        this._addEventListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
        }
    }

    _render() {
        const variant = this.getAttribute('variant') || 'contained';
        const size = this.getAttribute('size') || 'medium';
        const disabled = this.hasAttribute('disabled');
        const loading = this.hasAttribute('loading');
        const icon = this.getAttribute('icon');
        const iconPosition = this.getAttribute('icon-position') || 'start';

        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          user-select: none;
        }
        .button {
          font-family: Roboto, sans-serif;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.089em;
          border-radius: 20px; /* Android风格圆角 */
          border: none;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24); /* Android阴影 */
          min-height: 36px;
          padding: 8px 16px;
        }
        .button:hover {
          box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
        }
        .button:active {
          box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
          transform: translateY(1px);
        }
        }
        .button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
        /* 变体样式 */
        .button.contained {
          background: #1976d2; /* Android蓝色 */
          color: white;
        }
        .button.contained:hover {
          background: #1565c0;
        }
        .button.contained:active {
          background: #0d47a1;
        }
        .button.outlined {
          background: transparent;
          color: #1976d2;
          border: 1px solid #1976d2;
        }
        .button.outlined:hover {
          background: rgba(25, 118, 210, 0.04);
        }
        .button.text {
          background: transparent;
          color: #1976d2;
          box-shadow: none;
        }
        .button.text:hover {
          background: rgba(25, 118, 210, 0.04);
        }
        /* 尺寸样式 */
        .button.small { padding: 6px 12px; min-height: 32px; font-size: 12px; }
        .button.medium { padding: 8px 16px; min-height: 36px; font-size: 14px; }
        .button.large { padding: 10px 20px; min-height: 44px; font-size: 16px; }
        /* 波纹效果 */
        .ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          transform: scale(0);
          animation: ripple-animation 0.6s linear;
          pointer-events: none;
        }
        @keyframes ripple-animation {
          to { transform: scale(4); opacity: 0; }
        }
        /* 加载状态 */
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <button class="button ${variant} ${size}" ?disabled="${disabled}">
        ${loading ? '<span class="spinner"></span>' : ''}
        ${!loading && icon && iconPosition === 'start' ? `<span class="icon">${icon}</span>` : ''}
        <slot></slot>
        ${!loading && icon && iconPosition === 'end' ? `<span class="icon">${icon}</span>` : ''}
      </button>
    `;
    }

    _addEventListeners() {
        const button = this.shadowRoot.querySelector('.button');
        button?.addEventListener('click', (e) => this._handleRipple(e));
    }

    _handleRipple(event) {
        if (this.hasAttribute('disabled')) return;

        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);

        this._rippleElement = document.createElement('span');
        this._rippleElement.classList.add('ripple');
        this._rippleElement.style.width = this._rippleElement.style.height = `${size}px`;
        this._rippleElement.style.left = `${event.clientX - rect.left - size / 2}px`;
        this._rippleElement.style.top = `${event.clientY - rect.top - size / 2}px`;

        button.appendChild(this._rippleElement);
        setTimeout(() => this._rippleElement?.remove(), 600);
    }
}

customElements.define("yete-button", Button);