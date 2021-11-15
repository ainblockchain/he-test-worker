import express from 'express';
import cors from 'cors';
import heRouter from './api/he';
import AinJs from '@ainblockchain/ain-js';
import * as Const from './common/constants';

process.setMaxListeners(100);

const app = express();
const port = process.env.NODE_PORT || 5000;
const ainJs = new AinJs(Const.NODE_URL);
const address = ainJs.wallet.addFromHDWallet(Const.MNEMONIC_WORDS);
ainJs.wallet.setDefaultAccount(address);

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ 
  limit: '5mb',
  extended: true,
}));
app.use(async (req, res, next) => {
  res.locals.ainJs = ainJs;
  res.locals.mainAddress = address;
  await res.locals.ainJs.he.init(null, Const.DEFAULT_HE_PARAMS);
  next();
})

app.get('/', (req: express.Request, res: express.Response) => {
  res.send(`Homomorphic Encryption Evaluator Worker (${res.locals.mainAddress})`);
});

// health checking
app.get('/healthz', async (_, res) => {
  res.send('OK');
});

app.use('/he', heRouter);

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});