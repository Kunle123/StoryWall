# Google Imagen 4 Setup Guide

## Overview
This guide will help you set up Google Cloud credentials to use Google Imagen 4 for image generation.

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name: `storywall-image-gen` (or your preferred name)
5. Click "Create"
6. Wait for project creation (may take a minute)

---

## Step 2: Enable Vertex AI API

1. In your new project, go to [APIs & Services > Library](https://console.cloud.google.com/apis/library)
2. Search for "Vertex AI API"
3. Click on "Vertex AI API"
4. Click "Enable"
5. Wait for API to enable (may take a minute)

---

## Step 3: Create Service Account

1. Go to [IAM & Admin > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Click "Create Service Account"
3. Enter details:
   - **Service account name:** `storywall-imagen`
   - **Service account ID:** `storywall-imagen` (auto-filled)
   - **Description:** `Service account for StoryWall image generation`
4. Click "Create and Continue"

### Grant Permissions
5. In "Grant this service account access to project":
   - Select role: **"Vertex AI User"** (search for it)
   - Click "Continue"
6. Click "Done" (skip optional user access step)

---

## Step 4: Create and Download JSON Key

1. Find your service account in the list
2. Click on the service account email
3. Go to "Keys" tab
4. Click "Add Key" > "Create new key"
5. Select "JSON"
6. Click "Create"
7. **IMPORTANT:** The JSON file will download automatically - save it securely!

The JSON file will look like:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "storywall-imagen@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

---

## Step 5: Set Up Environment Variables

### Option A: Railway (Production)
1. Go to your Railway project
2. Navigate to "Variables" tab
3. Add the following variables:

```
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
```

**OR** (if Railway supports file upload):
- Upload the JSON file and set:
```
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### Option B: Local Development (.env.local)
1. Create/update `.env.local` in your project root
2. Add:

```bash
# Google Cloud Credentials
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

**OR** (if using file path):
```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

---

## Step 6: Install Required Packages

```bash
npm install @google-cloud/aiplatform
```

---

## Step 7: Verify Setup

Once credentials are set up, we'll implement the Google Imagen integration and test it.

---

## Important Notes

1. **Billing:** Google Cloud requires a billing account (even for free tier)
   - Free tier: $300 credit for 90 days
   - Imagen 4 Fast: $0.02/image (very affordable)

2. **Security:** 
   - Never commit the JSON key file to git
   - Add `*.json` to `.gitignore` if storing locally
   - Use environment variables in production

3. **Quotas:**
   - Check Vertex AI quotas in Google Cloud Console
   - Default quotas are usually sufficient for development

4. **Regions:**
   - Imagen 4 is available in specific regions
   - We'll use `us-central1` or `europe-west4` (check availability)

---

## Quick Setup Checklist

- [ ] Create Google Cloud Project
- [ ] Enable Vertex AI API
- [ ] Create Service Account with "Vertex AI User" role
- [ ] Download JSON key file
- [ ] Set environment variables:
  - `GOOGLE_CLOUD_PROJECT_ID=your-project-id`
  - `GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account",...}'`
- [ ] Test credentials (we'll do this together)

## Next Steps

After completing these steps, let me know:
1. ✅ Project created
2. ✅ Vertex AI API enabled
3. ✅ Service account created
4. ✅ JSON key downloaded
5. ✅ Environment variables set

Then I'll:
- Complete the Google Imagen API implementation
- Integrate it into the image generation route
- Test it with a sample image generation

---

## Important Notes

### Billing Setup
Google Cloud requires a billing account even for free tier:
1. Go to [Billing](https://console.cloud.google.com/billing)
2. Link a billing account (credit card required)
3. Free tier: $300 credit for 90 days
4. Imagen 4 Fast: $0.02/image (very affordable)

### Security
- ✅ Never commit JSON key to git (already in `.gitignore`)
- ✅ Use environment variables in production
- ✅ Store JSON key securely (password manager, etc.)

### Regions
Imagen 4 is available in:
- `us-central1` (Iowa, USA) - Recommended
- `europe-west4` (Netherlands)
- `asia-southeast1` (Singapore)

We'll use `us-central1` by default.

