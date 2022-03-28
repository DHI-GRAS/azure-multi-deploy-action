"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_promise_1 = require("child-process-promise");
const get_packages_1 = __importDefault(require("./get-packages"));
// Would be better to determine changed packages by imports, not changed dirs - to be implemented
exports.default = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { stdout: branchName, stderr: branchErr } = yield (0, child_process_promise_1.exec)(`git branch --show-current`);
        if (branchErr)
            throw Error(branchErr);
        const deployablePkgs = get_packages_1.default.filter((pkg) => pkg.type === 'app' || pkg.type === 'func-api');
        if (branchName.trim() === 'main')
            return deployablePkgs;
        yield (0, child_process_promise_1.exec)('git fetch --all');
        const checkChanged = (pkg) => __awaiter(void 0, void 0, void 0, function* () {
            const { stdout: diffOut, stdout: diffErr } = yield (0, child_process_promise_1.exec)(`git diff --quiet origin/main HEAD -- ${path_1.default.join(pkg.path)} || echo changed`);
            if (diffErr)
                console.log(diffErr);
            return diffOut.includes('changed') ? pkg : null;
        });
        const changedPromises = get_packages_1.default.map(checkChanged);
        const changedDiffPackages = (yield Promise.all(changedPromises)).filter((item) => item);
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
        console.log(`Changed packages: ${changedPackageIdString}`);
        return changedPackages;
    }
    catch (err) {
        throw Error(err);
    }
});
