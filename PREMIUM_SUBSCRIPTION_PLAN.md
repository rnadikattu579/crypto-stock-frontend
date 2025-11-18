# Premium Subscription Model - Implementation Plan

## Overview
Implement a tiered subscription model with Free, Pro, and Enterprise tiers using Stripe for payment processing.

---

## Subscription Tiers

### 🆓 Free Tier (Current Features)
**Price:** $0/month

**Features:**
- Up to 20 assets
- Basic portfolio tracking
- Real-time price updates
- Basic analytics (30-day history)
- Portfolio snapshots (weekly)
- Email notifications (limited)
- CSV export
- Mobile responsive web app

**Limitations:**
- Limited historical data (30 days)
- Basic charts only
- No tax reporting
- No cost basis tracking
- No API access
- Community support only

---

### ⭐ Pro Tier
**Price:** $9.99/month or $99/year (save 17%)

**Everything in Free, plus:**
- **Unlimited assets**
- **Full transaction history** with FIFO/LIFO/Average cost basis
- **Advanced analytics** (unlimited history)
  - Sharpe ratio, Beta, correlation
  - Risk-adjusted returns
  - Drawdown analysis
  - Benchmark comparisons
- **Tax reporting**
  - Capital gains/losses summary
  - Form 8949 generation
  - Wash sale detection
  - Tax loss harvesting recommendations
  - PDF reports
- **Portfolio rebalancing**
  - Target allocation settings
  - Rebalancing calculator
  - Threshold alerts
- **Advanced notifications**
  - SMS alerts (limited)
  - Webhook integrations (Discord, Slack)
  - Custom alert conditions
- **Daily portfolio snapshots**
- **Priority email support** (24-hour response)
- **Exchange integrations** (Coinbase, Binance)
- **API access** (read-only, rate-limited)
- **Multiple portfolios** (up to 5)
- **Advanced filters** and saved views
- **Bulk CSV import**
- **No ads** (if you add ads to free tier later)

**Target Audience:** Serious retail investors, crypto traders, active stock traders

---

### 🏢 Enterprise Tier
**Price:** $49/month or $490/year (save 17%)

**Everything in Pro, plus:**
- **Unlimited portfolios**
- **Multi-user access** (up to 5 team members)
- **Advanced API access**
  - Full read/write access
  - Higher rate limits
  - Webhook notifications
- **White-label options** (custom branding)
- **Advanced AI features**
  - AI portfolio advisor
  - Predictive analytics
  - Natural language queries
- **DeFi tracking**
  - Staking rewards
  - Yield farming
  - NFT portfolio
  - Liquidity pools
- **Advanced security**
  - 2FA required
  - SSO integration
  - Audit logs
  - IP whitelisting
- **Custom reports** and dashboards
- **Dedicated account manager**
- **Priority phone support** (4-hour response)
- **SLA guarantee** (99.9% uptime)
- **Custom integrations** (upon request)
- **Early access** to new features

**Target Audience:** Financial advisors, wealth managers, crypto funds, family offices

---

## Technical Implementation

### Phase 1: Stripe Integration (2-3 days)

#### Backend Changes

**1. Create Subscription Models**
```python
# src/models/subscription.py

class SubscriptionTier(str, Enum):
    FREE = 'free'
    PRO = 'pro'
    ENTERPRISE = 'enterprise'

class Subscription(BaseModel):
    subscription_id: str
    user_id: str
    tier: SubscriptionTier
    stripe_customer_id: Optional[str]
    stripe_subscription_id: Optional[str]
    status: str  # active, canceled, past_due, trialing
    current_period_start: datetime
    current_period_end: datetime
    cancel_at_period_end: bool = False
    trial_end: Optional[datetime]
    created_at: datetime
    updated_at: datetime
```

**2. Stripe Service**
```python
# src/services/stripe_service.py

import stripe
import os

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

class StripeService:
    def create_customer(self, user_id, email):
        # Create Stripe customer
        pass

    def create_checkout_session(self, user_id, tier):
        # Create Stripe checkout session
        pass

    def create_billing_portal_session(self, customer_id):
        # Create customer portal session
        pass

    def handle_webhook(self, payload, signature):
        # Handle Stripe webhooks
        pass
```

**3. Subscription Service**
```python
# src/services/subscription_service.py

class SubscriptionService:
    def get_subscription(self, user_id):
        # Get user's subscription
        pass

    def create_subscription(self, user_id, tier):
        # Create subscription
        pass

    def upgrade_subscription(self, user_id, new_tier):
        # Upgrade to higher tier
        pass

    def cancel_subscription(self, user_id):
        # Cancel subscription
        pass

    def check_feature_access(self, user_id, feature):
        # Check if user has access to feature
        pass
```

**4. API Endpoints**
```python
# src/handlers/subscription.py

# POST /subscription/checkout - Create checkout session
# POST /subscription/portal - Create billing portal session
# GET /subscription - Get current subscription
# POST /subscription/cancel - Cancel subscription
# POST /webhook/stripe - Stripe webhook handler
```

**5. Feature Flags/Middleware**
```python
# src/middleware/subscription_middleware.py

def require_tier(required_tier: SubscriptionTier):
    """Decorator to require subscription tier"""
    def decorator(func):
        def wrapper(event, context):
            user_id = get_user_id_from_event(event)
            subscription = subscription_service.get_subscription(user_id)

            if not has_access(subscription.tier, required_tier):
                return {
                    'statusCode': 403,
                    'body': json.dumps({
                        'error': 'This feature requires a Pro subscription',
                        'upgrade_url': '/pricing'
                    })
                }

            return func(event, context)
        return wrapper
    return decorator

# Usage:
@require_tier(SubscriptionTier.PRO)
def get_tax_report(event, context):
    # Only Pro and Enterprise users can access
    pass
```

#### Frontend Changes

**1. Subscription Types**
```typescript
// src/types/subscription.ts

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

export interface Subscription {
  subscription_id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_end?: string;
}

export interface SubscriptionFeatures {
  maxAssets: number;
  historicalDataDays: number;
  taxReporting: boolean;
  advancedAnalytics: boolean;
  apiAccess: boolean;
  maxPortfolios: number;
  prioritySupport: boolean;
}
```

**2. Pricing Page**
```tsx
// src/components/Pricing/PricingPage.tsx

export function PricingPage() {
  return (
    <div className="pricing-page">
      <h1>Choose Your Plan</h1>

      <div className="pricing-tiers">
        {/* Free Tier Card */}
        <PricingCard
          tier="free"
          price={0}
          features={[
            'Up to 20 assets',
            'Basic analytics (30 days)',
            'Weekly snapshots',
            'Email notifications',
            'Community support'
          ]}
          limitations={[
            'No tax reporting',
            'No cost basis tracking',
            'Limited history'
          ]}
          buttonText="Current Plan"
          disabled
        />

        {/* Pro Tier Card */}
        <PricingCard
          tier="pro"
          price={9.99}
          yearlyPrice={99}
          popular
          features={[
            'Unlimited assets',
            'Full transaction history',
            'Advanced analytics',
            'Tax reporting (Form 8949)',
            'Portfolio rebalancing',
            'Exchange integrations',
            'API access',
            'Priority support'
          ]}
          buttonText="Upgrade to Pro"
          onUpgrade={() => handleUpgrade('pro')}
        />

        {/* Enterprise Tier Card */}
        <PricingCard
          tier="enterprise"
          price={49}
          yearlyPrice={490}
          features={[
            'Everything in Pro',
            'Multi-user access (5 users)',
            'White-label options',
            'AI portfolio advisor',
            'DeFi tracking',
            'Dedicated support',
            'SLA guarantee',
            'Custom integrations'
          ]}
          buttonText="Contact Sales"
          onUpgrade={() => handleContactSales()}
        />
      </div>

      {/* Feature Comparison Table */}
      <FeatureComparisonTable />

      {/* FAQ Section */}
      <PricingFAQ />
    </div>
  );
}
```

**3. Upgrade Modal**
```tsx
// src/components/Pricing/UpgradeModal.tsx

export function UpgradeModal({ isOpen, onClose, requiredTier }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="upgrade-modal">
        <h2>🔒 Pro Feature</h2>
        <p>This feature requires a {requiredTier} subscription.</p>

        <div className="feature-benefits">
          <h3>With {requiredTier}, you'll get:</h3>
          <ul>
            {getFeatureList(requiredTier).map(feature => (
              <li key={feature}>✅ {feature}</li>
            ))}
          </ul>
        </div>

        <div className="pricing-info">
          <span className="price">$9.99/month</span>
          <span className="savings">or $99/year (save 17%)</span>
        </div>

        <button onClick={handleUpgrade}>
          Upgrade to {requiredTier}
        </button>
        <button onClick={onClose}>Maybe Later</button>
      </div>
    </Modal>
  );
}
```

**4. Subscription Context**
```typescript
// src/contexts/SubscriptionContext.tsx

export const SubscriptionContext = createContext<SubscriptionContextType>(null);

export function SubscriptionProvider({ children }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    const sub = await apiService.getSubscription();
    setSubscription(sub);
    setLoading(false);
  };

  const hasFeature = (feature: string) => {
    return checkFeatureAccess(subscription.tier, feature);
  };

  const requireFeature = (feature: string, callback: () => void) => {
    if (hasFeature(feature)) {
      callback();
    } else {
      // Show upgrade modal
      showUpgradeModal(feature);
    }
  };

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      hasFeature,
      requireFeature,
      loading
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// Usage:
const { hasFeature, requireFeature } = useSubscription();

const handleTaxReport = () => {
  requireFeature('tax_reporting', () => {
    // Generate tax report
  });
};
```

**5. Feature Gating Components**
```tsx
// src/components/shared/RequirePro.tsx

export function RequirePro({ children, feature }) {
  const { hasFeature } = useSubscription();

  if (!hasFeature(feature)) {
    return <UpgradePrompt feature={feature} />;
  }

  return children;
}

// Usage:
<RequirePro feature="tax_reporting">
  <TaxReportButton />
</RequirePro>
```

---

### Phase 2: Feature Limitations (1 day)

**Implement feature limits based on tier:**

```typescript
// src/config/subscription.ts

export const SUBSCRIPTION_LIMITS = {
  free: {
    maxAssets: 20,
    maxPortfolios: 1,
    historicalDataDays: 30,
    maxTransactions: 100,
    snapshotFrequency: 'weekly',
    features: {
      taxReporting: false,
      advancedAnalytics: false,
      costBasis: false,
      apiAccess: false,
      exchangeIntegrations: false,
      portfolioRebalancing: false,
      bulkImport: false,
      smsAlerts: false,
      webhooks: false,
    }
  },
  pro: {
    maxAssets: Infinity,
    maxPortfolios: 5,
    historicalDataDays: Infinity,
    maxTransactions: Infinity,
    snapshotFrequency: 'daily',
    features: {
      taxReporting: true,
      advancedAnalytics: true,
      costBasis: true,
      apiAccess: true,
      exchangeIntegrations: true,
      portfolioRebalancing: true,
      bulkImport: true,
      smsAlerts: true,
      webhooks: true,
    }
  },
  enterprise: {
    maxAssets: Infinity,
    maxPortfolios: Infinity,
    historicalDataDays: Infinity,
    maxTransactions: Infinity,
    snapshotFrequency: 'daily',
    multiUser: true,
    maxUsers: 5,
    features: {
      taxReporting: true,
      advancedAnalytics: true,
      costBasis: true,
      apiAccess: true,
      exchangeIntegrations: true,
      portfolioRebalancing: true,
      bulkImport: true,
      smsAlerts: true,
      webhooks: true,
      aiAdvisor: true,
      defiTracking: true,
      whiteLabel: true,
      customIntegrations: true,
      ssoIntegration: true,
      auditLogs: true,
    }
  }
};
```

---

### Phase 3: Stripe Checkout Flow (1 day)

**1. Checkout Process:**
```typescript
// User clicks "Upgrade to Pro"
// → Frontend calls POST /subscription/checkout
// → Backend creates Stripe checkout session
// → Frontend redirects to Stripe hosted checkout
// → User enters payment info on Stripe
// → Stripe redirects back to success page
// → Webhook updates subscription in DynamoDB
// → Frontend shows success message
```

**2. Implement Checkout:**
```typescript
// src/services/api.ts

async createCheckoutSession(tier: SubscriptionTier, billingPeriod: 'monthly' | 'yearly') {
  const response = await this.api.post('/subscription/checkout', {
    tier,
    billing_period: billingPeriod,
    success_url: `${window.location.origin}/subscription/success`,
    cancel_url: `${window.location.origin}/pricing`
  });

  // Redirect to Stripe Checkout
  window.location.href = response.data.data.checkout_url;
}

async createBillingPortalSession() {
  const response = await this.api.post('/subscription/portal');
  window.location.href = response.data.data.portal_url;
}
```

---

### Phase 4: Stripe Products Setup

**In Stripe Dashboard, create:**

1. **Pro Monthly Product**
   - Price: $9.99/month
   - Recurring: monthly
   - Product ID: `prod_pro_monthly`

2. **Pro Yearly Product**
   - Price: $99/year
   - Recurring: yearly
   - Product ID: `prod_pro_yearly`

3. **Enterprise Monthly Product**
   - Price: $49/month
   - Recurring: monthly
   - Product ID: `prod_enterprise_monthly`

4. **Enterprise Yearly Product**
   - Price: $490/year
   - Recurring: yearly
   - Product ID: `prod_enterprise_yearly`

---

### Phase 5: Webhook Implementation (1 day)

**Handle Stripe Events:**

```python
# src/handlers/stripe_webhook.py

def handle_stripe_webhook(event, context):
    payload = event['body']
    signature = event['headers']['Stripe-Signature']

    try:
        stripe_event = stripe.Webhook.construct_event(
            payload, signature, WEBHOOK_SECRET
        )
    except ValueError:
        return {'statusCode': 400}
    except stripe.error.SignatureVerificationError:
        return {'statusCode': 400}

    # Handle events
    if stripe_event.type == 'checkout.session.completed':
        handle_checkout_completed(stripe_event.data.object)
    elif stripe_event.type == 'customer.subscription.updated':
        handle_subscription_updated(stripe_event.data.object)
    elif stripe_event.type == 'customer.subscription.deleted':
        handle_subscription_canceled(stripe_event.data.object)
    elif stripe_event.type == 'invoice.payment_failed':
        handle_payment_failed(stripe_event.data.object)

    return {'statusCode': 200}
```

---

## UI/UX Enhancements

### 1. Badge/Label on Pro Features
```tsx
<div className="feature">
  <span>Advanced Analytics</span>
  <ProBadge />
</div>
```

### 2. Trial Period
- Offer 7-day or 14-day free trial for Pro
- Full access during trial
- Auto-convert to paid after trial

### 3. Upgrade Prompts
- Show when user hits limits
- "Soft" prompts (non-intrusive)
- "Hard" blocks for premium features

### 4. Account Settings Page
```tsx
<SubscriptionSection>
  <CurrentPlan tier="free" />
  <UsageMetrics
    assetsUsed={12}
    assetsLimit={20}
  />
  <UpgradeButton />
  <BillingHistory />
  <ManageSubscription /> {/* Link to Stripe portal */}
</SubscriptionSection>
```

---

## Testing Checklist

- [ ] Stripe checkout flow (monthly)
- [ ] Stripe checkout flow (yearly)
- [ ] Webhook event handling
- [ ] Feature gating (blocked when not subscribed)
- [ ] Upgrade flow
- [ ] Downgrade flow
- [ ] Cancellation flow
- [ ] Billing portal access
- [ ] Trial period handling
- [ ] Payment failure handling
- [ ] Subscription renewal
- [ ] Invoice generation

---

## Deployment Steps

1. **Create Stripe account** (if not exists)
2. **Set up products** in Stripe Dashboard
3. **Add environment variables:**
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
4. **Deploy backend** with subscription endpoints
5. **Configure webhook** in Stripe Dashboard
6. **Deploy frontend** with pricing page
7. **Test in Stripe test mode** first
8. **Switch to live mode** when ready

---

## Metrics to Track

- **Conversion Rate:** Free → Pro
- **Monthly Recurring Revenue (MRR)**
- **Annual Recurring Revenue (ARR)**
- **Churn Rate:** Cancellations per month
- **Average Revenue Per User (ARPU)**
- **Customer Lifetime Value (CLV)**
- **Trial Conversion Rate**
- **Feature Usage** by tier
- **Upgrade Triggers** (which features drive upgrades)

---

## Marketing Strategy

### Free → Pro Conversion Tactics

1. **In-App Prompts:**
   - When user adds 20th asset: "Upgrade to add unlimited assets"
   - During tax season: "Generate your tax report with Pro"
   - After 30 days: "See your full portfolio history with Pro"

2. **Email Campaigns:**
   - Welcome email with Pro benefits
   - After 7 days: Feature highlights
   - After 14 days: Tax reporting value
   - After 30 days: Limited-time discount

3. **Social Proof:**
   - "Join 10,000+ Pro users"
   - User testimonials
   - Case studies

4. **Limited-Time Offers:**
   - Launch discount (20% off first year)
   - Holiday promotions
   - Referral bonuses

---

## Revenue Projections

**Conservative Estimate (Year 1):**
- 1,000 free users
- 5% conversion to Pro = 50 Pro users
- 1% conversion to Enterprise = 10 Enterprise users

**Monthly Recurring Revenue:**
- Pro: 50 × $9.99 = $499.50
- Enterprise: 10 × $49 = $490
- **Total MRR: ~$990**

**Annual Recurring Revenue:**
- **Total ARR: ~$11,880**

**With Growth (Year 2):**
- 5,000 free users
- 10% conversion to Pro = 500 Pro users
- 2% conversion to Enterprise = 100 Enterprise users
- **Total ARR: ~$118,800**

---

## Future Enhancements

1. **Add-ons:**
   - Extra API calls: $5/month
   - SMS alerts pack: $3/month
   - Additional team members: $10/user/month

2. **Annual Discounts:**
   - Offer 2-3 months free for annual

3. **Lifetime Deals:**
   - One-time payment for Pro
   - Limited availability

4. **Referral Program:**
   - Give 1 month free for each referral
   - Referred user gets discount

5. **Enterprise Custom Pricing:**
   - Quote-based for large teams
   - Volume discounts

---

## Legal & Compliance

- [ ] Terms of Service (subscription terms)
- [ ] Privacy Policy (payment data handling)
- [ ] Refund Policy (pro-rated refunds?)
- [ ] GDPR compliance (EU users)
- [ ] PCI DSS (Stripe handles this)
- [ ] Tax compliance (sales tax, VAT)

---

## Support Plan

**Free Tier:**
- Community forum
- Email support (48-hour response)
- Knowledge base

**Pro Tier:**
- Priority email (24-hour response)
- Chat support (business hours)
- Video tutorials

**Enterprise Tier:**
- Dedicated account manager
- Phone support (4-hour response)
- Custom onboarding
- SLA guarantee

---

*Implementation Time: 3-4 days*
*Maintenance: ~2-4 hours/month*
*Potential Revenue: $10k-100k+ annually*
