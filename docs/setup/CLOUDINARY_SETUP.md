# Cloudinary Image Upload Setup

StoryWall uses Cloudinary for image uploads and optimization. This allows users to upload their own images while maintaining fast delivery and automatic optimization.

## Why Cloudinary?

- ✅ **Free Tier**: 25 GB storage, 25 GB bandwidth/month
- ✅ **Auto Optimization**: Automatic format conversion (WebP, AVIF)
- ✅ **CDN**: Fast global delivery
- ✅ **Image Transformations**: Resize, crop, watermark on-the-fly
- ✅ **Easy Integration**: Simple API

## Setup Steps

### 1. Create a Cloudinary Account

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up with your email (free tier is perfect for MVP)
3. Verify your email

### 2. Get Your Credentials

Once logged in to the Cloudinary Dashboard:

1. Go to **Dashboard** (you'll see it after login)
2. Copy these three values:
   - **Cloud Name** (e.g., `dxyxzy123`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

### 3. Add Environment Variables

#### Local Development (`.env.local`)

Add these to your `.env.local` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

#### Railway Production

1. Go to your Railway project dashboard
2. Select your web service (not the database)
3. Go to the **Variables** tab
4. Click **+ New Variable** and add each:
   - `CLOUDINARY_CLOUD_NAME` = your cloud name
   - `CLOUDINARY_API_KEY` = your API key
   - `CLOUDINARY_API_SECRET` = your API secret

### 4. Verify Setup

1. Start your dev server: `npm run dev`
2. Go to `/editor`
3. Try uploading an image
4. You should see it upload successfully and appear in the preview

## How It Works

1. **User uploads image** in the editor
2. **Frontend sends file** to `/api/upload`
3. **Server uploads to Cloudinary** with auto-optimization
4. **Cloudinary returns URL** (e.g., `https://res.cloudinary.com/your-cloud/image/upload/v123/abc.jpg`)
5. **URL is saved** in the database (same `imageUrl` field)

## Cost Scaling

### Free Tier (Perfect for MVP)
- 25 GB storage
- 25 GB bandwidth/month
- Unlimited transformations

**What this means:**
- ~125,000 images at 200 KB each
- ~2,000 page views/month (assuming 10 images per view)

### When You Need to Upgrade

Upgrade to **Pay-As-You-Go** when you exceed:
- Storage > 25 GB
- Bandwidth > 25 GB/month

**Pricing:** ~$0.04/GB storage, ~$0.04/GB bandwidth

## Image Upload Features

- **File Types**: JPEG, PNG, GIF, WebP
- **Max Size**: 10 MB per file
- **Auto-Optimization**: Automatic quality and format optimization
- **Storage**: Organized in `storywall/` folder in Cloudinary

## Troubleshooting

### "Cloudinary is not configured"
- Check that all three environment variables are set
- Restart your dev server after adding variables
- In Railway, make sure variables are added to the **web service**, not the database

### "Upload failed"
- Check Cloudinary dashboard for error logs
- Verify your API credentials are correct
- Check file size (must be < 10 MB)

### Images not showing
- Check `next.config.js` includes `res.cloudinary.com` in image domains (already configured)
- Verify the URL returned from upload is valid

## Security Notes

- API Secret should **never** be exposed in frontend code
- Upload endpoint should be protected with authentication (currently disabled for testing)
- File type and size validation happens on both client and server

## Migration from URL-Only

The system supports both:
1. **User uploads** → Stored in Cloudinary
2. **External URLs** → Still work (Unsplash, etc.)

No migration needed - existing URLs continue to work!
