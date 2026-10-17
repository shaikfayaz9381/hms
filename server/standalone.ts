import { app } from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = parseInt(process.env.PORT || '5000', 10);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[MedPulse Standalone API] Running on http://0.0.0.0:${PORT}`);
  console.log(`[MedPulse Standalone API] API routes: http://0.0.0.0:${PORT}/api/`);
});
