class YeteError extends Error {
    constructor(message) {
        super(message);
        this.name = 'YeteError';
    }
}

class Page {
    constructor(name) {
        this.name = name;
    }
    render() {
        return document.createElement('div', { className: 'page' }, this.name);
    }
}

const pages = [];
const routes = [];

const obj = {
    /**
     * 设置页面图标
     * @param {String} iconPath 
     * @returns 
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
     */
    setTitle: function (title) {
        document.title = title;
    },
    /**
     * 配置路由
     * @param {Array<Object>} options
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
    Page: Page,
    /**
     * 加载组件
     * @param {Page} page 
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
     */
    start: function () {
        const path = location.hash.slice(1) || '/';
        obj.toPage(path);
    },
    /**
     * 加载 CSS 文件
     * @param {String} cssPath 
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
     */
    toPage: function (path) {
        location.hash = path;
        const page = routes.find(r => r.path === path);
        console.log(pages, page);
        if (page) {
            document.body.innerHTML = "";
            document.body.appendChild(page.page);
        } else {
            document.body.innerHTML = "<center><h1>404 Not Found</h1><p>Power By Yete</p></center>";
            throw new YeteError("The page not found.");
        }
    }
};

// 监听 hashchange 事件，实现页面跳转
window.addEventListener('hashchange', () => {
    const path = location.hash.slice(1) || '/';
    obj.toPage(path);
});


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