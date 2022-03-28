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
const core = __importStar(require("@actions/core"));
const child_process_promise_1 = require("child-process-promise");
const chalk_1 = __importDefault(require("chalk"));
exports.default = async () => {
    console.log(`${chalk_1.default.blue.bold('info')}: Logging into Azure CLI...`);
    const azureCredentialsInput = core.getInput('azureCredentials', {
        required: true,
    });
    const azureCredentials = JSON.parse(azureCredentialsInput);
    Object.keys(azureCredentials).forEach((key) => core.setSecret(azureCredentials[key]));
    const { clientId, tenantId, clientSecret } = azureCredentials;
    await (0, child_process_promise_1.exec)(`az login --service-principal --username ${clientId} --tenant ${tenantId} --password ${clientSecret}`);
};
