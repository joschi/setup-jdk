# setup-jdk

This action sets up a Java development environment with the OpenJDK distribution from [AdoptOpenJDK](https://adoptopenjdk.net/) for use in actions by:

- Downloading and caching a version of the OpenJDK by version and adding to `PATH`. Downloads from [AdoptOpenJDK](https://adoptopenjdk.net/).
- Registering problem matchers for error output.

The action is based on [actions/setup-java](https://github.com/actions/setup-java) and is using the [AdoptOpenJDK API](https://api.adoptopenjdk.net/) for fetching the JDK binaries.

# Usage

See [action.yml](action.yml)

Basic:
```yaml
steps:
- uses: actions/checkout@latest
- uses: joschi/setup-jdk@v1
  with:
    java-version: '11' // The OpenJDK version to make available on the path
    architecture: 'x64' // defaults to 'x64'
- run: java -cp java HelloWorldApp
```

Matrix Testing:
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        java: [ '8', '11', '13' ]
    name: Java ${{ matrix.java }} sample
    steps:
      - uses: actions/checkout@master
      - name: Setup java
        uses: joschi/setup-jdk@v1
        with:
          java-version: ${{ matrix.java }}
          architecture: x64
      - run: java -cp java HelloWorldApp
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE).

# Contributions

Contributions are welcome! See [Contributor's Guide](docs/contributors.md)
