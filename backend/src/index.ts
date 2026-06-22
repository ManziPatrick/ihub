import path from 'path';
import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { Context } from 'graphql-ws';
// @ts-ignore
import { graphqlUploadExpress } from 'graphql-upload';

import connectDB from './config/db';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { monitoringPlugin } from './graphql/monitoringPlugin';
import { initKronos } from './jobs/cron';
import blogRoutes from './routes/BlogRoutes';
import blogCategoryRoutes from './routes/BlogCategoryRoutes';
import uploadRoutes from './routes/UploadRoutes';
import teamRoutes from './routes/TeamRoutes';
import aiCourseRoutes from './routes/AICourseRoutes';
import moduleAccessRoutes from './routes/ModuleAccessRoutes';
import paymentRoutes from './routes/PaymentRoutes';
import certificateRoutes from './routes/CertificateRoutes';
import ttsRoutes from './routes/TTSRoutes';
import diagnosticsRoutes from './routes/DiagnosticsRoutes';
import exportRoutes from './routes/ExportRoutes';
import { Course } from './models/Course';
import { authMiddleware } from './middleware/auth';
import { maintenanceMiddleware } from './middleware/maintenance';
import { compileCode } from './services/compiler.service';
import { generateCourseTemplate } from './services/course-parser.service';

dotenv.config();

const startServer = async () => {
    initKronos();

    const app = express();

    // Trust the first proxy (nginx, Coolify reverse proxy) for correct req.ip
    app.set('trust proxy', 1);

    // Redirect www.bootskills.com to bootskills.com
    app.use((req, res, next) => {
        if (req.headers.host === 'www.bootskills.com') {
            return res.redirect(301, 'https://bootskills.com' + req.url);
        }
        next();
    });

    const httpServer = http.createServer(app);

    await connectDB();

    // =============================
    // ✅ PRODUCTION SAFE CORS
    // =============================

    const allowedOrigins = (
        process.env.ALLOWED_ORIGINS ||
        'http://localhost:8080,http://localhost:5173,http://localhost:8081,http://localhost:8082,https://www.bootskills.com,https://bootskills.com,https://*.bootskills.com'
    )
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);

    if (process.env.NODE_ENV !== 'production') {
        const localDevOrigins = [
            'http://127.0.0.1:8080',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:8081',
            'http://[::1]:8080',
            'http://[::1]:5173',
            'http://[::1]:8081',
        ];
        for (const origin of localDevOrigins) {
            if (!allowedOrigins.includes(origin)) {
                allowedOrigins.push(origin);
            }
        }
    }

    const isAllowedOrigin = (origin: string) => {
        return allowedOrigins.some((allowed) => {
            if (allowed === '*') return true;

            if (allowed.includes('*')) {
                const escaped = allowed
                    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
                    .replace(/\*/g, '.*');
                return new RegExp(`^${escaped}$`).test(origin);
            }

            return allowed === origin;
        });
    };

    const corsOptions: cors.CorsOptions = {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true); // allow server-to-server

            if (isAllowedOrigin(origin)) {
                return callback(null, origin);
            }

            console.warn('❌ Blocked by CORS:', origin);
            return callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'x-apollo-operation-name',
            'apollo-query-plan-experimental',
            'apollo-require-preflight'
        ]
    };

    app.use(cors(corsOptions));

    // Enable preflight globally. In newer path-to-regexp versions, "*" is invalid
    // and throws `Missing parameter name` during startup, so use a regex matcher.
    app.options(/.*/, cors(corsOptions));

    // =============================
    // ✅ GRAPHQL UPLOAD MIDDLEWARE (Must be before body-parser)
    // =============================
    app.use('/graphql', graphqlUploadExpress({
        maxFileSize: 100 * 1024 * 1024, // 100MB
        maxFiles: 5
    }));
    app.use(bodyParser.json({
        limit: '100mb',
        verify: (req: any, _res, buf) => {
            const url = req.originalUrl || '';
            if (url.includes('/payments/webhook')) {
                req.rawBody = buf.toString();
                console.log('--- Webhook Raw Body Captured ---');
            }
        }
    }));
    app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));

    // =============================
    // AUTH & MAINTENANCE MIDDLEWARE
    // =============================

    app.use(authMiddleware);
    app.use(maintenanceMiddleware);

    // =============================
    // GRAPHQL SCHEMA
    // =============================

    const schema = makeExecutableSchema({ typeDefs, resolvers });

    // =============================
    // WEBSOCKET SERVER
    // =============================

    const wsServer = new WebSocketServer({
        server: httpServer,
        path: '/graphql',
    });

    const serverCleanup = useServer({
        schema,
        context: async (ctx: Context) => {
            const token = ctx.connectionParams?.authorization as string || '';
            let user = null;

            if (token) {
                try {
                    user = jwt.verify(
                        token.replace('Bearer ', ''),
                        process.env.JWT_SECRET || 'secret'
                    );
                } catch (e) {
                    console.warn('Invalid WS Token');
                }
            }

            return { user };
        }
    }, wsServer);

    // =============================
    // APOLLO SERVER
    // =============================

    const server = new ApolloServer({
        schema,
        plugins: [
            ApolloServerPluginDrainHttpServer({ httpServer }),
            {
                async serverWillStart() {
                    return {
                        async drainServer() {
                            await serverCleanup.dispose();
                        },
                    };
                },
            },
            monitoringPlugin,
        ],
    });

    await server.start();

    app.use(
        '/graphql',
        expressMiddleware(server, {
            context: async ({ req }: any) => ({
                user: req.user,
                req
            }),
        }) as unknown as express.RequestHandler
    );

    // =============================
    // HEALTH CHECK (Docker / Coolify)
    // =============================

    app.get('/health', (_req, res) => {
        res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // =============================
    // SEO / SITEMAP ROUTES
    // =============================

    // Dynamic course sitemap for search engines & AI crawlers
    app.get('/course-sitemap.xml', async (_req, res) => {
      try {
        const courses = await Course.find({
          isDeleted: { $ne: true },
          status: { $in: ['published'] }
        }).select('title description updatedAt').lean();

        const baseUrl = process.env.FRONTEND_URL || 'https://bootskills.com';
        const urls = courses.map((c: any) => `
    <url>
      <loc>${baseUrl}/courses/${c._id}</loc>
      <lastmod>${c.updatedAt ? new Date(c.updatedAt).toISOString().split('T')[0] : '2026-06-08'}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.9</priority>
      <image:image>
        <image:loc>${baseUrl}/og-course.jpg</image:loc>
        <image:title>${c.title?.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</image:title>
      </image:image>
    </url>`).join('');

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${urls}
</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.send(xml);
      } catch (err) {
        console.error('❌ Failed to generate sitemap:', err);
        res.status(500).send('Sitemap generation failed');
      }
    });

    // AI crawler / GEO optimized endpoint — returns course listing as structured JSON
    app.get('/api/seo/courses', async (_req, res) => {
      try {
        const courses = await Course.find({
          isDeleted: { $ne: true },
          status: { $in: ['published'] }
        }).select('title description price level category school instructor createdAt').populate('instructor', 'username').limit(100).lean();

        const baseUrl = process.env.FRONTEND_URL || 'https://bootskills.com';
        const data = (courses as any[]).map(c => ({
          '@type': 'Course',
          name: c.title,
          description: c.description?.substring(0, 300),
          url: `${baseUrl}/courses/${c._id}`,
          provider: { '@type': 'Organization', name: c.school || 'Bootskills', sameAs: baseUrl },
          offers: { '@type': 'Offer', price: c.price || 0, priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
          educationalLevel: c.level || 'Beginner',
          category: c.category
        }));

        res.json({ '@context': 'https://schema.org', '@graph': data });
      } catch (err) {
        console.error('❌ Failed to fetch SEO courses:', err);
        res.status(500).json({ error: 'Failed to fetch courses' });
      }
    });

    // =============================
    // REST ROUTES
    // =============================

    app.use('/api/blogs', blogRoutes);
    app.use('/api/blog-categories', blogCategoryRoutes);
    app.use('/api/upload', uploadRoutes);
    app.use('/api/export', exportRoutes);

    // =============================
    // COURSE DOCUMENT TEMPLATE DOWNLOAD
    // =============================
    app.get('/api/course-template', (_req, res) => {
        const template = generateCourseTemplate();
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="course-template.txt"');
        res.send(template);
    });
    // =============================
    // STATIC FILES — serve uploaded PDFs (NDAs, certificates, invoices)
    // =============================
    app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    app.use('/api/team', teamRoutes);
    app.use('/api/module-access', moduleAccessRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/certificates', certificateRoutes);
    app.use('/api/ai-courses', aiCourseRoutes); // Enabled for deployment
    app.use('/api/tts', ttsRoutes);
    app.use('/api/health', diagnosticsRoutes);

    // =============================
    // ONLINE CODE COMPILER ENDPOINT
    // =============================
    app.post('/api/compile', async (req, res) => {
      try {
        const { code, language, testCode, exerciseType, setupCode } = req.body;
        
        if (!code) {
          return res.status(400).json({ error: 'No code provided' });
        }

        const result = await compileCode({
          code,
          language: language || 'javascript',
          testCode,
          exerciseType,
          setupCode,
        });

        res.json(result);
      } catch (err: any) {
        console.error('❌ Compile error:', err);
        res.status(500).json({
          output: '',
          passed: false,
          testResults: [],
          error: err.message || 'Compilation failed',
        });
      }
    });

    // =============================
    // GLOBAL ERROR HANDLER
    // =============================

    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
        console.error('🔥 Server Error:', err);
        res.status(500).json({
            message: err.message || 'Internal Server Error'
        });
    });

    const PORT = process.env.PORT || 4000;

    httpServer.listen(Number(PORT), () => {
        console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    });
};

startServer().catch(err => {
    console.error('CRITICAL STARTUP ERROR:', err);
});
