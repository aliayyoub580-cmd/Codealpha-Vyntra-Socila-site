import app from './app.js';

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`Vyntra Social is running at http://localhost:${port}`);
});
