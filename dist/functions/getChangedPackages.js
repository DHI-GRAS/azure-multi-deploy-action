"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_promise_1 = require("child-process-promise");
const get_packages_1 = __importDefault(require("./get-packages"));
exports.default = async () => {
    try {
        console.log(get_packages_1.default);
        const packagesWithName = get_packages_1.default;
        const { stdout: branchName, stderr: branchErr } = await child_process_promise_1.exec(`git branch --show-current`);
        if (branchErr)
            throw Error(branchErr);
        // TODO TEMPORARY while diff checking is dumb
        const deployablePkgs = packagesWithName.filter((pkg) => pkg.type === 'app' || pkg.type === 'func-api');
        if (branchName.trim() === 'main')
            return deployablePkgs;
        const checkChanged = async (pkg) => {
            const { stdout: diffOut, stdout: diffErr } = await child_process_promise_1.exec(`git diff --quiet origin/main HEAD -- ${path_1.default.join(pkg.path)} || echo changed`);
            if (diffErr)
                console.log(diffErr);
            return diffOut.includes('changed') ? pkg : null;
        };
        const changedPromises = packagesWithName.map(checkChanged);
        const changedDiffPackages = (await Promise.all(changedPromises)).filter((item) => item);
        const changedLibPackeges = changedDiffPackages.filter((pkg) => pkg.type === 'lib');
        const libDepPackages = packagesWithName.filter((pkg) => pkg.type === 'app');
        const changedPackagesWithLibDeps = libDepPackages.filter((pkg) => {
            const pkgPackageFile = fs_1.default.readFileSync(path_1.default.join(pkg.path, 'package.json'), 'utf8');
            const pkgPackageJson = JSON.parse(pkgPackageFile);
            const pkgDeps = [
                ...Object.keys(pkgPackageJson.dependencies),
                ...Object.keys(pkgPackageJson.devDependencies),
            ];
            return changedLibPackeges
                .map((libPkg) => pkgDeps.includes(libPkg.name))
                .includes(true);
        });
        const changedPackages = [
            ...new Set([...changedPackagesWithLibDeps, ...changedDiffPackages]),
        ];
        const changedPackageIdString = changedPackages
            .map((pkg) => pkg.id)
            .join(', ');
        console.log(`Changed packages: ${changedPackageIdString}`);
        return changedPackages;
    }
    catch (err) {
        throw Error(err);
    }
};
