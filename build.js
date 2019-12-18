const { default: Watcher, Op } = require("@akumzy/fs-watcher"),
  path = require("path"),
  snakeCae = require("lodash/snakeCase"),
  { execSync } = require("child_process"),
  {
    done,
    logWithSpinner,
    error,
    stopSpinner
  } = require("@vue/cli-shared-utils"),
  fs = require("fs");
const GOArch = {
  ia32: "386",
  x64: "amd64"
};
const GOPlatform = {
  mac: "darwin",
  darwin: "darwin",
  linux: "linux",
  win: "windows",
  win32: "windows",
  windows: "windows"
};
const oldDir = __dirname;
exports.watch = async function watch(api, options, watchMode = false) {
  const rootDir = api.resolve(".");
  const goPath = api.resolve("./golang");
  const { name: appName } = require(api.resolve("./package.json"));
  // Initial build
  build();

  const w = new Watcher({
    path: goPath,
    filters: [Op.Create, Op.Move, Op.Remove, Op.Rename, Op.Write],
    recursive: true
  });
  await w.start();
  // watch directory
  w.onAll((_, f) => {
    build(f);
  });
  w.onError(err => {
    error(err);
    process.exit(1);
  });

  function build() {
    logWithSpinner("Building go...");
    let binPath = path.join(rootDir, "bin");
    if (!fs.existsSync(path.join(rootDir, "bin"))) {
      fs.mkdirSync(binPath, { recursive: true });
    }
    let name =
      GOPlatform[process.platform] === "windows"
        ? `${snakeCae(appName)}_${process.arch}.exe`
        : `${snakeCae(appName)}_${process.arch}`;
    // Build apps
    process.chdir(goPath);
    execSync(
      `go build -o "${path.join(binPath, GOPlatform[key], name)}" ${goPath}`
    );
    process.chdir(oldDir);
    done("Build complete!");
    stopSpinner(false);
  }
};
exports.build = function build(api, options) {
  const rootDir = api.resolve(".");
  const goPath = api.resolve("./golang");
  const { name: appName } = require(api.resolve("./package.json"));
  logWithSpinner("Building go...");
  let binPath = path.join(rootDir, "bin");
  if (!fs.existsSync(path.join(rootDir, "bin"))) {
    fs.mkdirSync(binPath, { recursive: true });
  }

  let opts;
  if (
    options.pluginOptions &&
    options.pluginOptions.electronGo &&
    options.pluginOptions.electronGo.platforms &&
    Object.keys(options.pluginOptions.electronGo.platforms).length
  ) {
    opts = options.pluginOptions.electronGo.platforms;
  } else {
    opts = {
      mac: {
        arch: ["ia32", "x64"]
      },
      win: {
        arch: ["ia32", "x64"]
      },
      linux: {
        arch: ["ia32", "x64"]
      }
    };
  }
  for (const key in opts) {
    let archs = opts[key];
    if (!(archs && archs.length)) {
      archs = ["ia32", "x64"];
    }
    for (const a of archs) {
      logWithSpinner(
        `electron-go building binery for platform=${GOPlatform[key]} arch=${a}`
      );
      // Set enviroment variables
      if (process.platform === "win32") {
        execSync(`SET GOOS=${GOPlatform[key]}`);
        execSync(`SET GOOS=${GOArch[a]}`);
      } else {
        execSync(
          `export GOOS=${GOPlatform[key]} && export GOARCH=${GOArch[a]}`
        );
      }
      let name =
        key === "win"
          ? `${snakeCae(appName)}_${a}.exe`
          : `${snakeCae(appName)}_${a}`;
      // Build apps
      process.chdir(goPath);
      execSync(
        `go build -o "${path.join(binPath, GOPlatform[key], name)}" ${goPath}`
      );
      process.chdir(oldDir);
    }
  }
  done("Build complete!");
  process.exit(0);
};
