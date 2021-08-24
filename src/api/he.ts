import express from 'express';
import * as Handler from '../apiHandler/he'

const router = express.Router();

router.post('/double', Handler.double);
router.post('/add', Handler.add);

export default router;