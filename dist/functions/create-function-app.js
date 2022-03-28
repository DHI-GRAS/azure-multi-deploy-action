"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_promise_1 = require("child-process-promise");
const chalk_1 = __importDefault(require("chalk"));
exports.default = async (pkg) => {
    try {
        if (!pkg.storageAccount) {
            throw Error(`${pkg.id} needs to specify storageAccount`);
        }
        await (0, child_process_promise_1.exec)(`az functionapp create --resource-group ${pkg.resourceGroup} --name ${pkg.id} --storage-account ${pkg.storageAccount} --runtime node --consumption-plan-location northeurope --functions-version 3 --disable-app-insights true`)
            .then(({ stdout }) => {
            const newAccountData = JSON.parse(stdout);
            console.log(`${chalk_1.default.bold.green('Success')}: Created function app: ${chalk_1.default.bold.blue(pkg.id)}: ${chalk_1.default.bold.blue(newAccountData.defaultHostName)}`);
        })
            .catch((err) => {
            throw Error(err);
        });
    }
    catch (err) {
        throw Error(err);
    }
};
