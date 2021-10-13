import express from 'express';
import path from 'path'
import helmet from 'helmet';

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// helmet stuff
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'", "'unsafe-inline'", 'localhost', '*.supabase.co', 'cdn.jsdelivr.net', 'unpkg.com'],
    scriptSrc: ["'self'", "'unsafe-inline'", 'localhost', '*.supabase.co', 'cdn.jsdelivr.net', 'unpkg.com'],
    styleSrc: ["'self'", "'unsafe-inline'", 'localhost', '*.supabase.co', 'cdn.jsdelivr.net'],
    connectSrc: ["'self'", "wss://*.supabase.co", "https://*.supabase.co"]
  }
}));

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Count API: listening on port ${port}`);
});

// routes
import { router as routes }  from './routers/routes'
app.use(express.static(path.join(__dirname, 'static')))
app.use('/', routes)

