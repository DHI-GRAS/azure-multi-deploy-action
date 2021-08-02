"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_promise_1 = require("child-process-promise");
const get_changed_packages_1 = __importDefault(require("./functions/get-changed-packages"));
const deployWebApp = async (pkg) => {
    console.log(`Building webapp: ${pkg.name}`);
    const { stdout, stderr } = await child_process_promise_1.exec(`cd ${pkg.path} && yarn ${pkg.name}:build`);
    if (stderr)
        console.log(stderr, stdout);
    console.log(`Build finished, uploading webapp: ${pkg.name}`);
    await child_process_promise_1.exec('az extension add --name storage-preview').catch();
    await child_process_promise_1.exec(`cd ${pkg.path}/dist/ && az storage azcopy blob upload --container \\$web --account-name ${pkg.id} --source ./\\* --auth-mode key`).catch((err) => {
        throw Error(err);
    });
};
const deployFuncApp = async (pkg) => {
    try {
        console.log(`Deploying functionapp: ${pkg.name}`);
        await child_process_promise_1.exec(`cd ${pkg.path} && yarn build && zip -r dist.zip *`);
        const { stderr: uploadErr } = await child_process_promise_1.exec(`cd ${pkg.path} && az functionapp deployment source config-zip -g ${pkg.resourceGroup} -n ${pkg.id} --src dist.zip`);
        if (uploadErr)
            console.log(uploadErr);
        console.log(`Deployed functionapp: ${pkg.id}`);
    }
    catch (err) {
        console.log(`ERROR: could not deploy ${pkg.id} - ${String(err)}`);
    }
};
const deployToProd = async () => {
    const changedPackages = await get_changed_packages_1.default();
    const webPackages = changedPackages.filter((pkg) => pkg.type === 'app');
    const funcPackages = changedPackages.filter((pkg) => pkg.type === 'func-api');
    const allPackages = [...webPackages, ...funcPackages];
    for (const pkg of allPackages) {
        if (pkg.type === 'app')
            await deployWebApp(pkg);
        if (pkg.type === 'func-api')
            await deployFuncApp(pkg);
    }
};
exports.default = deployToProd;
