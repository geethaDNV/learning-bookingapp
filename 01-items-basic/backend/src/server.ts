import 'dotenv/config';
import { createApp } from './app';

const port = process.env.PORT ? Number(process.env.PORT) : 4001;
const app = createApp();

app.listen(port, () => {
  console.log(`01-items-basic backend listening on http://localhost:${port}`);
});
