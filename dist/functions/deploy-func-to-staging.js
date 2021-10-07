"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_promise_1 = require("child-process-promise");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const msgFile = path_1.default.join('github_message.txt');
exports.default = async (pkg, pullNumber) => {
    try {
        const { stdout: listOut, stderr: listErr } = await (0, child_process_promise_1.exec)(`az functionapp deployment slot list -g ${pkg.resourceGroup} -n ${pkg.id}`);
        if (listErr)
            throw Error(listErr);
        const slots = JSON.parse(listOut);
        if (!pullNumber)
            throw Error('The environment variable GITHUB_PR_NUMBER must be defined');
        const slotName = `stag-${pullNumber}`;
        const slotNames = slots.map((slot) => slot.name);
        const slotExists = slotNames.includes(slotName);
        if (!slotExists) {
            await (0, child_process_promise_1.exec)(`az functionapp deployment slot create -g ${pkg.resourceGroup} -n ${pkg.id} --slot ${slotName}`);
        }
        const pkgPathSplit = pkg.path.split('/');
        const pkgDirname = pkgPathSplit[pkgPathSplit.length - 1];
        // Has to be built with dev deps, then zipped with unhoisted prod deps
        const { stdout, stderr: buildErr } = await (0, child_process_promise_1.exec)(`
		cd ${pkg.path} &&
		yarn build ;
		cp -r -L ../${pkgDirname} ../../../ &&
		cd ../../../${pkgDirname} &&
		rm -rf node_modules &&
		yarn install --production &&
		zip -r ${pkg.path}/dist.zip . ; echo "zipped to ${pkg.path}/dist.zip"`);
        console.groupCollapsed([stdout]);
        if (buildErr)
            console.log(buildErr);
        const { stdout: uploadOut, stderr: uploadErr } = await (0, child_process_promise_1.exec)(`cd ${pkg.path} && az functionapp deployment source config-zip -g ${pkg.resourceGroup} -n ${pkg.id} --src dist.zip --slot ${slotName}`);
        if (uploadErr)
            console.log(uploadErr, uploadOut);
        console.log(`Deployed functionapp ${pkg.id}-${slotName}`);
        // Don't think the deployment url gets returned from upload - hopefully this stays static?
        const deployMsg = `\n✅ Deployed functions app **${pkg.id}** on: https://${pkg.id}-${slotName}.azurewebsites.net/api/`;
        console.log(deployMsg);
        fs_1.default.appendFileSync(msgFile, deployMsg);
    }
    catch (err) {
        const deployMsg = `\n❌ Deployment of functions app **${pkg.id}** failed. See CI output for details  `;
        fs_1.default.appendFileSync(msgFile, deployMsg);
        console.error(err);
    }
};
