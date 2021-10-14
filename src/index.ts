import express from 'express';
import heRouter from './api/he';
import AinJs from '@ainblockchain/ain-js';
import * as Const from './common/constants';

const app = express();
const port = process.env.NODE_PORT || 5000;

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ 
  limit: '5mb',
  extended: true,
}));
app.use(async (req, res, next) => {
  res.locals.ainJs = new AinJs(Const.NODE_URL);
  await res.locals.ainJs.he.init();
  next();
})

app.get('/', (req: express.Request, res: express.Response) => {
  res.send('Homomorphic Encryption Evaluator Worker');
});

// health checking
app.get('/healthz', async (_, res) => {
  res.send('OK');
});

app.use('/he', heRouter);

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});