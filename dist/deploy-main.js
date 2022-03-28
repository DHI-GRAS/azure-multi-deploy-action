"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const child_process_promise_1 = require("child-process-promise");
const github = __importStar(require("@actions/github"));
const get_changed_packages_1 = __importDefault(require("./functions/get-changed-packages"));
const commitSha = github.context.sha.substr(0, 7);
const deployWebApp = (pkg) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log(`Building webapp: ${pkg.name}`);
    const { stdout, stderr } = yield (0, child_process_promise_1.exec)(`cd ${pkg.path} && COMMIT_SHA=${commitSha} yarn ${pkg.name}:build`);
    const outputDir = (_a = pkg.outputDir) !== null && _a !== void 0 ? _a : './dist';
    if (stderr)
        console.log(stderr, stdout);
    console.log(`Build finished, uploading webapp: ${pkg.name}`);
    yield (0, child_process_promise_1.exec)('az extension add --name storage-preview').catch();
    yield (0, child_process_promise_1.exec)(`cd ${pkg.path}/ && az storage blob upload-batch --source ${outputDir} --destination \\$web --account-name ${pkg.id} --auth-mode key --overwrite`).catch((err) => {
        throw Error(err);
    });
});
const deployFuncApp = (pkg) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pkgPathSplit = pkg.path.split('/');
        const pkgDirname = pkgPathSplit[pkgPathSplit.length - 1];
        console.log(`Deploying functionapp: ${pkg.name}`);
        yield (0, child_process_promise_1.exec)(`
		cd ${pkg.path} &&
		yarn build ;
		cp -r -L ../${pkgDirname} ../../../ &&
		cd ../../../${pkgDirname} &&
		rm -rf node_modules &&
		yarn install --production &&
		zip -r ${pkg.path}/dist.zip . > /dev/null`);
        const { stderr: uploadErr } = yield (0, child_process_promise_1.exec)(`cd ${pkg.path} && az functionapp deployment source config-zip -g ${pkg.resourceGroup} -n ${pkg.id} --src dist.zip`);
        if (uploadErr)
            console.log(uploadErr);
        console.log(`Deployed functionapp: ${pkg.id}`);
    }
    catch (err) {
        console.log(`ERROR: could not deploy ${pkg.id} - ${String(err)}`);
    }
});
const createMissingResources = (localConfig, subscriptionId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\nSetting the subscription for production deployment...');
    yield (0, child_process_promise_1.exec)(`az account set --subscription ${subscriptionId}`);
    console.log(`subscription set to ${subscriptionId}`);
    const webPackages = localConfig.filter((pkg) => pkg.type === 'app');
    const funcPackages = localConfig.filter((pkg) => pkg.type === 'func-api');
    const allPackages = [...webPackages, ...funcPackages];
    for (const pkg of allPackages) {
        if (pkg.type === 'app')
            yield deployWebApp(pkg);
        if (pkg.type === 'func-api')
            yield deployFuncApp(pkg);
    }
});
const deployToProd = () => __awaiter(void 0, void 0, void 0, function* () {
    const changedPackages = yield (0, get_changed_packages_1.default)();
    const groupBySubscription = changedPackages.reduce((acc, item) => {
        acc[item.subscriptionId] = [...(acc[item.subscriptionId] || []), item];
        return acc;
    }, {});
    for (const subsId of Object.keys(groupBySubscription)) {
        yield createMissingResources(groupBySubscription[subsId], subsId);
    }
});
exports.default = deployToProd;
