require('dotenv').config()

export const NODE_URL = process.env.NODE_URL
  || 'https://dev-api.ainetwork.ai';
export const MNEMONIC_WORDS = process.env.MNEMONIC_WORDS
  || '';

export const DEFAULT_HE_PARAMS = {
  polyModulusDegree: 2048*2,
  scaleBit: 39,
  coeffModulusArray: Int32Array.from([49, 39, 20])
};