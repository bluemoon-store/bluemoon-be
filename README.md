# Jinx.to 🚀

## 🛠️ Tech Stack

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.9
- **Database**: PostgreSQL with Prisma ORM 6.x
- **Cache/Queue**: Redis with Bull 4.x
- **Authentication**: JWT with Passport
- **File Storage**: AWS S3
- **Email**: AWS SES
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest 30.x with SWC
- **Logging**: Pino (structured JSON logging)
- **Validation**: class-validator & class-transformer
- **Containerization**: Docker & Docker Compose

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0
- Yarn >= 1.22.0
- Docker & Docker Compose (for containerized setup)
- PostgreSQL (if running locally)
- Redis (if running locally)

### 1. Environment Setup

```bash
# Copy environment template
cp .env.docker .env

# Edit the environment file with your configuration
nano .env  # or use your preferred editor
```

### 3. Database Setup

```bash
# Generate Prisma client
yarn generate

# Run database migrations
yarn migrate
```

### 4. Start Development Server

```bash
# Development mode with hot reload
yarn dev

# Or using Docker Compose (recommended for full stack)
docker-compose up --build
```

The API will be available at:
- **API**: http://localhost:3001
- **Documentation**: http://localhost:3001/docs

## 📋 Environment Configuration

Create a `.env` file based on `.env.docker` template. All environment variables are documented with comments in the template file.

### Application Settings

| Variable            | Description                              | Default       | Required |
| ------------------- | ---------------------------------------- | ------------- | -------- |
| `APP_ENV`           | Environment mode                         | `local`       | Yes      |
| `APP_NAME`          | Application name                         | `jinx.to` | No    |
| `APP_DEBUG`         | Enable debug mode                        | `true`        | No       |
| `APP_LOG_LEVEL`     | Logging level                            | `debug`       | No       |
| `APP_CORS_ORIGINS`  | Comma-separated allowed CORS origins     | `*`           | No       |

### HTTP Server Configuration

| Variable                   | Description                   | Default   | Required |
| -------------------------- | ----------------------------- | --------- | -------- |
| `HTTP_HOST`                | Server bind address           | `0.0.0.0` | No       |
| `HTTP_PORT`                | Server port                   | `3001`    | No       |
| `HTTP_VERSIONING_ENABLE`   | Enable API versioning         | `true`    | No       |
| `HTTP_VERSION`             | Default API version           | `1`       | No       |

### Authentication & JWT

| Variable                    | Description                  | Example                                 | Required |
| --------------------------- | ---------------------------- | --------------------------------------- | -------- |
| `AUTH_ACCESS_TOKEN_SECRET`  | JWT access token secret      | Generate with `openssl rand -base64 32` | Yes      |
| `AUTH_REFRESH_TOKEN_SECRET` | JWT refresh token secret     | Generate with `openssl rand -base64 32` | Yes      |
| `AUTH_ACCESS_TOKEN_EXP`     | Access token expiration      | `1d` (1 day)                            | No       |
| `AUTH_REFRESH_TOKEN_EXP`    | Refresh token expiration     | `7d` (7 days)                           | No       |

### Database Configuration

| Variable       | Description                  | Example                                              | Required |
| -------------- | ---------------------------- | ---------------------------------------------------- | -------- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?schema=public` | Yes      |

### AWS Configuration

| Variable                      | Description                      | Example       | Required           |
| ----------------------------- | -------------------------------- | ------------- | ------------------ |
| `AWS_ACCESS_KEY`              | AWS IAM access key               | -             | For AWS features   |
| `AWS_SECRET_KEY`              | AWS IAM secret key               | -             | For AWS features   |
| `AWS_S3_REGION`               | S3 bucket region                 | `us-east-1`   | For S3 uploads     |
| `AWS_S3_BUCKET`               | S3 bucket name                   | `my-bucket`   | For S3 uploads     |
| `AWS_S3_PRESIGN_LINK_EXPIRES` | Pre-signed URL expiration (sec)  | `1200`        | No                 |
| `AWS_SES_REGION`              | SES service region               | `us-east-1`   | For email service  |
| `AWS_SES_SOURCE_EMAIL`        | Verified sender email            | `no-reply@example.com` | For email service |

### Redis Configuration

| Variable           | Description           | Default     | Required |
| ------------------ | --------------------- | ----------- | -------- |
| `REDIS_HOST`       | Redis host            | `redis`     | Yes      |
| `REDIS_PORT`       | Redis port            | `6379`      | No       |
| `REDIS_PASSWORD`   | Redis password        | -           | No       |
| `REDIS_ENABLE_TLS` | Enable TLS for Redis  | `false`     | No       |

### Error Tracking

| Variable      | Description                | Example | Required |
| ------------- | -------------------------- | ------- | -------- |
| `SENTRY_DSN`  | Sentry error tracking DSN  | -       | No       |

### Quick Setup

```bash
# Copy environment template
cp .env.docker .env

# Generate JWT secrets
echo "AUTH_ACCESS_TOKEN_SECRET=$(openssl rand -base64 32)" >> .env
echo "AUTH_REFRESH_TOKEN_SECRET=$(openssl rand -base64 32)" >> .env

# Edit remaining values
nano .env
```

## 🐳 Docker Setup

### Development with Docker Compose

```bash
# Start all services (app, database, redis)
docker-compose up --build

# Start only database and Redis (run app locally)
docker-compose up postgres redis

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Docker Build

```bash
# Build production image (uses ci/Dockerfile for production)
docker build -f ci/Dockerfile -t jinx.to:latest .

# Run production container
docker run -p 3001:3001 --env-file .env jinx.to:latest
```

## 📚 API Documentation

### Swagger UI

Visit `/docs` endpoint when the server is running for interactive API documentation.

### Authentication

The API uses JWT Bearer token authentication:

```bash
# Login to get tokens
curl -X POST http://localhost:3001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Use access token in requests
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3001/v1/user/profile
```

## 🧪 Testing

The project uses Jest with SWC for fast test execution. Tests are located in the `test/` directory, mirroring the `src/` structure.

```bash
# Run all tests
yarn test

# Run tests in watch mode (requires manual setup)
jest --config test/jest.json --watch

# Debug tests
yarn test:debug
```

**Test Structure**:
- `test/common/` - Tests for shared services (auth, database, helpers, AWS)
- `test/modules/` - Tests for feature modules (user, post)
- `test/workers/` - Tests for background processors
- `test/mocks/` - Mock data generators using @faker-js/faker

**Example Test**:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from 'src/modules/user/services/user.service';

describe('UserService', () => {
    let service: UserService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UserService, /* mock dependencies */],
        }).compile();

        service = module.get<UserService>(UserService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
```

## 📁 Project Structure

```
src/
├── app/                    # Application module and health checks
├── common/                 # Shared modules and utilities
│   ├── auth/              # Authentication logic
│   ├── aws/               # AWS services (S3, SES)
│   ├── config/            # Configuration files
│   ├── database/          # Database service and connection
│   ├── file/              # File upload handling
│   ├── helper/            # Utility services
│   ├── logger/            # Logging configuration
│   ├── message/           # Internationalization
│   ├── request/           # Request decorators and guards
│   └── response/          # Response interceptors and filters
├── languages/             # Translation files
├── migrations/            # Database seeders and migrations
├── modules/               # Feature modules
│   ├── post/              # Post management
│   └── user/              # User management
└── workers/               # Background job processors
```

## 🔧 Development Workflow

### Code Quality

```bash
# Lint code
yarn lint

# Format code
yarn format

# Type checking
yarn build
```

### Database Operations

```bash
# Generate Prisma client after schema changes
yarn generate

# Create new migration
yarn migrate

# Deploy migrations to production
yarn migrate:prod

# Open Prisma Studio
yarn studio
```

## 🚀 Deployment

### Docker Production (Recommended)

```bash
# Build and tag production image
docker build -f ci/Dockerfile -t your-registry/jinx.to:v1.0.0 .

# Push to registry
docker push your-registry/jinx.to:v1.0.0

# Run with Docker
docker run -d -p 3001:3001 --env-file .env --name nestjs-app your-registry/jinx.to:v1.0.0

# Or deploy with Docker Compose (full stack)
docker-compose up -d --build
```

### Railway Deployment

```bash
# 1) Install CLI and login
npm i -g @railway/cli@latest
railway login

# 2) Init/link project
railway init
# or: railway link --project <PROJECT_ID>

# 3) Deploy current service
railway up
```

Recommended Railway service commands:

- Build Command: `yarn install --frozen-lockfile && yarn build`
- Start Command: `yarn start`

Required environment variables (minimum):

```env
APP_ENV=production
HTTP_HOST=0.0.0.0
# HTTP_PORT is optional on Railway because PORT is injected automatically
DATABASE_URL=postgresql://...
REDIS_HOST=redis.railway.internal
REDIS_PORT=6379
REDIS_PASSWORD=...
REDIS_ENABLE_TLS=false
```

Notes:

- Railway does not deploy directly from `docker-compose.yml`; create separate services instead.
- Use Railway private Redis hostname (`redis.railway.internal`) for backend-to-Redis connection.
- If you split API and worker, deploy them as 2 services from the same repo with different start commands.

### Cloud Deployment Examples

#### AWS ECS
```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name jinx.to --region us-east-1

# 2. Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# 3. Build and push
docker build -f ci/Dockerfile -t jinx.to:latest .
docker tag jinx.to:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/jinx.to:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/jinx.to:latest

# 4. Create ECS task definition and service through AWS Console or CLI
```

#### Google Cloud Run
```bash
# 1. Build and submit to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT-ID/jinx.to

# 2. Deploy to Cloud Run
gcloud run deploy jinx.to \
  --image gcr.io/PROJECT-ID/jinx.to \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "APP_ENV=production" \
  --port 3001
```

#### DigitalOcean App Platform
```bash
# 1. Push to Docker Hub or DigitalOcean Container Registry
docker build -f ci/Dockerfile -t your-dockerhub/jinx.to:latest .
docker push your-dockerhub/jinx.to:latest

# 2. Create app via DigitalOcean Console
#    - Select Docker Hub as source
#    - Configure environment variables
#    - Add PostgreSQL and Redis managed databases
```

#### Heroku
```bash
# 1. Login to Heroku
heroku login
heroku container:login

# 2. Create app
heroku create your-app-name

# 3. Add PostgreSQL and Redis addons
heroku addons:create heroku-postgresql:mini
heroku addons:create heroku-redis:mini

# 4. Build and push
docker build -f ci/Dockerfile -t registry.heroku.com/your-app-name/web .
docker push registry.heroku.com/your-app-name/web

# 5. Release
heroku container:release web -a your-app-name
```

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit sensitive data - use `.env.docker` as template only
2. **JWT Secrets**: Use strong, randomly generated secrets (minimum 32 characters)
   ```bash
   openssl rand -base64 32
   ```
3. **Global Guards**: All routes are protected by default (JWT, Roles, Throttler)
4. **Password Hashing**: Uses Argon2 for secure password storage
5. **Rate Limiting**: Throttler guard prevents brute force attacks
6. **CORS**: Configure `APP_CORS_ORIGINS` to restrict allowed domains
7. **Helmet**: Security headers configured automatically
8. **Input Validation**: class-validator validates all DTOs automatically
9. **Database**: Use connection pooling, read replicas, and prepared statements (Prisma handles this)
10. **HTTPS**: Always use TLS in production
11. **Monitoring**: Sentry integration for error tracking and monitoring
12. **Soft Deletes**: Models support soft deletion to prevent data loss

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Database Connection Issues

**Problem**: `Error: Can't reach database server`

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check DATABASE_URL format
# Correct: postgresql://username:password@host:5432/database?schema=public

# For Docker: use service name as host
DATABASE_URL="postgresql://postgres:password@postgres:5432/db"

# For local: use localhost
DATABASE_URL="postgresql://postgres:password@localhost:5432/db"
```

#### Redis Connection Issues

**Problem**: `Error: Redis connection refused`

```bash
# Check if Redis is running
docker-compose ps redis

# Verify REDIS_HOST matches your setup
# Docker: REDIS_HOST=redis
# Local: REDIS_HOST=localhost
```

#### Prisma Migration Errors

**Problem**: `Migration failed` or `Schema is out of sync`

```bash
# Reset database (⚠️ DESTRUCTIVE - development only)
docker-compose down -v
docker-compose up -d postgres redis
yarn generate
yarn migrate

# For production, run migrations explicitly
yarn migrate:prod

# If stuck, check migration status
npx prisma migrate status
```

#### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3001`

```bash
# Find process using the port (macOS/Linux)
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or use a different port
HTTP_PORT=3002 yarn dev
```

#### Docker Build Fails

**Problem**: `ERROR [builder X/Y] RUN yarn install --frozen-lockfile`

```bash
# Clear Docker build cache
docker builder prune -af

# Rebuild without cache
docker-compose build --no-cache

# Check Docker resources (ensure enough memory/disk)
docker system df
docker system prune
```

#### JWT Token Issues

**Problem**: `Unauthorized` or `Invalid token`

```bash
# Ensure secrets are properly set
echo $AUTH_ACCESS_TOKEN_SECRET
echo $AUTH_REFRESH_TOKEN_SECRET

# Secrets must be the same across restarts
# Use strong random values (min 32 characters)
openssl rand -base64 32

# Check token expiration settings
AUTH_ACCESS_TOKEN_EXP=1d   # 1 day
AUTH_REFRESH_TOKEN_EXP=7d  # 7 days
```

#### AWS S3/SES Integration Issues

**Problem**: `AccessDenied` or `InvalidAccessKeyId`

```bash
# Verify AWS credentials
aws configure list
aws sts get-caller-identity

# Check IAM permissions for S3
# Required: s3:PutObject, s3:GetObject, s3:DeleteObject

# Check IAM permissions for SES
# Required: ses:SendEmail, ses:SendRawEmail

# Verify email is verified in SES (sandbox mode)
aws ses list-verified-email-addresses

# Check S3 bucket exists and region matches
aws s3 ls s3://your-bucket-name --region us-east-1
```

#### Tests Failing

**Problem**: Tests fail unexpectedly

```bash
# Clear test cache
yarn test --clearCache

# Run tests with verbose output
yarn test --verbose

# Run specific test file
yarn test --testPathPattern=user.service.spec.ts

# Check for missing mocks
# Ensure all external dependencies are properly mocked
```

#### TypeScript Compilation Errors

**Problem**: `error TS2307: Cannot find module`

```bash
# Clear build cache and reinstall
rm -rf dist node_modules yarn.lock
yarn install
yarn build

# Regenerate Prisma client
yarn generate

# Check tsconfig.json paths configuration
```

#### Memory/Performance Issues

**Problem**: Application crashes or runs slowly

```bash
# Check memory usage
docker stats

# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" yarn start

# Enable garbage collection logs
NODE_OPTIONS="--trace-gc" yarn dev

# Check for memory leaks in production
# Use clinic.js or node --inspect
```

#### Email Not Sending (SES)

**Problem**: Emails not being sent

```bash
# Check SES sandbox mode
# In sandbox, you can only send to verified emails

# Verify sender email
aws ses verify-email-identity --email-address your-email@domain.com

# Check SES sending quota
aws ses get-send-quota

# Check email queue (Bull)
# Visit Bull Board or check Redis
redis-cli KEYS "bull:email:*"

# Check worker logs
docker-compose logs worker
```

### Getting Help

If you encounter issues not covered here:

1. **Check Logs**: Always start with application logs
   ```bash
   # Docker
   docker-compose logs -f server
   ```

2. **Enable Debug Mode**:
   ```bash
   APP_DEBUG=true
   APP_LOG_LEVEL=debug
   ```

3. **Search Issues**: Check [GitHub Issues](https://github.com/hmake98/jinx.to/issues)

4. **Create an Issue**: Provide:
   - Error message
   - Steps to reproduce
   - Environment (Node version, OS, Docker)
   - Relevant logs

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript and ESLint rules
- Write tests for new features
- Update documentation when needed
- Use conventional commit messages
- Ensure all tests pass before submitting PR

## 📄 Scripts Reference

| Script          | Description                              |
| --------------- | ---------------------------------------- |
| `yarn dev`      | Start development server with hot reload |
| `yarn build`    | Build for production                     |
| `yarn start`    | Start production server                  |
| `yarn test`     | Run unit tests                           |
| `yarn lint`     | Lint and fix code                        |
| `yarn format`   | Format code with Prettier                |
| `yarn generate` | Generate Prisma client                   |
| `yarn migrate`  | Run database migrations                  |
| `yarn studio`   | Open Prisma Studio                       |

## 🔗 Useful Links

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Passport JWT Strategy](http://www.passportjs.org/packages/passport-jwt/)
- [Bull Queue](https://github.com/OptimalBits/bull)
- [Pino Logger](https://getpino.io/)
- [class-validator](https://github.com/typestack/class-validator)
- [Docker Documentation](https://docs.docker.com)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Harsh Makwana**

- 🌐 [GitHub](https://github.com/hmake98)
- 💼 [LinkedIn](https://www.linkedin.com/in/hmake98)
- 📷 [Instagram](https://www.instagram.com/hmake98)

## 🙏 Support

If this project helped you, please consider giving it a ⭐️!

---

**Happy Coding! 🎉**
