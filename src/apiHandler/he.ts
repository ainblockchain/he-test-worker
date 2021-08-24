import express from 'express';
import { StatusCodes } from 'http-status-codes';
import AinJs from '@ainblockchain/ain-js';
import * as Const from '../common/constants';

export const double = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    const ainJs = new AinJs(Const.NODE_URL);
    await ainJs.he.init();
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
  } catch (e) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
}

export const add = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    const ainJs = new AinJs(Const.NODE_URL);
    await ainJs.he.init();
    const { operand1, operand2 } = req.body;

    // create ciphertext instance
    const cOp1 = ainJs.he.seal.seal.CipherText();
    const cOp2 = ainJs.he.seal.seal.CipherText();

    cOp1.load(ainJs.he.seal.context, operand1);
    cOp2.load(ainJs.he.seal.context, operand2);
    
    ainJs.he.seal.evaluator.add(cOp1, cOp2, cOp1);

    const result = cOp1.save();
    res.json({ result });
  } catch (e) {
    console.log(e);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
}