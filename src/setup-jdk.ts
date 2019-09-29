import * as core from '@actions/core';
import * as installer from './installer';
import * as path from 'path';

async function run() {
  try {
    // Type of release, i. e. "releases" for stable builds or "nightly" for the most recent build.
    const release_type = core.getInput('release_type') || 'releases';
    // OpenJDK version, example: "openjdk8", "openjdk11", "openjdk13".
    const javaVersion = core.getInput('java-version', {required: true});
    // OpenJDK implementation, example: "hotspot", "openj9".
    const openjdk_impl = core.getInput('openjdk_impl') || 'hotspot';
    // Architecture of the JDK, example: "x64", "x32", "ppc64", "s390x", "ppc64le", "aarch64".
    const arch = core.getInput('architecture', {required: false}) || 'x64';
    // Heap size for OpenJ9, example: "normal", "large" (for heaps >=57 GiB).
    const heap_size = core.getInput('heap_size', {required: false}) || 'normal';
    // Exact release of OpenJDK, example: "latest", "jdk-11.0.4+11.4", "jdk8u172-b00-201807161800".
    const release = core.getInput('release') || 'latest';

    await installer.getJava(
      release_type,
      javaVersion,
      openjdk_impl,
      arch,
      heap_size,
      release
    );

    const matchersPath = path.join(__dirname, '..', '.github');
    console.log(`##[add-matcher]${path.join(matchersPath, 'java.json')}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
