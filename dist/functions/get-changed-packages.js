"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_promise_1 = require("child-process-promise");
const chalk_1 = __importDefault(require("chalk"));
const get_packages_1 = __importDefault(require("./get-packages"));
chalk_1.default.level = 1;
// Would be better to determine changed packages by imports, not changed dirs - to be implemented
exports.default = async () => {
    try {
        const { stdout: branchName, stderr: branchErr } = await (0, child_process_promise_1.exec)(`git branch --show-current`);
        if (branchErr)
            throw Error(branchErr);
        const deployablePkgs = get_packages_1.default.filter((pkg) => (pkg.type === 'app' || pkg.type === 'func-api') && !pkg.ignore);
        if (branchName.trim() === 'main')
            return deployablePkgs;
        await (0, child_process_promise_1.exec)('git fetch --all');
        const checkChanged = async (pkg) => {
            const { stdout: diffOut, stdout: diffErr } = await (0, child_process_promise_1.exec)(`git diff --quiet origin/main HEAD -- ${path_1.default.join(pkg.path)} || echo ${pkg.id} changed`);
            if (diffErr)
                console.log(diffErr);
            return diffOut.includes(`${pkg.id} changed`) ? pkg : null;
        };
        const changedPromises = get_packages_1.default
            .filter((pckg) => !pckg.ignore)
            .map(checkChanged);
        const changedDiffPackages = (await Promise.all(changedPromises)).filter((item) => item);
        const changedLibPackeges = changedDiffPackages.filter((pkg) => pkg.type === 'lib');
        const libDepPackages = get_packages_1.default.filter((pkg) => pkg.type === 'app');
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
        console.log(`${chalk_1.default.bold.blue('Info')}: Changed packages: ${chalk_1.default.bold(changedPackageIdString)}`);
        return changedPackages;
    }
    catch (err) {
        throw Error(err);
    }
};
