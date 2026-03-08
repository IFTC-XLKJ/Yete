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
        console.error("Error: index.js not found in the database.");
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
            lastModified: blob.lastModified,
            blob: blob
        });
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
}

main();