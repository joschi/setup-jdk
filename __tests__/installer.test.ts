import io = require('@actions/io');
import fs = require('fs');
import path = require('path');

const toolName = 'AdoptOpenJDK';
const toolDir = path.join(__dirname, 'runner', 'tools');
const tempDir = path.join(__dirname, 'runner', 'temp');

process.env['RUNNER_TOOL_CACHE'] = toolDir;
process.env['RUNNER_TEMP'] = tempDir;
import * as installer from '../src/installer';

describe('installer tests', () => {
  afterAll(async () => {
    try {
      await io.rmRF(toolDir);
      await io.rmRF(tempDir);
    } catch {
      console.log('Failed to remove test directories');
    }
  }, 100000);

  it('Throws if invalid release_type', async () => {
    let thrown = false;
    try {
      await installer.getJava(
        'invalid-release-type',
        'openjdk11',
        'hotspot',
        'x64',
        'normal',
        'latest'
      );
    } catch {
      thrown = true;
    }
    expect(thrown).toBe(true);
  });

  it('Throws if invalid version', async () => {
    let thrown = false;
    try {
      await installer.getJava(
        'releases',
        'invalid-version',
        'hotspot',
        'x64',
        'normal',
        'latest'
      );
    } catch {
      thrown = true;
    }
    expect(thrown).toBe(true);
  });

  it('Throws if invalid openjdk_impl', async () => {
    let thrown = false;
    try {
      await installer.getJava(
        'releases',
        'openjdk11',
        'invalid-openjdk_impl',
        'x64',
        'normal',
        'latest'
      );
    } catch {
      thrown = true;
    }
    expect(thrown).toBe(true);
  });

  it('Throws if invalid arch', async () => {
    let thrown = false;
    try {
      await installer.getJava(
        'releases',
        'openjdk11',
        'hotspot',
        'invalid-arch',
        'normal',
        'latest'
      );
    } catch {
      thrown = true;
    }
    expect(thrown).toBe(true);
  });

  it('Downloads java with normal syntax', async () => {
    await installer.getJava(
      'releases',
      'openjdk11',
      'hotspot',
      'x64',
      'normal',
      'jdk-11.0.4+11'
    );
    const JavaDir = path.join(
      toolDir,
      toolName,
      `1.0.0-releases-openjdk11-hotspot-normal-jdk-11.0.4`,
      'x64'
    );

    expect(fs.existsSync(path.join(JavaDir, 'bin'))).toBe(true);
  }, 100000);

  it('Uses version of Java installed in cache', async () => {
    const JavaDir: string = path.join(
      toolDir,
      toolName,
      '1.0.0-releases-my-custom-version-hotspot-normal-123.4.5',
      'x64'
    );
    await io.mkdirP(JavaDir);
    fs.writeFileSync(`${JavaDir}.complete`, 'hello');
    // This will throw if it doesn't find it in the cache (because no such version exists)
    await installer.getJava(
      'releases',
      'my-custom-version',
      'hotspot',
      'x64',
      'normal',
      '123.4.5'
    );
    return;
  });
});
