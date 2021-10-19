require('dotenv').config()

export const NODE_URL = process.env.NODE_URL
  || 'http://node.ainetwork.ai:8080';
export const MNEMONIC_WORDS = process.env.MNEMONIC_WORDS
  || '';