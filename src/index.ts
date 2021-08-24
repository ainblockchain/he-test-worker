import express from 'express';
import heRouter from './api/he';

const app = express();
const port = 17999;

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ 
  limit: '5mb',
  extended: true,
}));

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