# Testing Statistics Timeline API Endpoints

This document provides CURL commands and instructions for testing the statistics timeline API endpoints.

## Prerequisites

1. **Authentication**: These endpoints require Clerk authentication. You need a valid session token.

2. **Get Session Token**:
   - Sign in to your app at `http://localhost:3000` (or your deployed URL)
   - Open browser DevTools (F12)
   - Go to Application/Storage → Cookies
   - Copy the value of the `__session` cookie
   - Export it: `export CLERK_SESSION_TOKEN='your-token-here'`

3. **Base URL**: Set your base URL (defaults to localhost:3000)
   ```bash
   export NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

## Endpoints to Test

### 1. Generate Statistics Suggestions
**Endpoint**: `POST /api/ai/generate-statistics-suggestions`

**Purpose**: Generates metric suggestions and data source recommendations based on a measurement question.

**CURL Command**:
```bash
curl -X POST http://localhost:3000/api/ai/generate-statistics-suggestions \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=YOUR_SESSION_TOKEN" \
  -d '{
    "measurementQuestion": "Crime in West Midlands"
  }'
```

**Expected Response**:
```json
{
  "metrics": [
    "Violent Crime",
    "Theft",
    "Car Crime",
    "Burglary",
    "Drug Offences",
    "Public Order Offences"
  ],
  "dataSource": "Police.uk - Crime Statistics"
}
```

**Alternative Request Format** (legacy support):
```bash
curl -X POST http://localhost:3000/api/ai/generate-statistics-suggestions \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=YOUR_SESSION_TOKEN" \
  -d '{
    "timelineName": "UK Political Party Polling",
    "timelineDescription": "Polling data for UK political parties"
  }'
```

---

### 2. Generate Statistics Data
**Endpoint**: `POST /api/ai/generate-statistics-data`

**Purpose**: Generates statistical events with data points for all metrics.

**CURL Command**:
```bash
curl -X POST http://localhost:3000/api/ai/generate-statistics-data \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=YOUR_SESSION_TOKEN" \
  -d '{
    "timelineName": "Crime in West Midlands",
    "timelineDescription": "Statistical analysis of crime data in West Midlands region",
    "metrics": ["Violent Crime", "Theft", "Car Crime", "Burglary"],
    "dataSource": "Police.uk - Crime Statistics",
    "period": "since-2020"
  }'
```

**Period Options**:
- `""` or omit: Auto-select based on data availability
- `"since-brexit"`: From 2016 (since Brexit referendum)
- `"since-2020"`: From 2020 to present
- `"since-2010"`: From 2010 to present
- `"since-ww2"`: From 1945 (end of WWII) to present
- `"last-5-years"`: Last 5 years
- `"last-10-years"`: Last 10 years

**Expected Response**:
```json
{
  "events": [
    {
      "id": "event-1",
      "title": "January 2020",
      "description": "Crime statistics for January 2020",
      "date": "2020-01-15T00:00:00.000Z",
      "data": {
        "Violent Crime": 1250,
        "Theft": 890,
        "Car Crime": 340,
        "Burglary": 210
      },
      "source": "Police.uk - Crime Statistics"
    }
  ],
  "periodUsed": "from 2020 to present",
  "dataQuality": "high",
  "warnings": []
}
```

---

## Using the Test Script

A test script is provided for easier testing:

```bash
# Set your session token
export CLERK_SESSION_TOKEN="your-session-token-here"

# Run the test script
./test-statistics-endpoints.sh
```

The script will:
1. Test the suggestions endpoint
2. Use the results to test the data generation endpoint
3. Display formatted results with color coding
4. Show summary of test results

---

## Testing Without Authentication (Development Only)

For local development testing, you can temporarily modify the routes to bypass authentication:

**⚠️ WARNING: Only do this in development, never in production!**

In each route file, temporarily comment out the auth check:

```typescript
// const { userId } = await getAuth(request);
// if (!userId) {
//   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
// }
const userId = 'test-user-id'; // Temporary for testing
```

Then test with:
```bash
curl -X POST http://localhost:3000/api/ai/generate-statistics-suggestions \
  -H "Content-Type: application/json" \
  -d '{"measurementQuestion": "Crime in West Midlands"}'
```

---

## Example Test Scenarios

### Scenario 1: UK Political Party Polling
```bash
# Step 1: Get suggestions
curl -X POST http://localhost:3000/api/ai/generate-statistics-suggestions \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=YOUR_TOKEN" \
  -d '{"measurementQuestion": "UK Political Party Polling"}'

# Step 2: Generate data (using metrics from step 1)
curl -X POST http://localhost:3000/api/ai/generate-statistics-data \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=YOUR_TOKEN" \
  -d '{
    "timelineName": "UK Political Party Polling",
    "timelineDescription": "Polling data for UK political parties",
    "metrics": ["Conservative Party", "Labour Party", "Liberal Democrats", "Green Party"],
    "dataSource": "YouGov / Ipsos MORI",
    "period": "since-brexit"
  }'
```

### Scenario 2: UK Car Production
```bash
curl -X POST http://localhost:3000/api/ai/generate-statistics-suggestions \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=YOUR_TOKEN" \
  -d '{"measurementQuestion": "UK Car Production"}'
```

---

## Troubleshooting

### 401 Unauthorized
- Make sure you have a valid session token
- Check that the token is correctly set in the Cookie header
- Verify you're signed in to the application

### 400 Bad Request
- Check that all required fields are provided
- Verify JSON format is correct
- Ensure metrics array is not empty

### 500 Internal Server Error
- Check server logs for detailed error messages
- Verify AI API keys are configured (OPENAI_API_KEY or KIMI_API_KEY)
- Check that AI_MODEL environment variable is set

### Empty or Invalid Response
- Verify AI API is responding correctly
- Check that the AI model supports JSON mode
- Review server logs for AI API errors

---

## Response Validation

The endpoints include several validation checks:

1. **JSON Format**: Response must be valid JSON
2. **Structure**: Must match expected format (metrics array, dataSource string)
3. **Data Quality**: Sanity checks for unrealistic values
4. **Consistency**: Checks for dramatic value changes between events

If validation fails, the endpoint will return an error with details about what went wrong.

