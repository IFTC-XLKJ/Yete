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
            throw new YeteError("The page not found.");
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
    },
};

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
        document.body.innerHTML = `<center><h1>Have an error: "${message}" in "${filename}" at ${lineno}:${colno}</h1><p>Powsered by Yete.</p></center>`;
        obj.emit('page-change', new obj.YeteEvent("page-change", { path, isError: true }));
    }
});

window.addEventListener('hashchange', () => {
    const path = location.hash.slice(1) || '/';
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