# Crypto & Stock Portfolio Tracker - Frontend

A modern React application for tracking cryptocurrency and stock portfolios with real-time price updates.

## Features

- User authentication (Register/Login)
- Real-time portfolio tracking
- Separate views for crypto and stocks
- Performance metrics and gain/loss calculations
- Responsive dashboard
- Real-time price updates

## Tech Stack

- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v7
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Project Structure

```
crypto-stock-frontend/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD pipeline
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── Dashboard/
│   │   │   └── Dashboard.tsx
│   │   ├── Crypto/
│   │   │   └── CryptoPortfolio.tsx
│   │   └── Stocks/
│   │       └── StockPortfolio.tsx
│   ├── services/
│   │   └── api.ts             # API client
│   ├── store/
│   │   └── authStore.ts       # Auth state management
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- Backend API deployed and running

## Local Development

### 1. Clone the repository

```bash
git clone <repository-url>
cd crypto-stock-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
VITE_API_BASE_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod
```

### 4. Run development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 5. Build for production

```bash
npm run build
```

### 6. Preview production build

```bash
npm run preview
```

## Deployment

### Option 1: Manual Deployment to S3 + CloudFront

#### Step 1: Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://your-portfolio-app --region us-east-1

# Enable static website hosting
aws s3 website s3://your-portfolio-app \
  --index-document index.html \
  --error-document index.html

# Update bucket policy for public read
aws s3api put-bucket-policy --bucket your-portfolio-app --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-portfolio-app/*"
    }
  ]
}'
```

#### Step 2: Create CloudFront Distribution

```bash
aws cloudfront create-distribution \
  --origin-domain-name your-portfolio-app.s3.us-east-1.amazonaws.com \
  --default-root-object index.html
```

Or use AWS Console:
1. Go to CloudFront
2. Create Distribution
3. Origin Domain: Your S3 bucket
4. Viewer Protocol Policy: Redirect HTTP to HTTPS
5. Default Root Object: `index.html`
6. Error Pages: Add custom error response for 404 → /index.html (for SPA routing)

#### Step 3: Build and Deploy

```bash
# Build
npm run build

# Deploy to S3
aws s3 sync dist/ s3://your-portfolio-app --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### Option 2: GitHub Actions CI/CD

#### 1. Set up AWS credentials for GitHub

Follow the same process as backend (OIDC or Access Keys)

#### 2. Configure GitHub Secrets

Add these secrets to your repository:
- `AWS_ROLE_ARN` (for OIDC) or `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME` (e.g., `your-portfolio-app`)
- `CLOUDFRONT_DISTRIBUTION_ID` (from CloudFront console)
- `VITE_API_BASE_URL` (your backend API URL)

#### 3. Push to main branch

```bash
git push origin main
```

The workflow will:
1. Install dependencies
2. Build the application
3. Deploy to S3
4. Invalidate CloudFront cache

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API endpoint | `https://xxx.execute-api.us-east-1.amazonaws.com/prod` |

## Components Overview

### Authentication
- **Login**: User login with email/password
- **Register**: New user registration
- JWT token stored in localStorage

### Dashboard
- Portfolio summary
- Total value and gain/loss
- Quick navigation to crypto/stocks

### Crypto Portfolio
- List of crypto assets
- Real-time prices from CoinGecko
- Individual asset performance

### Stock Portfolio
- List of stock assets
- Real-time prices from Yahoo Finance
- Individual stock performance

## State Management

Uses Zustand for lightweight state management:

```typescript
// Auth store
const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setAuth: (user, token) => { /* ... */ },
  logout: () => { /* ... */ }
}));
```

## API Integration

All API calls go through the centralized API service:

```typescript
// services/api.ts
const apiService = new ApiService();

// Usage
const portfolio = await apiService.getCryptoPortfolio();
```

Features:
- Automatic JWT token injection
- Request/response interceptors
- Error handling
- 401 redirect to login

## Styling

Uses Tailwind CSS for utility-first styling:

```tsx
<div className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-2xl font-bold text-gray-900">Portfolio</h2>
</div>
```

## Routing

Protected routes require authentication:

```tsx
<Route
  path="/dashboard"
  element={
    <PrivateRoute>
      <Dashboard />
    </PrivateRoute>
  }
/>
```

## Building for Production

### Optimize Build Size

```bash
# Analyze bundle
npm run build -- --mode analyze

# The build is already optimized with:
# - Code splitting
# - Tree shaking
# - Minification
# - Asset optimization
```

## Testing

```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome)

## Performance Optimizations

1. **Code Splitting**: Automatic route-based splitting
2. **Lazy Loading**: Components loaded on demand
3. **Image Optimization**: Optimized assets
4. **Caching**: CloudFront CDN caching
5. **Compression**: Gzip/Brotli enabled

## Security

1. **XSS Protection**: React's built-in escaping
2. **HTTPS Only**: Enforced via CloudFront
3. **JWT Storage**: Secure token handling
4. **CORS**: Configured on backend
5. **No Sensitive Data**: No secrets in frontend code

## Troubleshooting

### Issue: API calls failing with CORS errors

**Solution**: Verify backend CORS configuration allows your domain

### Issue: 404 on page refresh

**Solution**: Configure CloudFront error pages to redirect 404 to `/index.html`

### Issue: Environment variables not working

**Solution**: Ensure variables start with `VITE_` prefix

### Issue: Build fails with TypeScript errors

**Solution**:
```bash
npm run build -- --mode development
# Or fix TypeScript errors
```

## Future Enhancements

- [ ] Charts for portfolio performance over time
- [ ] Price alerts and notifications
- [ ] Export portfolio to CSV/PDF
- [ ] Multi-currency support
- [ ] Dark mode
- [ ] Mobile app (React Native)
- [ ] AI-powered investment insights

## Scripts

```json
{
  "dev": "vite",              // Start dev server
  "build": "vite build",      // Build for production
  "preview": "vite preview",  // Preview production build
  "lint": "eslint ."          // Run linter
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Support

For issues and questions, please open a GitHub issue.
# Frontend App
