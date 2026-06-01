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
import { initKronos } from './jobs/cron';
import blogRoutes from './routes/BlogRoutes';
import blogCategoryRoutes from './routes/BlogCategoryRoutes';
import uploadRoutes from './routes/UploadRoutes';
import teamRoutes from './routes/TeamRoutes';
import aiCourseRoutes from './routes/AICourseRoutes';
import moduleAccessRoutes from './routes/ModuleAccessRoutes';
import paymentRoutes from './routes/PaymentRoutes';
import certificateRoutes from './routes/CertificateRoutes';
import voiceTutorRoutes from './routes/VoiceTutorRoutes';
import { authMiddleware } from './middleware/auth';
import { maintenanceMiddleware } from './middleware/maintenance';

dotenv.config();

const startServer = async () => {
    initKronos();

    const app = express();

    // Redirect www.ihub.com to ihub.com
    app.use((req, res, next) => {
        if (req.headers.host === 'www.ihub.com') {
            return res.redirect(301, 'https://ihub.com' + req.url);
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
        'http://localhost:8080,http://localhost:5173,https://www.ihub.com,https://ihub.com,https://*.ihub.com'
    )
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);

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
        ],
    });

    await server.start();

    app.use(
        '/graphql',
        expressMiddleware(server, {
            context: async ({ req }: any) => ({
                user: req.user
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
    // REST ROUTES
    // =============================

    app.use('/api/blogs', blogRoutes);
    app.use('/api/blog-categories', blogCategoryRoutes);
    app.use('/api/upload', uploadRoutes);
    app.use('/api/team', teamRoutes);
    app.use('/api/module-access', moduleAccessRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/certificates', certificateRoutes);
    app.use('/api/ai-courses', aiCourseRoutes); // Enabled for deployment
    app.use('/api/voice-tutor', voiceTutorRoutes);

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
