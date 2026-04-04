/**
 * 自定义错误类
 */
class YeteError extends Error {
    /**
     * 构造函数
     * @param {String} message 错误信息
     * @example new YeteError("Something went wrong.");
     */
    constructor(message) {
        super(message);
        this.name = 'YeteError';
    }
}
/**
 * 检查浏览器兼容性
 * @throws {YeteError} 如果不兼容或无法判断则抛出错误
 */
(function checkBrowserCompatibility() {
    const ua = navigator.userAgent;
    let browser = null;
    let version = 0;
    if (/Edg\/(\d+)/.test(ua)) {
        browser = 'Edge';
        version = parseInt(ua.match(/Edg\/(\d+)/)[1], 10);
    } else if (/Chrome\/(\d+)/.test(ua) && !/Chromium/.test(ua)) {
        browser = 'Chrome';
        version = parseInt(ua.match(/Chrome\/(\d+)/)[1], 10);
    } else if (/Firefox\/(\d+)/.test(ua)) {
        browser = 'Firefox';
        version = parseInt(ua.match(/Firefox\/(\d+)/)[1], 10);
    } else if (/Version\/(\d+)/.test(ua) && /Safari/.test(ua)) {
        browser = 'Safari';
        version = parseInt(ua.match(/Version\/(\d+)/)[1], 10);
    }
    console.log(browser, version);
    const minVersions = {
        'Chrome': 87,
        'Firefox': 140,
        'Safari': 18.4,
        'Edge': 87
    };
    let isCompatible = false;
    if (browser && minVersions[browser] !== undefined) {
        if (version >= minVersions[browser]) {
            isCompatible = true;
        }
    }
    if (!isCompatible) {
        const msg = browser
            ? `您的浏览器版本过低 (${browser} ${version})，请使用 Chrome 71+, Firefox 69+, Safari 12.1+ 或 Edge 79+。`
            : `无法识别您的浏览器环境，请使用现代浏览器 (Chrome, Firefox, Safari, Edge)。`;

        alert(msg);
        console.error(new YeteError('Browser incompatible'));
    }
})();
/**
 * 页面基类
 * @example
 * class MyPage extends Page {
 *   constructor() {
 *     super("my-page");
 *   }
 *   render() {
 *     return document.createElement('div', { className: 'page' });
 *   }
 * }
 */
class Page {
    /**
     * 构造函数
     * @param {String} name 
     * @example
     * new Page("my-page");
     */
    constructor(name) {
        this.name = name;
    }
    /**
     * 渲染页面
     * @returns {HTMLElement}
     * @example
     * return document.createElement('div', { className: 'page' });
     */
    render() {
        return document.createElement('div', { className: 'page' });
    }
}

/**
 * 页面数组
 * @property {Page} page 页面对象
 */
const pages = [];
/**
 * 路由数组
 * @property {String} path 路径
 * @property {HTMLElement} page 页面
 */
const routes = [];
/**
 * 事件数组
 * @property {String} name 事件名称
 * @property {Function} callback 回调函数
 */
const events = [];
let isStarted = false;

let custom404Page = null;
let custom502Page = null;

let searchParams = new URLSearchParams("");

const hostname = location.hostname;

/**
 * 导出的对象
 */
const obj = {
    /**
     * 设置页面图标
     * @param {String} iconPath 
     * @returns 
     * @throws {YeteError}
     * @example
     * setIcon("icon.png");
     */
    setIcon: function (iconPath) {
        const fileType = getFileType(iconPath);
        if (!fileType.startsWith('image/')) {
            throw new YeteError("The icon path must be a valid image file.");
        }
        const iconLink = document.querySelector('link[rel="icon"]');
        if (iconLink) {
            iconLink.href = iconPath;
            iconLink.type = fileType;
        } else {
            const newIconLink = document.createElement('link');
            newIconLink.rel = 'icon';
            newIconLink.href = iconPath;
            newIconLink.type = fileType;
            document.head.appendChild(newIconLink);
        }
    },
    /**
     * 设置页面标题
     * @param {String} title 
     * @throws {YeteError}
     * @example
     * setTitle("Yete");
     */
    setTitle: function (title) {
        document.title = title;
    },
    /**
     * 配置路由
     * @param {Array<Object>} options
     * @property {String} path 路径
     * @property {HTMLElement} page 页面
     * @example 
     * options: [
     *   { path: '/', page: () => loadPage(HomePage) },
     *   { path: '/about', page: () => loadPage(AboutPage) }
     * ]
     */
    route: function (options) {
        console.log(options);
        routes.push(...options);
    },
    /**
     * 页面基类
     * @example
     * class MyPage extends Page {
     *   constructor() {
     *     super("my-page");
     *   }
     *   render() {
     *     return document.createElement('div', { className: 'page' });
     *   }
     * }
     */
    Page: Page,
    /**
     * 加载组件
     * @param {Page} page 
     * @returns {HTMLElement}
     * @throws {YeteError}
     * @example
     * loadPage(MyPage);
     */
    loadPage: function (page) {
        console.log(page);
        const p = new page();
        if (p instanceof Page) {
            pages.push(p);
            return p.render();
        }
        throw new YeteError("The page must be an instance of Page.");
    },
    /**
     * 启动程序
     * @description 该方法只能调用一次
     * @throws {YeteError}
     * @example
     * start();
     */
    start: function () {
        if (isStarted) {
            throw new YeteError("The program has already started.");
        }
        if (!routes.some(r => r.path === '/')) {
            throw new YeteError("The route must contain a path '/'.");
        }
        isStarted = true;
        const path = location.hash.slice(1) || '/';
        obj.toPage(path);
    },
    /**
     * 加载 CSS 文件
     * @param {String} cssPath 
     * @returns {Promise<void>}
     * @example
     * await loadCSS("index.css");
     */
    loadCSS: async function (cssPath) {
        return new Promise(async (resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            const cssFile = await YeteDB.files.get({ name: cssPath });
            link.href = URL.createObjectURL(cssFile.blob);
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    },
    /**
     * 加载 JS 文件
     * @param {String} scriptPath 
     * @returns {Promise<void>}
     * @example
     * await loadScript("index.js");
     */
    loadScript: async function (scriptPath) {
        return new Promise(async (resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            const scriptFile = await YeteDB.files.get({ name: scriptPath });
            script.src = URL.createObjectURL(scriptFile.blob);
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    },
    /**
     * 跳转到指定页面
     * @param {String} path 
     * @param {String} message
     * @throws {YeteError}
     * @example
     * toPage('/about');
     */
    toPage: function (path, message = null) {
        location.hash = path;
        const page = routes.find(r => r.path === path);
        console.log(pages, page);
        if (page) {
            document.body.innerHTML = "";
            document.body.appendChild(page.page);
            obj.emit('page-change', new obj.YeteEvent("page-change", { path, isNotFound: false, message }));
        } else {
            if (custom404Page) {
                document.body.innerHTML = "";
                document.body.appendChild(custom404Page);
                obj.emit('page-change', new obj.YeteEvent("page-change", { path, isNotFound: true }));
                return;
            }
            document.body.innerHTML = "<center><h1>404 Not Found</h1><p>Power By Yete</p></center>";
            obj.emit('page-change', new obj.YeteEvent("page-change", { path, isNotFound: true }));
            console.error(new YeteError("The page not found."));
        }
    },
    /**
     * 创建 UI 元素
     * @param {String} tag 
     * @param {Object} options 
     * @returns {HTMLElement}
     * @example
     * const button = newElement('Text', { className: 'btn', textContent: 'Click Me' });
     */
    newElement: function (tag, options = {}) {
        if (!UIElements[tag]) {
            throw new YeteError(`The element ${tag} not found.`);
        }
        const element = document.createElement(UIElements[tag].html);
        const style = UIElements[tag].style;
        if (style) {
            for (const key in style) {
                element.style[key] = style[key];
            }
        }
        for (const key in options) {
            element[key] = options[key];
        }
        return element;
    },
    /**
     * 添加事件监听器
     * @param {String} type 
     * @param {Function} listener 
     * @example
     * addEventListener('click', () => console.log('Clicked'));
     */
    addEventListener: function (type, listener) {
        events.push({ type, listener });
    },
    /**
     * 移除事件监听器
     * @param {String} type 
     * @param {Function} listener 
     * @example
     * removeEventListener('click', () => console.log('Clicked'));
     */
    removeEventListener: function (type, listener) {
        const index = events.findIndex(e => e.type === type && e.listener === listener);
        if (index !== -1) {
            events.splice(index, 1);
        }
    },
    /**
     * 派发事件
     * @param {String} type 
     * @param {Object} event 
     * @example
     * dispatchEvent('click', new YeteEvent("click", { bubbles: true, cancelable: true }));
     */
    dispatchEvent: function (type, event) {
        events.forEach(e => {
            if (e.type === type) {
                e.listener(event);
            }
        });
    },
    /**
     * 创建事件
     * @param {String} type 
     * @param {Object} options
     * @returns {YeteEvent}
     * @example
     * const event = new YeteEvent("click", { bubbles: true, cancelable: true });
     */
    YeteEvent: class extends Event {
        /**
         * 构造函数
         * @param {String} type 
         * @param {Object} options 
         * @example
         * const event = new YeteEvent("click", { bubbles: true, cancelable: true });
         */
        constructor(type, options) {
            super(type, { bubbles: true, cancelable: true });
            for (const key in options) {
                this[key] = options[key];
            }
        }
    },
    /**
     * 获取绑定的元素
     * @returns {NodeList}
     * @example
     * const elements = getBinding();
     */
    getBinding: function () {
        const elementsWithId = document.querySelectorAll('[yete-id]');
        return elementsWithId;
    },
    /**
     * 自定义 404 页面
     * @description 当页面不存在时，会显示此页面
     * @param {Page} page
     * @example
     * custom404(Custom404Page);
     */
    custom404: function (page = null) {
        if (!page) {
            custom404Page = null;
            return;
        }
        const p = new page();
        if (p instanceof Page) {
            custom404Page = p.page;
        } else {
            throw new YeteError("The page not found.");
        }
    },
    /**
     * 自定义 502 错误页面
     * @description 当页面有未捕获的错误被抛出时，会显示此页面
     * @param {Page} page
     * @example
     * custom502(Custom502Page);
     */
    custom502: function (page = null) {
        if (!page) {
            custom502Page = null;
            return;
        }
        const p = new page();
        if (p instanceof Page) {
            custom502Page = p.page;
        } else {
            throw new YeteError("The page not found.");
        }
    },
    /**
     * HTTP 请求
     * @description HTTP 请求封装，提供更便捷的方式进行 HTTP 请求
     * @example 
     * const res = await HTTP.GET("https://example.com");
     * const data = await res.json();
     */
    HTTP: class {
        constructor() { }
        /**
         * GET 请求
         * @param {String} url 
         * @param {Object} headers 
         * @returns {Promise<Response>}
         * @example
         * const res = await HTTP.GET("https://example.com");
         * const data = await res.json();
         */
        static async GET(url, headers = {}) {
            return await fetch(url, { headers });
        }
        /**
         * POST 请求
         * @param {String} url 
         * @param {Object} body 
         * @param {Object} headers 
         * @returns {Promise<Response>}
         * @example
         * const res = await HTTP.POST("https://example.com", { name: "Yete" });
         * const data = await res.json();
         */
        static async POST(url, body, headers = {}) {
            return await fetch(url, { method: "POST", body, headers });
        }
        /**
         * PUT 请求
         * @param {String} url 
         * @param {Object} body 
         * @param {Object} headers 
         * @returns {Promise<Response>}
         * @example
         * const res = await HTTP.PUT("https://example.com", { name: "Yete" });
         * const data = await res.json();
         */
        static async PUT(url, body, headers = {}) {
            return await fetch(url, { method: "PUT", body, headers });
        }
        /**
         * DELETE 请求
         * @param {String} url 
         * @param {Object} headers 
         * @returns {Promise<Response>}
         * @example
         * const res = await HTTP.DELETE("https://example.com");
         * const data = await res.json();
         */
        static async DELETE(url, headers = {}) {
            return await fetch(url, { method: "DELETE", headers });
        }
        /**
         * PATCH 请求
         * @param {String} url 
         * @param {Object} body 
         * @param {Object} headers 
         * @returns {Promise<Response>}
         * @example
         * const res = await HTTP.PATCH("https://example.com", { name: "Yete" });
         * const data = await res.json();
         */
        static async PATCH(url, body, headers = {}) {
            return await fetch(url, { method: "PATCH", body, headers });
        }
        /**
         * HEAD 请求
         * @param {String} url 
         * @param {Object} headers 
         * @returns {Promise<Response>}
         * @example
         * const res = await HTTP.HEAD("https://example.com");
         * const data = await res.json();
         */
        static async HEAD(url, headers = {}) {
            return await fetch(url, { method: "HEAD", headers });
        }
        /**
         * OPTIONS 请求
         * @param {String} url 
         * @param {Object} headers 
         * @returns {Promise<Response>}
         * @example
         * const res = await HTTP.OPTIONS("https://example.com");
         * const data = await res.json();
         */
        static async OPTIONS(url, headers = {}) {
            return await fetch(url, { method: "OPTIONS", headers });
        }
        /**
         * TRACE 请求
         * @param {String} url 
         * @param {Object} headers 
         * @returns {Promise<Response>}
         * @example
         * const res = await HTTP.TRACE("https://example.com");
         * const data = await res.json();
         */
        static async TRACE(url, headers = {}) {
            return await fetch(url, { method: "TRACE", headers });
        }
        /**
         * CONNECT 请求
         * @param {String} url 
         * @param {Object} headers 
         * @returns {Promise<Response>}
         * @example
         * const res = await HTTP.CONNECT("https://example.com");
         * const data = await res.json();
         */
        static async CONNECT(url, headers = {}) {
            return await fetch(url, { method: "CONNECT", headers });
        }
        /**
         * 读取流
         * @param {Response} response 
         * @param {Function} callback 
         * @returns {Promise<void>}
         * @example
         * await HTTP.readStream(res, ({ chunk, done }) => { console.log(done, chunk); });
         */
        static async readStream(response, callback = ({ chunk, done }) => { console.log(done, chunk); }) {
            if (!response.ok) {
                throw new YeteError("Response is not ok.");
            }
            if (!response.body) {
                throw new YeteError("Response body is not available.");
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        const finalChunk = decoder.decode();
                        callback({ chunk: finalChunk || null, done: true });
                        break;
                    }
                    const chunk = decoder.decode(value, { stream: true });
                    callback({ chunk, done: false });
                }
            } catch (error) {
                throw new YeteError(`Stream reading failed: ${error.message}`);
            } finally {
                reader.releaseLock();
            }
        }
        /**
         * 读取响应体
         * @param {Response} response 
         * @param {String} type 
         * @returns {Promise<any>}
         * @example
         * const data = await HTTP.readBody(res);
         */
        static async readBody(response, type = "text") {
            if (!response.ok) {
                throw new YeteError("Response is not ok.");
            }
            if (!response.body) {
                throw new YeteError("Response body is not available.");
            }
            switch (type) {
                case "text":
                    return await response.text();
                case "json":
                    return await response.json();
                case "blob":
                    return await response.blob();
                case "arrayBuffer":
                    return await response.arrayBuffer();
                case "formData":
                    return await response.formData();
                default:
                    throw new YeteError("Invalid type.");
            }
        }
        /**
         * 读取响应头
         * @param {Response} response 
         * @returns {Promise<Headers>}
         * @example
         * const headers = await HTTP.readHeaders(res);
         */
        static async readHeaders(response) {
            return response.headers;
        }
    },
    /**
     * 获取 URL 参数
     * @example
     * const params = searchParams;
     */
    searchParams: function () {
        return searchParams;
    },
    /**
     * 加载 UI
     * @description 可通过 URL 或 XML 字符串加载 UI
     * @param {String} str 
     * @returns {Promise<HTMLElement>}
     * @example
     * await loadUI("https://example.com/ui.xml");
     * await loadUI(`<Yete><Text>Hello World</Text></Yete>`);
     */
    loadUI: async function (str) {
        let isURL = false;
        try {
            new URL(str);
            isURL = true;
        } catch { }
        if (isURL) {
            const res = await fetch(str);
            const text = await res.text();
            return loadUI(text);
        } else {
            return loadUI(str);
        }
    },
    /**
     * 认证管理类
     * @description 提供用户认证、令牌管理、授权验证等功能
     */
    Auth: class {
        /**
         * 构造函数
         * @param {Object} options 配置选项
         * @property {String} apiBaseUrl API 基础地址
         * @property {String} tokenKey localStorage 中存储 token 的键名
         */
        constructor(options = {}) {
            this.apiBaseUrl = options.apiBaseUrl || 'https://iftc.koyeb.app/api/auth';
            this.tokenKey = options.tokenKey || 'auth_token';
            this.checkInterval = options.checkInterval || 2000;
            this.onAuthSuccess = options.onAuthSuccess || null;
            this.onAuthFail = options.onAuthFail || null;
        }

        /**
         * 获取存储的 auth_token
         * @returns {String|null}
         * @example
         * const token = auth.getAuthToken();
         */
        getAuthToken() {
            return localStorage.getItem(this.tokenKey);
        }

        /**
         * 设置存储的 auth_token
         * @param {String} token 
         * @example
         * auth.setAuthToken('your_token_here');
         */
        setAuthToken(token) {
            localStorage.setItem(this.tokenKey, token);
        }

        /**
         * 清除存储的 auth_token
         * @example
         * auth.clearAuthToken();
         */
        clearAuthToken() {
            localStorage.removeItem(this.tokenKey);
        }

        /**
         * 检查是否已授权
         * @returns {Promise<Boolean>}
         * @example
         * if (auth.isAuthorized()) { ... }
         */
        async isAuthorized() {
            return !!await cookieStore.get("ID");
        }

        /**
         * 获取授权链接
         * @param {String} redirectUrl 回调地址
         * @returns {String}
         * @example
         * const url = auth.getAuthUrl(location.href);
         */
        getAuthUrl(redirectUrl) {
            return `${this.apiBaseUrl}/token?redirect=${encodeURIComponent(redirectUrl)}`;
        }

        /**
         * 发起授权请求
         * @description 跳转到授权页面
         * @param {String} redirectUrl 回调地址
         * @example
         * auth.requestAuth(location.href);
         */
        async requestAuth(redirectUrl) {
            const url = this.getAuthUrl(redirectUrl);
            const response = await fetch(url);
            const json = await response.json();

            if (json.code !== 200) {
                throw new YeteError(json.msg || '获取授权令牌失败');
            }

            this.setAuthToken(json.data.token);
            location.href = json.data.url;
            return json;
        }

        /**
         * 验证 auth_token 有效性
         * @param {String} token 可选，不传则使用存储的 auth_token
         * @returns {Promise<Boolean>}
         * @example
         * const isValid = await auth.verify();
         */
        async verify(token = null) {
            const targetToken = token || this.getAuthToken();

            if (!targetToken) {
                throw new YeteError('未找到授权令牌');
            }

            const response = await fetch(`${this.apiBaseUrl}/verify?token=${targetToken}`);
            const json = await response.json();

            if (json.code === 200) {
                await this.setCookie('ID', json.data.id, 365);
                localStorage.setItem("ID", json.data.id);
                return true;
            }

            return false;
        }
        /**
         * 设置 cookie
         * @param {String} name 键名
         * @param {String} value 键值
         * @param {Number} days 过期天数
         */
        async setCookie(name, value, days = 1) {
            const expires = new Date();
            expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

            try {
                console.log(location.hostname);
                await cookieStore.set({
                    name,
                    value,
                    expires: expires.toISOString(),
                    path: '/',
                    domain: hostname,
                    secure: true
                });
            } catch (error) {
                console.warn('cookieStore not supported, falling back to document.cookie');
                document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/`;
            }
        }

        /**
         * 获取 cookie
         * @param {String} name 键名
         * @returns {String|null}
         */
        async getCookie(name) {
            try {
                const cookies = await cookieStore.get(name);
                return cookies ? cookies.value : null;
            } catch (error) {
                // 如果 cookieStore 不支持，降级到 document.cookie
                console.warn('cookieStore not supported, falling back to document.cookie');
                return this.getCookieFromDocument(name);
            }
        }

        /**
         * 从 document.cookie 获取 cookie（备用方案）
         * @param {String} name 键名
         * @returns {String|null}
         */
        getCookieFromDocument(name) {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) {
                    return c.substring(nameEQ.length, c.length);
                }
            }
            return null;
        }

        /**
         * 获取用户 ID
         * @returns {String|null}
         */
        getUserId() {
            return localStorage.getItem("ID");
        }

        /**
         * 检查授权状态并等待授权完成
         * @param {Function} callback 授权成功后的回调
         * @param {Number} timeout 超时时间（毫秒）
         * @returns {Promise<Object>}
         * @example
         * await auth.waitForAuth((userInfo) => {
         *     console.log('用户 ID:', userInfo.id);
         * });
         */
        async waitForAuth(callback, timeout = 60000) {
            const url = new URL(location.href);
            const authParam = url.searchParams.get('auth');

            if (!authParam) {
                throw new YeteError('缺少 auth 参数');
            }

            return new Promise((resolve, reject) => {
                const startTime = Date.now();
                const intervalId = setInterval(async () => {
                    // 检查超时
                    if (Date.now() - startTime > timeout) {
                        clearInterval(intervalId);
                        reject(new YeteError('授权超时'));
                        return;
                    }

                    try {
                        const json = await this.verify();
                        if (json.code === 200) {
                            clearInterval(intervalId);
                            if (callback) callback(json.data);
                            if (this.onAuthSuccess) this.onAuthSuccess(json.data);
                            resolve(json);
                        }
                    } catch (error) {
                        console.error('验证失败:', error);
                    }
                }, this.checkInterval);
            });
        }

        /**
         * 处理授权回调
         * @description 在授权回调页面调用此方法
         * @param {Function} successCallback 授权成功回调
         * @param {Function} failCallback 授权失败回调
         * @example
         * auth.handleAuthCallback((userInfo) => {
         *     document.write('授权成功，用户 ID: ' + userInfo.id);
         * });
         */
        async handleAuthCallback(successCallback, failCallback) {
            const url = new URL(location.href);
            const authParam = url.searchParams.get('auth');

            if (!authParam) {
                return;
            }

            try {
                const result = await this.waitForAuth(successCallback);
                if (successCallback) {
                    successCallback(result.data);
                }
            } catch (error) {
                console.error('授权失败:', error);
                if (failCallback) {
                    failCallback(error);
                }
                if (this.onAuthFail) {
                    this.onAuthFail(error);
                }
            }
        }

        /**
         * 获取用户信息
         * @returns {Promise<Object>}
         * @example
         * const userInfo = await auth.getUserInfo();
         */
        async getUserInfo() {
            const res = await fetch(`${this.apiBaseUrl}/api/user/details?ID=${this.getUserId()}`);
        }

        /**
         * 登出
         * @example
         * auth.logout();
         */
        logout() {
            this.clearAuthToken();
            location.reload();
        }
    },
};

/**
 * 生成哈希值
 * @description 与Java的用法一致
 * @returns {Number}
 * @example
 * const hash = 'hello world'.hashCode();
 */
String.prototype.hashCode = function () {
    let hash = 0;
    for (let i = 0; i < this.length; i++) {
        const char = this.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return hash;
};

/**
 * 将任意进制的数字转换为十进制(支持小数)
 * @param {Number} fromRadix - 源进制 (2-36)
 * @param {Number} toRadix - 目标进制 (2-36)
 * @returns {String} - 转换后的目标进制的字符串
 * @example
 * const result = "10.1".convertBase(2, 10); // 二进制 "10.1" 转换为十进制 "2.5"
 */
String.prototype.convertBase = function (fromRadix = 10, toRadix = 10) {
    return convertBase(this, fromRadix, toRadix);
};

/**
 * 将任意进制的数字转换为另一种进制的数字
 * @param {string} numStr - 输入的数字字符串（例如 "10.1"）
 * @param {number} fromRadix - 源进制 (2-36)
 * @param {number} toRadix - 目标进制 (2-36)
 * @returns {string} - 转换后的字符串
 */
function convertBase(numStr, fromRadix, toRadix) {
    if (fromRadix < 2 || fromRadix > 36 || toRadix < 2 || toRadix > 36) {
        throw new YeteError("进制必须在 2 到 36 之间");
    }
    const decimalValue = convertToDecimal(numStr, fromRadix);
    return decimalValue.toString(toRadix);
}

/**
 * 将任意进制（2-36）的字符串转换为十进制数字（支持小数）
 * @param {string} str - 输入的数字字符串 (例如 "10.1")
 * @param {number} radix - 进制数 (例如 2, 8, 16)
 * @returns {number} - 转换后的十进制数
 */
function convertToDecimal(str, radix) {
    if (radix < 2 || radix > 36) {
        throw new YeteError("进制必须在 2 到 36 之间");
    }
    const input = str.toLowerCase();
    const parts = input.split('.');
    const integerPart = parts[0];
    const fractionalPart = parts[1] || '';
    let result = 0;
    let isNegative = input.startsWith('-');
    if (integerPart && integerPart !== '-') {
        const cleanInt = integerPart.replace('-', '');
        result = parseInt(cleanInt, radix);
        if (isNaN(result)) {
            throw new YeteError(`整数部分 "${integerPart}" 包含非法字符`);
        }
    }
    let fractionValue = 0;
    for (let i = 0; i < fractionalPart.length; i++) {
        const char = fractionalPart[i];
        const digitValue = parseInt(char, 36);
        if (isNaN(digitValue) || digitValue >= radix) {
            throw new YeteError(`小数部分 "${char}" 超出了进制 ${radix} 的范围`);
        }
        fractionValue += digitValue * Math.pow(radix, -(i + 1));
    }
    result = result + fractionValue;
    if (isNegative) {
        result = -result;
    }
    return result;
}

/**
 * 响应事件监听
 */
Response.prototype.events = {};
/**
 * 是否正在监听响应事件
 */
Response.prototype.listening = false;
/**
 * 添加响应事件监听
 * @param {string} eventName 事件名
 * @param {function} callback 回调函数
 * @example
 * response.on('eventName', function() {})
 */
Response.prototype.on = function (eventName, callback) {
    if (!this.events[eventName]) {
        this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
};
/**
 * 触发事件
 * @param {string} eventName 事件名
 * @param {...any} args 参数
 * @example
 * response.emit('eventName', '参数1', '参数2', ...);
 */
Response.prototype.emit = function (eventName, ...args) {
    if (this.events[eventName]) {
        this.events[eventName].forEach(callback => callback(...args));
    }
};
/**
 * 移除事件监听
 * @param {string} eventName 事件名
 * @param {Function} callback 回调函数
 * @example
 * response.off('eventName', callback);
 */
Response.prototype.off = function (eventName, callback) {
    if (this.events[eventName]) {
        this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }
};
/**
 * 开始同步监听（开启后将无法使用异步）
 * @returns {Promise<void>}
 * @example
 * response.listen();
 */
Response.prototype.listen = async function () {
    if (this.listening) {
        throw new YeteError('已开启同步监听，请勿重复开启');
    }
    const res = this;
    const headers = res.headers;
    this.listening = true;
    const contentType = headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
        const json = await res.json();
        res.emit('res', {
            type: 'json',
            data: json,
        });
    } else if (contentType && contentType.includes('text/html')) {
        const text = await res.text();
        const doc = new DOMParser().parseFromString(text, "text/html");
        res.emit('res', {
            type: 'html',
            data: doc,
        });
    } else if (contentType && contentType.includes('text/plain')) {
        const text = await res.text();
        res.emit('res', {
            type: 'text',
            data: text,
        })
    } else if (contentType && contentType.includes('text/xml')) {
        const text = await res.text();
        const xmlDoc = new DOMParser().parseFromString(text, "text/xml");
        res.emit('res', {
            type: 'xml',
            data: xmlDoc,
        });
    } else if (contentType && contentType.includes('text/event-stream')) {
        obj.HTTP.readStream(res, ({ chunk, done }) => {
            res.emit('res', {
                type: 'stream',
                data: chunk,
                done: done,
            });
        });
    } else {
        const blob = await res.blob();
        res.emit('res', {
            type: 'blob',
            data: blob,
        });
    }
};

/**
 * 加载 UI
 * @param {String} xmlstring 
 * @returns {HTMLElement}
 */
function loadUI(xmlstring) {
    const parser = new DOMParser();
    try {
        const xmlDoc = parser.parseFromString(xmlstring, "text/xml");
        const root = xmlDoc.documentElement;
        if (root.tagName === "Yete") {
            let html = "<div yete-root>";
            const rootNodes = root.childNodes;
            for (let i = 0; i < rootNodes.length; i++) {
                const node = rootNodes[i];
                html += parseNode(node);
            }
            html += "</div>";
            return new DOMParser().parseFromString(html, "text/html").body.firstElementChild;
        } else {
            throw new YeteError("Invalid XML string.");
        }
    } catch (error) {
        throw new YeteError(`Failed to LoadUI : ${error.message}`);
    }
    function parseNode(node) {
        const tagName = node.tagName;
        if (node.nodeName === "#text") {
            return node.textContent;
        }
        if (node instanceof NodeList) {
            let html = "";
            for (let i = 0; i < node.length; i++) {
                html += parseNode(node[i]);
            }
            return html;
        }
        if (UIElements[tagName]) {
            const htmlTagName = UIElements[tagName].html;
            let attrs = "";
            for (const i in UIElements[tagName].attr) {
                const attr = UIElements[tagName].attr[i];
                console.log(node.hasAttribute(attr), attr);
                if (node.hasAttribute(attr)) {
                    const value = node.getAttribute(attr);
                    console.log(attr, value);
                    if (value == "true") {
                        attrs += ` ${attr == "id" ? `${"yete-id"}` : attr}`;
                    } else {
                        attrs += ` ${attr == "id" ? `${"yete-id"}` : attr}="${value}"`;
                    }
                }
            }
            return `<${htmlTagName} ${attrs} style="${UIElements[tagName].style || ""}">${parseNode(node.childNodes)}</${htmlTagName}>`;
        } else {
            throw new YeteError(`Invalid tag name: ${tagName}`);
        }
    }
}

/**
 * 添加事件监听器
 * @param {String} type 
 * @param {Function} listener 
 * @example
 * on('click', () => console.log('Clicked'));
 */
obj.on = obj.addEventListener;
/**
 * 移除事件监听器
 * @param {String} type 
 * @param {Function} listener 
 * @example
 * off('click', () => console.log('Clicked'));
 */
obj.off = obj.removeEventListener;
/**
 * 派发事件
 * @param {String} type 
 * @param {Object} event 
 * @example
 * emit('click', new YeteEvent("click", { bubbles: true, cancelable: true }));
 */
obj.emit = obj.dispatchEvent;


window.addEventListener("error", function (event) {
    const { message, filename, lineno, colno, error } = event;
    if (custom502Page) {
        document.body.innerHTML = "";
        document.body.appendChild(custom502Page);
        const errorMsgEl = document.getElementById("error-message");
        const errorFilenameEl = document.getElementById("error-filename");
        const errorLinenoEl = document.getElementById("error-lineno");
        const errorColnoEl = document.getElementById("error-colno");
        const errorErrorEl = document.getElementById("error-error");
        if (errorMsgEl) errorMsgEl.innerText = message;
        if (errorFilenameEl) errorFilenameEl.innerText = filename;
        if (errorLinenoEl) errorLinenoEl.innerText = lineno;
        if (errorColnoEl) errorColnoEl.innerText = colno;
        if (errorErrorEl) errorErrorEl.innerText = error;
        obj.emit('page-change', new obj.YeteEvent("page-change", { path, isError: true }));
    } else {
        document.body.innerHTML = `<center><h1>Have an error: "${message}" in "${filename}" at ${lineno}:${colno}</h1><p>Power by Yete.</p></center>`;
        obj.emit('page-change', new obj.YeteEvent("page-change", { path, isError: true }));
    }
});

window.addEventListener('hashchange', () => {
    const fullpath = location.hash.slice(1) || '/';
    console.log("[Yete]", "Full path", fullpath);
    const SearchParams = fullpath.split("?").slice(1).join("?") || '';
    const path = fullpath.split("?")[0];
    const query = new URLSearchParams(SearchParams);
    searchParams = query;
    console.log("[Yete]", "Query", query);
    console.log("[Yete]", "Navigate to", path);
    obj.toPage(path);
});

console.log("%cYete v" + YeteVersion, "border-radius: 16px; font-size: 64px; color: #fff; background-color: #007bff; padding: 5px;margin: 5px;");

/**
 * 获取文件类型
 * @param {String} filePath 
 * @returns {String}
 */
function getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.js':
            return 'application/javascript';
        case '.css':
            return 'text/css';
        case '.html':
            return 'text/html';
        case '.svg':
            return 'image/svg+xml';
        case '.png':
            return 'image/png';
        case '.jpg':
            return 'image/jpeg';
        case '.jpeg':
            return 'image/jpeg';
        case '.gif':
            return 'image/gif';
        case '.ico':
            return 'image/x-icon';
        default:
            return 'application/octet-stream';
    }
}

module.exports = obj;