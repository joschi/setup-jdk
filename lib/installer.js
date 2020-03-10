"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const io = __importStar(require("@actions/io"));
const exec = __importStar(require("@actions/exec"));
const tc = __importStar(require("@actions/tool-cache"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const IS_WINDOWS = process.platform === 'win32';
const IS_MACOS = process.platform === 'darwin';
const toolName = 'AdoptOpenJDK';
const os = getOsString(process.platform);
const tempDirectory = getTempDirectory(process.env['RUNNER_TEMP'] || '');
function getTempDirectory(tempDirectory) {
    if (!tempDirectory) {
        let baseLocation;
        switch (process.platform) {
            case 'win32':
                baseLocation = process.env['USERPROFILE'] || 'C:\\';
                break;
            case 'darwin':
                baseLocation = '/Users';
                break;
            default:
                baseLocation = '/home';
        }
        return path.join(baseLocation, 'actions', 'temp');
    }
    else {
        return tempDirectory;
    }
}
function getOsString(platform) {
    switch (platform) {
        case 'win32':
            return 'windows';
        case 'darwin':
            return 'mac';
        default:
            return 'linux';
    }
}
function getFeatureVersion(version) {
    return version.replace('openjdk', '');
}
function getReleaseType(release_type) {
    switch (release_type) {
        case 'releases':
            return 'ga';
        case 'nightly':
            return 'ea';
        default:
            return release_type;
    }
}
function getAdoptOpenJdkUrl(release_type, version, jvm_impl, os, arch, heap_size, release) {
    const feature_version = getFeatureVersion(version);
    const release_type_parsed = getReleaseType(release_type);
    if (release == 'latest') {
        return `https://api.adoptopenjdk.net/v3/binary/latest/${feature_version}/${release_type_parsed}/${os}/${arch}/jdk/${jvm_impl}/${heap_size}/adoptopenjdk`;
    }
    else {
        const release_name = encodeURIComponent(release);
        return `https://api.adoptopenjdk.net/v3/binary/version/${release_name}/${os}/${arch}/jdk/${jvm_impl}/${heap_size}/adoptopenjdk`;
    }
}
async function getJava(release_type, version, jvm_impl, arch, heap_size, release) {
    return downloadJavaBinary(release_type, version, jvm_impl, os, arch, heap_size, release);
}
exports.getJava = getJava;
async function downloadJavaBinary(release_type, version, jvm_impl, os, arch, heap_size, release) {
    const versionSpec = getCacheVersionSpec(release_type, version, jvm_impl, os, heap_size, release);
    let toolPath = tc.find(toolName, versionSpec, arch);
    if (toolPath) {
        core.debug(`Tool found in cache ${toolPath}`);
    }
    else {
        core.debug('Downloading JDK from AdoptOpenJDK');
        const release_encoded = encodeURIComponent(release);
        const url = getAdoptOpenJdkUrl(release_type, version, jvm_impl, os, arch, heap_size, release);
        const jdkFile = await tc.downloadTool(url);
        const compressedFileExtension = IS_WINDOWS ? '.zip' : '.tar.gz';
        const tempDir = path.join(tempDirectory, 'adoptopenjdk_' + Math.floor(Math.random() * 2000000000));
        const jdkDir = await unzipJavaDownload(jdkFile, compressedFileExtension, tempDir);
        core.debug(`JDK extracted to ${jdkDir}`);
        toolPath = await tc.cacheDir(jdkDir, toolName, versionSpec, arch);
    }
    const extendedJavaHome = `JAVA_HOME_${version}_${arch}`;
    core.exportVariable('JAVA_HOME', toolPath);
    core.exportVariable(extendedJavaHome, toolPath);
    core.addPath(path.join(toolPath, 'bin'));
}
function getCacheVersionSpec(release_type, version, jvm_impl, os, heap_size, release) {
    return `1.0.0-${release_type}-${version}-${jvm_impl}-${heap_size}-${release}`;
}
async function extractFiles(file, fileEnding, destinationFolder) {
    const stats = fs.statSync(file);
    if (!stats) {
        throw new Error(`Failed to extract ${file} - it doesn't exist`);
    }
    else if (stats.isDirectory()) {
        throw new Error(`Failed to extract ${file} - it is a directory`);
    }
    switch (fileEnding) {
        case '.tar':
        case '.tar.gz':
            await tc.extractTar(file, destinationFolder);
            break;
        case '.zip':
            await tc.extractZip(file, destinationFolder);
            break;
        case '.7z':
            await tc.extract7z(file, destinationFolder);
            break;
        default:
            throw new Error(`Failed to extract ${file} - unknown compression`);
    }
}
// This method recursively finds all .pack files under fsPath and unpacks them with the unpack200 tool
async function unpackJars(fsPath, javaBinPath) {
    if (fs.existsSync(fsPath)) {
        if (fs.lstatSync(fsPath).isDirectory()) {
            for (const file in fs.readdirSync(fsPath)) {
                const curPath = path.join(fsPath, file);
                await unpackJars(curPath, javaBinPath);
            }
        }
        else if (path.extname(fsPath).toLowerCase() === '.pack') {
            // Unpack the pack file synchonously
            const p = path.parse(fsPath);
            const toolName = IS_WINDOWS ? 'unpack200.exe' : 'unpack200';
            const args = IS_WINDOWS ? '-r -v -l ""' : '';
            const name = path.join(p.dir, p.name);
            await exec.exec(`"${path.join(javaBinPath, toolName)}"`, [
                `${args} "${name}.pack" "${name}.jar"`
            ]);
        }
    }
}
async function unzipJavaDownload(repoRoot, fileEnding, destinationFolder) {
    // Create the destination folder if it doesn't exist
    await io.mkdirP(destinationFolder);
    const jdkFile = path.normalize(repoRoot);
    const stats = fs.statSync(jdkFile);
    if (stats.isFile()) {
        await extractFiles(jdkFile, fileEnding, destinationFolder);
        const jdkDirectory = getJdkDirectory(destinationFolder);
        await unpackJars(jdkDirectory, path.join(jdkDirectory, 'bin'));
        return jdkDirectory;
    }
    else {
        throw new Error(`JDK argument ${jdkFile} is not a file`);
    }
}
function getJdkDirectory(destinationFolder) {
    if (IS_MACOS) {
        return path.join(destinationFolder, fs.readdirSync(destinationFolder)[0], 'Contents', 'Home');
    }
    else {
        return path.join(destinationFolder, fs.readdirSync(destinationFolder)[0]);
    }
}
