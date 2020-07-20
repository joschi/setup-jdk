import * as core from '@actions/core';
import * as installer from './installer';
import * as auth from './auth';
import * as path from 'path';

async function run() {
  try {
    // Type of release. Either a release version, known as General Availability ("ga") or an Early Access ("ea")
    const release_type = core.getInput('release_type') || 'ga';
    // OpenJDK feature release version, example: "8", "11", "13".
    const javaVersion = core.getInput('java-version', {required: true});
    // OpenJDK implementation, example: "hotspot", "openj9".
    const openjdk_impl = core.getInput('openjdk_impl') || 'hotspot';
    // Architecture of the JDK, example: "x64", "x32", "arm", "ppc64", "s390x", "ppc64le", "aarch64", "sparcv9".
    const arch = core.getInput('architecture', {required: false}) || 'x64';
    // Heap size for OpenJ9, example: "normal", "large" (for heaps >=57 GiB).
    const heap_size = core.getInput('heap_size', {required: false}) || 'normal';
    // Exact release of OpenJDK, example: "latest", "jdk-11.0.4+11.4", "jdk8u172-b00-201807161800".
    const release = core.getInput('release') || 'latest';
    // The image type (jre, jdk)
    const javaPackage =
      core.getInput('java-package', {required: false}) || 'jdk';
    const jdkFile = core.getInput('jdkFile', {required: false}) || '';

    await installer.getAdoptOpenJDK(
      release_type,
      javaVersion,
      javaPackage,
      openjdk_impl,
      arch,
      heap_size,
      release,
      jdkFile
    );

    const matchersPath = path.join(__dirname, '..', '.github');
    console.log(`##[add-matcher]${path.join(matchersPath, 'java.json')}`);

    const id = core.getInput('server-id', {required: false}) || undefined;
    const username =
      core.getInput('server-username', {required: false}) || undefined;
    const password =
      core.getInput('server-password', {required: false}) || undefined;
    const overwriteSettings =
      core.getInput('overwrite-settings', {required: false}) || 'true';

    await auth.configAuthentication(id, username, password, overwriteSettings === 'true');
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
