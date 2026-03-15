const { Dexie } = require('dexie');

console.log(Dexie);
const db = new Dexie('YeteDB');
db.version(1).stores({
    files: "path, name, size, type, lastModified"
});
db.open();
globalThis.YeteDB = db;

globalThis.files = [];
async function loadFiles() {
    const files = await db.files.toArray();
    globalThis.files = files;
    console.log(files);
    await loadIndex();
}

async function loadIndex() {
    const index = await db.files.get({ name: 'index.js' });
    if (index) {
        const url = URL.createObjectURL(index.blob);
        const script = document.createElement('script');
        script.src = url;
        document.body.appendChild(script);
    } else {
        document.body.innerHTML = `<center><h1>index.js not found in the database. Reseting...</h1><p>Powered By Yete</p></center>`;
        console.error("Error: index.js not found in the database.");
        localStorage.clear();
        location.reload();
    }
}

async function updateFiles() {
    const files = yete.files;
    for (const file of files) {
        const r = await fetch(file);
        const blob = await r.blob();
        await db.files.put({
            name: file.split('/').pop(),
            path: file,
            size: blob.size,
            type: blob.type,
            lastModified: new Date(),
            blob: blob
        });
    }
}

async function loadLibs() {
    const files = yete.files;
    const libFiles = files.filter(f => f.startsWith("libs/"));
    console.log(libFiles);
    for (const file of libFiles) {
        const f = await db.files.get({ path: file });
        console.log(file, f)
        const url = URL.createObjectURL(f.blob);
        if (file.endsWith(".js")) {
            const script = document.createElement('script');
            script.src = url;
            document.body.appendChild(script);
        } else if (file.endsWith(".css")) {
            const style = document.createElement('style');
            style.src = url;
            document.head.appendChild(style);
        } else if (file.endsWith(".ttf") || file.endsWith(".otf") || file.endsWith(".woff") || file.endsWith(".woff2")) {
            const font = document.createElement("style");
            style.textContent = `@font-face {
    font-family: '${file.split("/").pop().split(".").slice(0, -1).join(".")}';
    src: url('${url}') format('${file.split(".").pop()}'),
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}`;
            document.head.appendChild(font);
        }
    }
}

async function main() {
    const version = yete.version;
    if (localStorage.getItem('yete-version') != version) {
        await updateFiles();
        await loadFiles();
        localStorage.setItem('yete-version', version);
    } else {
        await loadFiles();
    }
    await loadLibs();
}

main();