import express from 'express';
import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import { DEFAULT_HE_PARAMS } from '../common/constants';

const requestList: string[] = [];

const encodePlain = (he: any, value: number) => {
  const { scaleBit } = DEFAULT_HE_PARAMS;
  return he.seal.encoder.encode([value], Math.pow(2, scaleBit));
}

const getCardRisk = (he: any, value: any) => {
  const {
    op1, /* Total Cholesterol */
    op2, /* Triglyceride */
    op3, /* HDL-Cholesterol */
  } = value;
  const { seal, context } = he.seal;
  const evaluator = seal.evaluator;

  const coeff = [ 0.72976753, -0.31200519, 0.00335608 ];
  const intercept = -12.604077534530276;

  const ciphers = [seal.CipherText(), seal.CipherText(), seal.CipherText()];
  ciphers[0].load(context, op1);
  ciphers[1].load(context, op2);
  ciphers[2].load(context, op3);

  let enc_result = seal.CipherText();
  enc_result = evaluator.multiplyPlain(ciphers[0], encodePlain(he, coeff[0]));
  enc_result = evaluator.rescaleToNext(enc_result);
  for (let i = 1; i < ciphers.length; i = i + 1) {
    let enc_tmp = seal.CipherText();
    enc_tmp = evaluator.multiplyPlain(ciphers[i], encodePlain(he, coeff[i]));
    enc_tmp = evaluator.rescaleToNext(enc_tmp);
    enc_result = evaluator.add(enc_result, enc_tmp);
  }
  enc_result = evaluator.addPlain(enc_result, encodePlain(he, intercept));

  const result = enc_result.save();
  return result;
}

const getFallRisk = (he: any, value: any) => {
  const { seal, context } = he.seal;
  let enc_result = seal.CipherText();
  const result = enc_result.save();
  return result;
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

    let result;
    switch (value.type) {
      case 'cardrisk': // 심혈관질환 위험도
        result = getCardRisk(ainJs.he, value);
        break;
      case 'fallrisk': // 낙상위험도
        result = getFallRisk(ainJs.he, value);
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
      console.log(`[+] tx result: ${JSON.stringify(txRes)}`)
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
