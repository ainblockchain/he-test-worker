import express from 'express';
import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import AinJs from '@ainblockchain/ain-js';
import { TransactionInput } from '@ainblockchain/ain-js/lib/types';

import {
  NODE_URL,
  MNEMONIC_WORDS,
  DEFAULT_HE_PARAMS
} from '../common/constants';

const requestList: string[] = [];

const getEncryptStrFromBlockchain = async (path: string, nodeSeal: any) => {
  const { context, seal } = nodeSeal;
  const str: any = await axios.get(`${NODE_URL}/get_value?ref=${path}`);
  const cipherText = seal.CipherText();
  cipherText.load(context, str.data.result);

  return cipherText;
}

const encodePlain = (he: any, value: number, scale: any, parmsId: any) => {
  const target = Float64Array.from([value]);
  let plainText = he.seal.encoder.encode(target, scale);
  plainText = he.seal.evaluator.plainModSwitchTo(plainText, parmsId);
  return plainText;
}

const getCardRisk = async (he: any, value: any) => {
  const {
    op1Path, /* Total Cholesterol */
    op2Path, /* Triglyceride */
    op3Path, /* HDL-Cholesterol */
  } = value;
  const { evaluator, context } = he.seal;

  const coeff = [ 0.72976753, -0.31200519, 0.00335608 ];
  const intercept = -12.604077534530276;

  const ciphers = new Array<any>(3);
  ciphers[0] = await getEncryptStrFromBlockchain(op1Path, he.seal);
  ciphers[1] = await getEncryptStrFromBlockchain(op2Path, he.seal);
  ciphers[2] = await getEncryptStrFromBlockchain(op3Path, he.seal);

  let enc_result = evaluator.multiplyPlain(ciphers[0],
    encodePlain(he, coeff[0], ciphers[0].scale, ciphers[0].parmsId));
  enc_result = evaluator.rescaleToNext(enc_result);
  for (let i = 1; i < ciphers.length; i = i + 1) {
    let enc_tmp = evaluator.multiplyPlain(ciphers[i],
      encodePlain(he, coeff[i], ciphers[i].scale, ciphers[0].parmsId));
    enc_tmp = evaluator.rescaleToNext(enc_tmp);
    enc_result = evaluator.add(enc_result, enc_tmp);
  }
  enc_result = evaluator.addPlain(enc_result,
    encodePlain(he, intercept, enc_result.scale, enc_result.parmsId));

  const result = enc_result.save();
  return result;
}

const getFallRisk = async (he: any, value: any) => {
  const {
    op1Path,
    op2Path,
    op3Path,
  } = value;
  const cOp1 = await getEncryptStrFromBlockchain(op1Path, he.seal);
  const cOp2 = await getEncryptStrFromBlockchain(op2Path, he.seal);
  const cOp3 = await getEncryptStrFromBlockchain(op3Path, he.seal);

  let enc_result = he.seal.evaluator.add(cOp1, cOp2);
  enc_result = he.seal.evaluator.add(enc_result, cOp3);

  const result = enc_result.save();
  return result;
}

export const request = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    const ainJs = new AinJs(NODE_URL);
    const address = ainJs.wallet.addFromHDWallet(MNEMONIC_WORDS);
    ainJs.wallet.setDefaultAccount(address);
    await ainJs.he.init(null, DEFAULT_HE_PARAMS);

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

    let result;
    switch (value.type) {
      case 'cardrisk': // 심혈관질환 위험도
        result = await getCardRisk(ainJs.he, value);
        break;
      case 'fallrisk': // 낙상위험도
        result = await getFallRisk(ainJs.he, value);
        break;
      default:
        console.log(`[-] Unknown request type: ${value.type}`);
        res.status(StatusCodes.NOT_FOUND).json({
          message: `Unknown request type: ${value.type}`
        });
        return;
    }

		console.log(`[+] Result for ${requestId}: ${result.substring(0, 15)}...`);
		const resultRef = `/apps/he_health_care/tasks/response/${value.user_address}/${requestId}`;
    const tx: TransactionInput = {
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
    if (txRes.result && txRes.result.code === 0) {
			console.log(`[+] Write result to '${resultRef}'`);
      console.log(`[+] tx result: ${JSON.stringify(txRes)}`)
      res.sendStatus(200);
    } else {
      const msg = txRes.result ? txRes.result.error_message : txRes.message;
      console.log(`[-] sendTransaction failed: ${msg}`);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: msg
      })
    }
  } catch (e: any) {
    console.log(`[-] Internal error: ${e.message}`);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
}

/* 
export const cardRisk = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    const he = res.locals.ainJs.he;
    const { op1, op2, op3 } = req.body;
    const { evaluator, context, seal } = he.seal;
    console.log('[+] Request received: cardRisk');
    // console.log(`[+] payload: ${JSON.stringify(req.body)}`);

    const coeff = [ 0.72976753, -0.31200519, 0.00335608 ];
    const intercept = -12.604077534530276;

    const ciphers = [seal.CipherText(), seal.CipherText(), seal.CipherText()];
    ciphers[0].load(context, op1);
    ciphers[1].load(context, op2);
    ciphers[2].load(context, op3);

    let enc_result = evaluator.multiplyPlain(ciphers[0],
      encodePlain(he, coeff[0], ciphers[0].scale, ciphers[0].parmsId));
    enc_result = evaluator.rescaleToNext(enc_result);
    for (let i = 1; i < ciphers.length; i = i + 1) {
      let enc_tmp = evaluator.multiplyPlain(ciphers[i],
        encodePlain(he, coeff[i], ciphers[i].scale, ciphers[i].parmsId));
      enc_tmp = evaluator.rescaleToNext(enc_tmp);
      enc_result = evaluator.add(enc_result, enc_tmp);
    }
    enc_result = evaluator.addPlain(enc_result,
      encodePlain(he, intercept, enc_result.scale, enc_result.parmsId));

    const result = enc_result.save();
    console.log(`[+] Result for cardRisk: ${result.substring(0, 15)}...`);
    res.status(StatusCodes.OK).json({ result });
  } catch (e: any) {
    console.log(`[-] Internal error: ${e.message}`);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
}
*/