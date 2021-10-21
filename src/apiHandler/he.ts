import express from 'express';
import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import { NODE_URL } from '../common/constants';

const requestList: string[] = [];

export const double = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    const ainJs = res.locals.ainJs;
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
  } catch (e: any) {
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
    const ainJs = res.locals.ainJs;
    const { operand1, operand2 } = req.body;

    // create ciphertext instance
    const cOp1 = ainJs.he.seal.seal.CipherText();
    const cOp2 = ainJs.he.seal.seal.CipherText();

    cOp1.load(ainJs.he.seal.context, operand1);
    cOp2.load(ainJs.he.seal.context, operand2);
    
    ainJs.he.seal.evaluator.add(cOp1, cOp2, cOp1);

    const result = cOp1.save();
    res.json({ result });
  } catch (e: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
}

export const request = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    const ainJs = res.locals.ainJs;
    const { function: func, transaction } = req.body;
    // TODO: check transaction signature?
    const { ref, value } = transaction.tx_body.operation;
    const parsedRef = ref.split('/');
    const requestId = parsedRef[6];
    if (requestList.includes(requestId)) {
      res.sendStatus(200);
      return;
    } else {
      requestList.push(requestId);
    }
    console.log(`[+] Request received: ${ref}`)
    console.log(`[+] payload: ${JSON.stringify(value)}`);

    const op1: any = await axios.get(`${NODE_URL}/get_value?ref=${value.operand1}`);
    const op2: any = await axios.get(`${NODE_URL}/get_value?ref=${value.operand2}`);

    const cOp1 = ainJs.he.seal.seal.CipherText();
    const cOp2 = ainJs.he.seal.seal.CipherText();

    cOp1.load(ainJs.he.seal.context, op1.data.result);
    cOp2.load(ainJs.he.seal.context, op2.data.result);
    ainJs.he.seal.evaluator.add(cOp1, cOp2, cOp1);

    const result = cOp1.save();
		console.log(`[+] Result for ${requestId}: ${result.substring(0, 15)}...`);
		const resultRef = `/apps/he_health_care/tasks/response/${value.user_address}/${requestId}`;
    const tx = {
      operation: {
        type: 'SET_VALUE',
        ref: resultRef,
        value: {
          result,
          worker_address: res.locals.mainAddress
        }
      },
      address: res.locals.mainAddress,
      nonce: -1,
    }
    const txRes = await ainJs.sendTransaction(tx)
    if (txRes.result.code === 0) {
			console.log(`[+] Write result to '${resultRef}'`);
      res.sendStatus(200);
    } else {
      console.log(`[-] sendTransaction failed: ${txRes.result.error_message}`);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: txRes.result.error_message
      })
    }
  } catch (e: any) {
    console.log(`[-] Internal error: ${e.message}`);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
}
