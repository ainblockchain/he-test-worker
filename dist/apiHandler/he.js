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
exports.add = exports.double = void 0;
const http_status_codes_1 = require("http-status-codes");
const ain_js_1 = __importDefault(require("@ainblockchain/ain-js"));
const Const = __importStar(require("../common/constants"));
const double = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ainJs = new ain_js_1.default(Const.NODE_URL);
        const { operand } = req.body;
        // create ciphertext instance
        const cOp1 = ainJs.he.seal.seal.CipherText();
        // load from base64 string
        cOp1.load(ainJs.he.seal.context, operand);
        // doubling input value
        ainJs.he.seal.evaluator(cOp1, cOp1, cOp1);
        // save as base64 string
        const result = cOp1.save();
        res.json({ result });
    }
    catch (e) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: e.message,
        });
    }
});
exports.double = double;
const add = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ainJs = new ain_js_1.default(Const.NODE_URL);
        const { operand1, operand2 } = req.body;
        // create ciphertext instance
        const cOp1 = ainJs.he.seal.seal.CipherText();
        const cOp2 = ainJs.he.seal.seal.CipherText();
        cOp1.load(ainJs.he.seal.context, operand1);
        cOp2.load(ainJs.he.seal.context, operand2);
        ainJs.he.seal.evaluator(cOp1, cOp2, cOp1);
        const result = cOp1.save();
        res.json({ result });
    }
    catch (e) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: e.message,
        });
    }
});
exports.add = add;
