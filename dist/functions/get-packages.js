"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const packageTypes = ['apps', 'func-apis'];
const appRequiredFields = ['name', 'id', 'resourceGroup'];
const apiRequiredFields = [...appRequiredFields, 'storageAccount'];
const getPackageObject = (pkgDir, pkgType) => {
    var _a, _b;
    const packageFile = fs_1.default.readFileSync(path_1.default.join(pkgType, pkgDir, 'package.json'), 'utf8');
    const pkgObj = JSON.parse(packageFile);
    if (pkgObj.private !== undefined && pkgObj.private === true) {
        console.log(pkgObj, pkgObj.private);
        throw Error('Excluding publishable packages with the "private" field is not yet supported. Remove it to run the action.');
    }
    const propertiesFromPkgJson = (pkgType === 'apps' ? appRequiredFields : apiRequiredFields).reduce((fieldAcc, field) => {
        const fieldValue = pkgObj[field];
        if (!fieldValue)
            throw Error(`"${field}" is required in ${pkgDir}/package.json`);
        return { ...fieldAcc, [field]: fieldValue };
    }, {});
    const lowercaseRe = /^[a-z]+$/;
    if (((_a = lowercaseRe.exec(pkgObj.id)) === null || _a === void 0 ? void 0 : _a[0].length) !== ((_b = pkgObj.id) === null || _b === void 0 ? void 0 : _b.length))
        throw Error(`"id" field in ${pkgType}/package.json must be all lowercase, only letters`);
    return {
        ...propertiesFromPkgJson,
        type: pkgType.substring(0, pkgType.length - 1),
        path: path_1.default.resolve(pkgDir),
    };
};
const getMonorepoPackages = () => packageTypes.reduce((acc, pkgType) => {
    if (!fs_1.default.existsSync(path_1.default.join(pkgType)))
        return acc;
    const pkgDirs = fs_1.default
        .readdirSync(path_1.default.join(pkgType), { withFileTypes: true })
        .filter((item) => item.isDirectory())
        .map((item) => item.name); // needs to be absolute - currently is app dir name like altimetry-app
    const packagesByType = pkgDirs.map((pkgDir) => getPackageObject(pkgDir, pkgType));
    return [...acc, ...packagesByType];
}, []);
const isMonorepo = packageTypes
    .map((pkg) => fs_1.default.existsSync(path_1.default.join(pkg)))
    .includes(true);
console.log(isMonorepo ? 'Repository is monorepo' : 'Repository is single web app');
const packages = isMonorepo
    ? getMonorepoPackages()
    : [getPackageObject('.', 'apps')];
exports.default = packages;
