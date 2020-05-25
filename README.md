# setup-jdk

<p align="left">
  <a href="https://github.com/joschi/setup-jdk"><img alt="GitHub Actions status" src="https://github.com/joschi/setup-jdk/workflows/Main%20workflow/badge.svg"></a>
</p>

This action sets up a Java development environment with the OpenJDK distribution from [AdoptOpenJDK](https://adoptopenjdk.net/) for use in actions by:

- Downloading and caching a version of the OpenJDK by version and adding to `PATH`. Downloads from [AdoptOpenJDK](https://adoptopenjdk.net/).
- Registering problem matchers for error output.

The action is based on [actions/setup-java](https://github.com/actions/setup-java) and is using the [AdoptOpenJDK API](https://api.adoptopenjdk.net/) for fetching the JDK binaries.

# Usage

See [action.yml](action.yml)

## Basic
```yaml
steps:
- uses: actions/checkout@v2
- uses: joschi/setup-jdk@v2
  with:
    java-version: '11' # The OpenJDK version to make available on the path
    architecture: 'x64' # defaults to 'x64'
- run: java -cp java HelloWorldApp
```

## Local file
```yaml
steps:
- uses: actions/checkout@v2
- uses: joschi/setup-jdk@v2
  with:
    java-version: '4.0.0'
    architecture: x64
    jdkFile: <path to jdkFile> # Optional - jdkFile to install java from. Useful for versions not found on Zulu Community CDN
- run: java -cp java HelloWorldApp
```

## Matrix Testing
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        java: [ '8', '11', '13' ]
    name: Java ${{ matrix.java }} sample
    steps:
      - uses: actions/checkout@v2
      - name: Setup java
        uses: joschi/setup-jdk@v2
        with:
          java-version: ${{ matrix.java }}
          architecture: x64
      - run: java -cp java HelloWorldApp
```

## Publishing using Apache Maven
```yaml
jobs:
  build:

    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2
    - name: Set up JDK 1.8
      uses: joschi/setup-jdk@v2
      with:
        java-version: '8'

    - name: Build with Maven
      run: mvn -B package --file pom.xml

    - name: Publish to GitHub Packages Apache Maven
      run: mvn deploy
      env:
        GITHUB_TOKEN: ${{ github.token }} # GITHUB_TOKEN is the default env for the password

    - name: Set up Apache Maven Central
      uses: joschi/setup-jdk@v2
      with: # running setup-jdk again overwrites the settings.xml
        java-version: '8'
        server-id: maven # Value of the distributionManagement/repository/id field of the pom.xml
        server-username: MAVEN_USERNAME # env variable for username in deploy
        server-password: MAVEN_CENTRAL_TOKEN # env variable for token in deploy

    - name: Publish to Apache Maven Central
      run: mvn deploy 
      env:
        MAVEN_USERNAME: maven_username123
        MAVEN_CENTRAL_TOKEN: ${{ secrets.MAVEN_CENTRAL_TOKEN }}
```

The two `settings.xml` files created from the above example look like the following.

`settings.xml` file created for the first deploy to GitHub Packages
```xml
<servers>
    <server>
      <id>github</id>
      <username>${env.GITHUB_ACTOR}</username>
      <password>${env.GITHUB_TOKEN}</password>
    </server>
</servers>
```

`settings.xml` file created for the second deploy to Apache Maven Central
```xml
<servers>
    <server>
      <id>maven</id>
      <username>${env.MAVEN_USERNAME}</username>
      <password>${env.MAVEN_CENTRAL_TOKEN}</password>
    </server>
</servers>
```

***NOTE: The `settings.xml` file is created in the Actions $HOME directory. If you have an existing `settings.xml` file at that location, it will be overwritten. See below for using the `settings-path` to change your `settings.xml` file location.***	

See the help docs on [Publishing a Package](https://help.github.com/en/github/managing-packages-with-github-packages/configuring-apache-maven-for-use-with-github-packages#publishing-a-package) for more information on the `pom.xml` file.

## Publishing using Gradle
```yaml
jobs:

  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Set up JDK 1.8
      uses: joschi/setup-jdk@v2

    - name: Build with Gradle
      run: gradle build

    - name: Publish to GitHub Packages
      run: gradle publish
      env:
        USERNAME: ${{ github.actor }}
        PASSWORD: ${{ secrets.GITHUB_TOKEN }}
```

***NOTE: The `USERNAME` and `PASSWORD` need to correspond to the credentials environment variables used in the publishing section of your `build.gradle`.***	

See the help docs on [Publishing a Package with Gradle](https://help.github.com/en/github/managing-packages-with-github-packages/configuring-gradle-for-use-with-github-packages#example-using-gradle-groovy-for-a-single-package-in-a-repository) for more information on the `build.gradle` configuration file.

## Apache Maven with a settings path

When using an Actions self-hosted runner with multiple shared runners the default `$HOME` directory can be shared by a number runners at the same time which could overwrite existing settings file. Setting the `settings-path` variable allows you to choose a unique location for your settings file.

```yaml
jobs:
  build:

    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2
    - name: Set up JDK 1.8 for Shared Runner
      uses: joschi/setup-jdk@v2
      with:
        java-version: '8'
        server-id: github # Value of the distributionManagement/repository/id field of the pom.xml
        settings-path: ${{ github.workspace }} # location for the settings.xml file

    - name: Build with Maven
      run: mvn -B package --file pom.xml

    - name: Publish to GitHub Packages Apache Maven
      run: mvn deploy -s $GITHUB_WORKSPACE/settings.xml
      env:
        GITHUB_TOKEN: ${{ github.token }}
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!  See [Contributor's Guide](docs/contributors.md)
