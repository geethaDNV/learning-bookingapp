import 'dotenv/config';
import { createApp } from './app';

const port = process.env.PORT ? Number(process.env.PORT) : 4002;
const app = createApp();

app.listen(port, () => {
  console.log(`02-items-basic backend listening on http://localhost:${port}`);
});