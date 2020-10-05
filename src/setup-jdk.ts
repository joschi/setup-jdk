import * as core from '@actions/core';
import * as installer from './installer';
import * as auth from './auth';
import * as gpg from './gpg';
import * as constants from './constants';
import * as path from 'path';

async function run() {
  try {
    // Type of release. Either a release version, known as General Availability ("ga") or an Early Access ("ea")
    const release_type = core.getInput(constants.INPUT_RELEASE_TYPE) || 'ga';
    // OpenJDK feature release version, example: "8", "11", "13".
    const javaVersion = core.getInput(constants.INPUT_JAVA_VERSION, {
      required: true
    });
    // OpenJDK implementation, example: "hotspot", "openj9".
    const openjdk_impl =
      core.getInput(constants.INPUT_OPENJDK_IMPL) || 'hotspot';
    // Architecture of the JDK, example: "x64", "x32", "arm", "ppc64", "s390x", "ppc64le", "aarch64", "sparcv9".
    const arch =
      core.getInput(constants.INPUT_ARCHITECTURE, {required: true}) || 'x64';
    // Heap size for OpenJ9, example: "normal", "large" (for heaps >=57 GiB).
    const heap_size =
      core.getInput(constants.INPUT_HEAP_SIZE, {required: false}) || 'normal';
    // Exact release of OpenJDK, example: "latest", "jdk-11.0.4+11.4", "jdk8u172-b00-201807161800".
    const release =
      core.getInput(constants.INPUT_RELEASE, {required: false}) || 'latest';
    // The image type (jre, jdk)
    const javaPackage =
      core.getInput(constants.INPUT_JAVA_PACKAGE, {
        required: true
      }) || 'jdk';
    const jdkFile = core.getInput(constants.INPUT_JDK_FILE, {required: false});

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

    const id = core.getInput(constants.INPUT_SERVER_ID, {required: false});
    const username = core.getInput(constants.INPUT_SERVER_USERNAME, {
      required: false
    });
    const password = core.getInput(constants.INPUT_SERVER_PASSWORD, {
      required: false
    });
    const overwriteSettings =
      core.getInput(constants.INPUT_OVERWRITE_SETTINGS, {required: false}) ||
      'true';
    const gpgPrivateKey =
      core.getInput(constants.INPUT_GPG_PRIVATE_KEY, {required: false}) ||
      constants.INPUT_DEFAULT_GPG_PRIVATE_KEY;
    const gpgPassphrase =
      core.getInput(constants.INPUT_GPG_PASSPHRASE, {required: false}) ||
      (gpgPrivateKey ? constants.INPUT_DEFAULT_GPG_PASSPHRASE : undefined);

    if (gpgPrivateKey) {
      core.setSecret(gpgPrivateKey);
    }

    await auth.configAuthentication(
      id,
      username,
      password,
      overwriteSettings === 'true',
      gpgPassphrase
    );

    if (gpgPrivateKey) {
      core.info('importing private key');
      const keyFingerprint = (await gpg.importKey(gpgPrivateKey)) || '';
      core.saveState(
        constants.STATE_GPG_PRIVATE_KEY_FINGERPRINT,
        keyFingerprint
      );
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
