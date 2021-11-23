import express from 'express';
import cors from 'cors';
import heRouter from './api/he';

process.setMaxListeners(100);

const app = express();
const port = process.env.NODE_PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ 
  limit: '5mb',
  extended: true,
}));

app.get('/', (req: express.Request, res: express.Response) => {
  res.send(`Homomorphic Encryption Evaluator Worker`);
});

// health checking
app.get('/healthz', async (_, res) => {
  res.send('OK');
});

app.use('/he', heRouter);

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});