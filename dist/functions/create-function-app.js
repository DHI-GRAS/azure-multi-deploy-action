"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_promise_1 = require("child-process-promise");
const chalk_1 = __importDefault(require("chalk"));
chalk_1.default.level = 1;
exports.default = async (pkg) => {
    if (!pkg.storageAccount) {
        throw new Error(`${chalk_1.default.bold.red('Error')}: ${chalk_1.default.bold(pkg.id)} needs to specify storageAccount`);
    }
    const { stdout, stderr } = await (0, child_process_promise_1.exec)(`az functionapp create --resource-group ${pkg.resourceGroup} --name ${pkg.id} --storage-account ${pkg.storageAccount} --runtime node --consumption-plan-location northeurope --functions-version 3 --disable-app-insights true`);
    if (stderr) {
        throw new Error(stderr);
    }
    const newAccountData = JSON.parse(stdout);
    console.log(`${chalk_1.default.bold.green('Success')}: Created function app: ${chalk_1.default.bold(pkg.id)}: ${chalk_1.default.bold(newAccountData.defaultHostName)}`);
};
