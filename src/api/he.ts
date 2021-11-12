import express from 'express';
import * as Handler from '../apiHandler/he'

const router = express.Router();

router.post('/request', Handler.request);

export default router;