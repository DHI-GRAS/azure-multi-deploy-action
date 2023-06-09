"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_promise_1 = require("child-process-promise");
const github = __importStar(require("@actions/github"));
const chalk_1 = __importDefault(require("chalk"));
const get_changed_packages_1 = __importDefault(require("./functions/get-changed-packages"));
const group_by_subscription_1 = __importDefault(require("./functions/group-by-subscription"));
const commitSha = github.context.sha.substr(0, 7);
chalk_1.default.level = 1;
const deployWebApp = async (pkg) => {
    var _a;
    console.log(`${chalk_1.default.bold.blue('Info')}: Building webapp: ${chalk_1.default.bold(pkg.name)}`);
    const { stdout, stderr } = await (0, child_process_promise_1.exec)(`cd ${pkg.path} && COMMIT_SHA=${commitSha} yarn ${pkg.name}:build`);
    const outputDir = (_a = pkg.outputDir) !== null && _a !== void 0 ? _a : './dist';
    if (stderr) {
        console.log(stderr, stdout);
    }
    console.log(`${chalk_1.default.bold.blue('Info')}: Build finished, uploading webapp: ${chalk_1.default.bold(pkg.name)}`);
    await (0, child_process_promise_1.exec)('az extension add --name storage-preview');
    await (0, child_process_promise_1.exec)(`cd ${pkg.path}/ && az storage blob upload-batch --source ${outputDir} --destination \\$web --account-name ${pkg.id} --auth-mode key --overwrite`);
    console.log(`${chalk_1.default.bold.green('Success')}: Deployed storage account ${chalk_1.default.bold(pkg.id)} on https://${pkg.id}.z16.web.core.windows.net`);
};
const deployFuncApp = async (pkg) => {
    try {
        const pkgPathSplit = pkg.path.split('/');
        const pkgDirname = pkgPathSplit[pkgPathSplit.length - 1];
        console.log(`${chalk_1.default.bold.blue('Info')}: Deploying functionapp: ${chalk_1.default.bold(pkg.name)}`);
        await (0, child_process_promise_1.exec)(`
		cd ${pkg.path} &&
		yarn build ;
		cp -r -L ../${pkgDirname} ../../../ &&
		cd ../../../${pkgDirname} &&
		rm -rf node_modules &&
		yarn install --production &&
		zip -r ${pkg.path}/dist.zip . > /dev/null`);
        const { stderr: uploadErr } = await (0, child_process_promise_1.exec)(`cd ${pkg.path} && az functionapp deployment source config-zip -g ${pkg.resourceGroup} -n ${pkg.id} --src dist.zip`);
        if (uploadErr) {
            console.log(uploadErr);
            throw new Error(uploadErr);
        }
        console.log(`${chalk_1.default.bold.green('Success')}: Deployed functionapp: ${chalk_1.default.bold(pkg.id)}`);
    }
    catch (err) {
        console.log(`${chalk_1.default.bold.red('Error')}: Could not deploy ${pkg.id} - ${String(err)}`);
    }
};
const createMissingResources = async (localConfig, subscriptionId) => {
    console.log('\n');
    console.log(`${chalk_1.default.bold.blue('Info')}: Setting the subscription for production deployment...`);
    const { stderr } = await (0, child_process_promise_1.exec)(`az account set --subscription ${subscriptionId}`);
    if (stderr) {
        throw new Error(stderr);
    }
    console.log(`${chalk_1.default.bold.green('Success')}: subscription set to ${chalk_1.default.bold(subscriptionId)}`);
    const webPackages = localConfig.filter((pkg) => pkg.type === 'app');
    const funcPackages = localConfig.filter((pkg) => pkg.type === 'func-api');
    const allPackages = [...webPackages, ...funcPackages];
    for (const pkg of allPackages) {
        if (pkg.type === 'app') {
            await deployWebApp(pkg);
        }
        if (pkg.type === 'func-api') {
            await deployFuncApp(pkg);
        }
    }
};
const deployToProd = async () => {
    const changedPackages = await (0, get_changed_packages_1.default)();
    const azureResourcesBySubId = (0, group_by_subscription_1.default)(changedPackages);
    for (const subsId of Object.keys(azureResourcesBySubId)) {
        await createMissingResources(azureResourcesBySubId[subsId], subsId);
    }
};
exports.default = deployToProd;
