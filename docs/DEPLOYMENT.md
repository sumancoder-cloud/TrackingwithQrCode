# Deployment Guide

## 🚀 Deployment Options

### 1. Netlify (Frontend) + Heroku (Backend)

#### Frontend Deployment (Netlify)

1. **Build the React app**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy to Netlify**
   - Connect your GitHub repository to Netlify
   - Set build command: `cd client && npm run build`
   - Set publish directory: `client/build`
   - Add environment variables in Netlify dashboard

3. **Environment Variables**
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
   REACT_APP_API_URL=https://your-backend-url.herokuapp.com
   ```

#### Backend Deployment (Heroku)

1. **Create Heroku app**
   ```bash
   heroku create your-app-name
   ```

2. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set PORT=5000
   heroku config:set JWT_SECRET=your_jwt_secret
   ```

3. **Deploy**
   ```bash
   git subtree push --prefix server heroku main
   ```

### 2. Vercel (Full-Stack)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Configure vercel.json**
   ```json
   {
     "builds": [
       {
         "src": "client/package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "build"
         }
       },
       {
         "src": "server/server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/server/server.js"
       },
       {
         "src": "/(.*)",
         "dest": "/client/build/$1"
       }
     ]
   }
   ```

### 3. Firebase Hosting + Cloud Functions

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Firebase**
   ```bash
   firebase init hosting
   firebase init functions
   ```

3. **Deploy**
   ```bash
   firebase deploy
   ```

### 4. AWS (EC2 + S3)

#### Frontend (S3 + CloudFront)

1. **Build and upload to S3**
   ```bash
   cd client
   npm run build
   aws s3 sync build/ s3://your-bucket-name
   ```

2. **Configure CloudFront** for CDN

#### Backend (EC2)

1. **Launch EC2 instance**
2. **Install Node.js and PM2**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

3. **Deploy application**
   ```bash
   git clone your-repo
   cd server
   npm install
   pm2 start server.js --name "gps-tracker"
   ```

## 🔧 Environment Configuration

### Production Environment Variables

#### Frontend (.env.production)
```env
REACT_APP_GOOGLE_CLIENT_ID=your_production_google_client_id
REACT_APP_API_URL=https://your-api-domain.com
GENERATE_SOURCEMAP=false
```

#### Backend
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your_super_secure_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
DATABASE_URL=your_database_connection_string
CORS_ORIGIN=https://your-frontend-domain.com
```

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)

1. **Create MongoDB Atlas account**
2. **Create cluster and database**
3. **Get connection string**
4. **Update environment variables**
   ```env
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/gps-tracker
   ```

### PostgreSQL (Heroku Postgres)

1. **Add Heroku Postgres addon**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

2. **Get database URL**
   ```bash
   heroku config:get DATABASE_URL
   ```

## 🔒 Security Configuration

### HTTPS Setup

1. **Use SSL certificates** (Let's Encrypt for free)
2. **Configure HTTPS redirects**
3. **Update CORS settings**

### Security Headers
```javascript
// Add to Express server
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  next();
});
```

### Google OAuth Production Setup

1. **Update authorized origins**
   ```
   https://your-domain.com
   https://www.your-domain.com
   ```

2. **Update redirect URIs**
   ```
   https://your-domain.com
   https://your-domain.com/auth/callback
   ```

## 📊 Monitoring & Analytics

### Application Monitoring

1. **Set up error tracking** (Sentry)
   ```bash
   npm install @sentry/react @sentry/node
   ```

2. **Configure logging**
   ```javascript
   const winston = require('winston');
   
   const logger = winston.createLogger({
     level: 'info',
     format: winston.format.json(),
     transports: [
       new winston.transports.File({ filename: 'error.log', level: 'error' }),
       new winston.transports.File({ filename: 'combined.log' })
     ]
   });
   ```

### Performance Monitoring

1. **Google Analytics** for user tracking
2. **New Relic** for application performance
3. **Uptime monitoring** (Pingdom, UptimeRobot)

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: |
        cd client && npm install
        cd ../server && npm install
        
    - name: Build frontend
      run: cd client && npm run build
      
    - name: Run tests
      run: |
        cd client && npm test -- --coverage --watchAll=false
        cd ../server && npm test
        
    - name: Deploy to Netlify
      uses: netlify/actions/cli@master
      with:
        args: deploy --prod --dir=client/build
      env:
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
```

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Update CORS_ORIGIN environment variable
   - Check frontend API URL configuration

2. **Google OAuth Issues**
   - Verify authorized origins in Google Console
   - Check client ID in environment variables

3. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed

4. **Database Connection**
   - Verify connection string format
   - Check network access and firewall settings

### Performance Optimization

1. **Enable gzip compression**
2. **Implement caching strategies**
3. **Optimize images and assets**
4. **Use CDN for static files**
5. **Implement lazy loading**

## 📋 Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Google OAuth credentials updated
- [ ] Database connection tested
- [ ] HTTPS certificates installed
- [ ] Security headers configured
- [ ] Error monitoring set up
- [ ] Performance monitoring enabled
- [ ] Backup strategy implemented
- [ ] Domain DNS configured
- [ ] Load testing completed

## 🔧 Maintenance

### Regular Tasks

1. **Update dependencies** monthly
2. **Monitor error logs** weekly
3. **Check performance metrics** daily
4. **Backup database** daily
5. **Security updates** as needed

### Scaling Considerations

1. **Horizontal scaling** with load balancers
2. **Database optimization** and indexing
3. **Caching layers** (Redis, Memcached)
4. **CDN implementation** for global reach
5. **Microservices architecture** for large scale
