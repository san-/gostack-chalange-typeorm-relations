import { json } from 'express';
import app from './app';

app.use(json());

app.listen(3333, () => {
  console.log('🚀 Server started on port 3333!');
});
