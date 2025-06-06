# GrowUp Dubai Shopify Theme

A modern, responsive Shopify theme designed specifically for social media growth services targeting the Arab and Gulf markets.

## Features

- 🎨 Modern, clean design with dark/light mode
- 📱 Fully responsive across all devices
- ⚡ Fast loading with optimized performance
- 🌍 Tailored for UAE & GCC market
- 🛒 Advanced cart and checkout experience
- 🔍 Built-in search functionality
- 📧 Newsletter integration
- 🔄 Product quick add functionality
- ❤️ Wishlist support
- 📊 SEO optimized

## Installation

1. **Download the theme files**
2. **Create a new theme in your Shopify admin:**
   - Go to Online Store > Themes
   - Click "Add theme" > "Upload ZIP file"
   - Upload the theme ZIP file

3. **Configure the theme:**
   - Go to Theme Settings
   - Upload your logo
   - Set your brand colors
   - Configure social media links
   - Set up your navigation menus

## Theme Structure


/ ├── assets/ │ ├── application.css │ └── application.js ├── config/ │ └── settings_schema.json ├── layout/ │ └── theme.liquid ├── sections/ │ ├── header.liquid │ └── footer.liquid ├── snippets/ │ └── product-card.liquid └── templates/ ├── index.liquid ├── product.liquid ├── collection.liquid ├── cart.liquid └── page.liquid


## Customization

### Colors
Customize the brand colors in Theme Settings:
- Primary Color (default: #2ECC71)
- Secondary Color (default: #27AE60)
- Text Color
- Background Color

### Navigation
Set up your menus in Navigation settings:
- Main menu (header navigation)
- Footer menu

### Homepage
Configure the homepage in Theme Settings:
- Hero section content
- Featured collection
- Social media links

## Product Setup

### Required Collections
Create these collections for optimal theme performance:
- `featured` - Featured products for homepage
- `instagram` - Instagram services
- `tiktok` - TikTok services  
- `youtube` - YouTube services

### Product Tags
Use these tags for enhanced functionality:
- `new` - Shows "NEW" badge
- `sale` - Shows "SALE" badge (automatic with compare prices)

### Product Images
- Recommended size: 600x600px or larger
- Use square aspect ratio for best results
- Include multiple product images for galleries

## Performance

The theme is optimized for speed:
- Lazy loading images
- Minimized CSS/JS
- Optimized for Shopify's CDN
- Mobile-first responsive design

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development

### Local Development
```bash
# Install Shopify CLI
npm install -g @shopify/cli

# Connect to your store
shopify theme dev

# Upload theme
shopify theme push
