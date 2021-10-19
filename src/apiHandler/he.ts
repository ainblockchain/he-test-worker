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
    /** req.body
      {
        function: {
          function_type: 'REST',
          function_id: 'requestEvent',
          event_listener: 'http://61.74.65.67:17999/he/request',
          service_name: 'https://ainetwork.ai'
        },
        transaction: {
          tx_body: { operation: [Object], nonce: -1, timestamp: 1634614976395 },
          signature: '0x53dc17b6410700a8c0929550fecdd472629230b66df656e6ab494bc204ee745b49a4fbdf68bd342ac69492c13568ddce6b078f81d2925834ad8690f1f1fba2c30856e3335413fc8a6bef6a8e0811a8bbddcdc8b214838daf2e7bb739fc84ecee1c',
          hash: '0x53dc17b6410700a8c0929550fecdd472629230b66df656e6ab494bc204ee745b',
          address: '0xd7555b3f4aC44FB9661cCF1A32B2Dc8035D99ecc',
          extra: {
            created_at: 1634614978804,
            executed_at: 1634614978804,
            gas: [Object]
          }
        }
      }
    */
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
    console.log(value);

    const op1: any = await axios.get(`${NODE_URL}/get_value?ref=${value.operand1}`);
    const op2: any = await axios.get(`${NODE_URL}/get_value?ref=${value.operand2}`);

    const cOp1 = ainJs.he.seal.seal.CipherText();
    const cOp2 = ainJs.he.seal.seal.CipherText();

    cOp1.load(ainJs.he.seal.context, op1.data.result);
    cOp2.load(ainJs.he.seal.context, op2.data.result);
    ainJs.he.seal.evaluator.add(cOp1, cOp2, cOp1);

    const result = cOp1.save();
    const tx = {
      operation: {
        type: 'SET_VALUE',
        ref: `/apps/he_health_care/tasks/response/${value.user_address}/${requestId}`,
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
      res.sendStatus(200);
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: txRes.result.error_message
      })
    }
  } catch (e: any) {
    console.log(e);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
}
