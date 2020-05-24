"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const installer = __importStar(require("./installer"));
const path = __importStar(require("path"));
async function run() {
    try {
        // Type of release. Either a release version, known as General Availability ("ga") or an Early Access ("ea")
        const release_type = core.getInput('release_type') || 'ga';
        // OpenJDK feature release version, example: "8", "11", "13".
        const javaVersion = core.getInput('java-version', { required: true });
        // OpenJDK implementation, example: "hotspot", "openj9".
        const openjdk_impl = core.getInput('openjdk_impl') || 'hotspot';
        // Architecture of the JDK, example: "x64", "x32", "arm", "ppc64", "s390x", "ppc64le", "aarch64", "sparcv9".
        const arch = core.getInput('architecture', { required: false }) || 'x64';
        // Heap size for OpenJ9, example: "normal", "large" (for heaps >=57 GiB).
        const heap_size = core.getInput('heap_size', { required: false }) || 'normal';
        // Exact release of OpenJDK, example: "latest", "jdk-11.0.4+11.4", "jdk8u172-b00-201807161800".
        const release = core.getInput('release') || 'latest';
        await installer.getJava(release_type, javaVersion, openjdk_impl, arch, heap_size, release);
        const matchersPath = path.join(__dirname, '..', '.github');
        console.log(`##[add-matcher]${path.join(matchersPath, 'java.json')}`);
    }
    catch (error) {
        core.setFailed(error.message);
    }
}
run();
