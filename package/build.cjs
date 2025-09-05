// build.js  (CJS)
const fs = require('fs');
const path = require('path');

function log(ok, msg) {
    const mark = ok ? '✅' : '❌';
    console.log(`${mark} ${msg}`);
}
function r(p) { return path.resolve(process.cwd(), p); }
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }

/** 디렉터리 삭제 후 재생성 */
function cleanDir(dir) {
    const abs = r(dir);
    fs.rmSync(abs, { recursive: true, force: true });
    fs.mkdirSync(abs, { recursive: true });
    log(true, `clean: ${dir}`);
}

/** 파일/폴더 재귀 복사 */
function copyRecursive(src, dest) {
const sAbs = r(src);
const dAbs = r(dest);

if (!fs.existsSync(sAbs)) throw new Error(`source not found: ${src}`);
    const st = fs.statSync(sAbs);

    if (st.isDirectory()) {
        ensureDir(dAbs);
        for (const name of fs.readdirSync(sAbs)) {
        copyRecursive(path.join(src, name), path.join(dest, name));
        }
    } else {
        ensureDir(path.dirname(dAbs));
        fs.copyFileSync(sAbs, dAbs);
    }
    log(true, `copy: ${src} -> ${dest}`);
}

/** 인자 파싱 */
function parseArgs(argv) {
    const cleans = [];
    const copies = []; // { src, dest }
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--clean') {
        if (!argv[i + 1]) throw new Error('missing <dir> after --clean');
        cleans.push(argv[++i]);
        } else if (a === '--copy') {
        if (!argv[i + 1] || !argv[i + 2]) throw new Error('missing <src> <dest> after --copy');
        copies.push({ src: argv[++i], dest: argv[++i] });
        } else if (a === '--help' || a === '-h') {
        printHelp();
        process.exit(0);
        } else {
        throw new Error(`unknown arg: ${a}`);
        }
    }
    return { cleans, copies };
}

function printHelp() {
console.log(`
Usage:
node build.js [--clean <dir>]... [--copy <src> <dest>]...

Examples:
node build.js --clean dist/cjs --clean dist/esm \\
                --copy src/package.json dist/test.json \\
                --copy README.md dist/README.md

Notes:
- --clean : 디렉터리를 통째로 삭제하고 다시 생성합니다.
- --copy  : 파일/폴더 모두 지원(폴더는 재귀 복사).
`);
}

function main(argv = process.argv) {
    try {
        const { cleans, copies } = parseArgs(argv);
        for (const d of cleans) cleanDir(d);
        for (const { src, dest } of copies) copyRecursive(src, dest);
        if (cleans.length === 0 && copies.length === 0) printHelp();
    } catch (err) {
        log(false, err && err.message ? err.message : String(err));
        process.exitCode = 1;
}
}

if (require.main === module) {
    main();
} else {
    // 라이브러리처럼 require 해서 쓸 수도 있음
    module.exports = { cleanDir, copyRecursive, main };
}
