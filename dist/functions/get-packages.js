"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const packageTypes = ['apps', 'func-apis', 'libs'];
const appRequiredFields = ['name', 'id', 'resourceGroup'];
const appNotRequiredFields = ['outputDir'];
const apiRequiredFields = [...appRequiredFields, 'storageAccount'];
const pkgTypeRequiredFieldMap = {
    apps: appRequiredFields,
    'func-apis': apiRequiredFields,
    libs: [],
};
const getPackageObject = (pkgDir, pkgType) => {
    var _a, _b;
    const fullPath = path_1.default.resolve(path_1.default.join(pkgDir === '.' ? '.' : pkgType, pkgDir));
    const packageFile = fs_1.default.readFileSync(path_1.default.join(fullPath, 'package.json'), 'utf8');
    const pkgObj = JSON.parse(packageFile);
    const pkgRequiredFields = pkgTypeRequiredFieldMap[pkgType];
    const requiredPropertiesFromPkgJson = pkgRequiredFields.reduce((fieldAcc, field) => {
        var _a;
        const fieldValue = (_a = pkgObj.azureDeployConfig) === null || _a === void 0 ? void 0 : _a[field];
        if (!fieldValue)
            throw Error(`"${field}" is required in ${fullPath}/package.json under the "azureDeployConfig" key`);
        return { ...fieldAcc, [field]: fieldValue };
    }, {});
    const notReqPropertiesFromPckJson = appNotRequiredFields.reduce((fieldAcc, field) => {
        var _a;
        const fieldValue = (_a = pkgObj.azureDeployConfig) === null || _a === void 0 ? void 0 : _a[field];
        if (!fieldValue)
            return { ...fieldAcc };
        return { ...fieldAcc, [field]: fieldValue };
    }, {});
    const propertiesFromPckJson = {
        ...requiredPropertiesFromPkgJson,
        ...notReqPropertiesFromPckJson,
    };
    // Enforce only lowecase letters for storage account syntax
    const lowercaseRe = /^[a-z0-9]{1,17}$/;
    if (pkgType === 'apps' &&
        ((_a = lowercaseRe.exec(pkgObj.azureDeployConfig.id)) === null || _a === void 0 ? void 0 : _a[0].length) !==
            ((_b = pkgObj.azureDeployConfig.id) === null || _b === void 0 ? void 0 : _b.length))
        throw Error(`"id" field in ${fullPath}/package.json under the "azureDeployConfig" key must be all lowercase, max 17 charachters.`);
    return {
        ...propertiesFromPckJson,
        type: pkgType.substring(0, pkgType.length - 1),
        path: fullPath,
    };
};
const getMonorepoPackages = () => packageTypes.reduce((acc, pkgType) => {
    if (!fs_1.default.existsSync(path_1.default.join(pkgType)))
        return acc;
    const pkgDirs = fs_1.default
        .readdirSync(path_1.default.join(pkgType), { withFileTypes: true })
        .filter((item) => item.isDirectory())
        .map((item) => item.name);
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
