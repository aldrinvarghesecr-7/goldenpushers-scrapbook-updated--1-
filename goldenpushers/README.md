# Golden Pushers Production — Pure Static Site

A 100% **HTML / CSS / JS** static website. No build tools, no frameworks, no backend server, and no npm dependencies required.

## Opening Locally

Simply double-click `index.html` to open it in Chrome, Edge, Safari, or Firefox. Everything works out of the box:
- Full-page scroll-scrubbed studio dolly sequence (canvas)
- Hero text fade-in on initial scroll
- Translucent flowing sections with water-bleed gradient edge transitions
- Page-to-page transition flow animations
- Service accordions, project filters, and team member modals
- Contact / enquiry form with direct email pre-fill fallback

## Structure

```
index.html              Homepage — hero dolly sequence, services, gallery, team, contact
about.html              Services accordion (click to expand)
team.html               Full team grid (click a person for their bio)
work.html               Portfolio with category filters
work-*.html             6 individual project case study pages
contact.html            Standalone contact / enquiry page

css/
  base.css              Palette, typography, layout primitives, page-flow animations
  layout.css            Navbar, footer, mobile drawer
  home.css              Homepage sections (hero, ethos, craft, gallery, enquire)
  pages.css             About/Team/Work/Contact page styles

js/
  hero-sequence.js      Scroll-scrubbed canvas image sequence (the full-page dolly animation)
  main.js               Navbar, mobile drawer, scroll-reveal, modal helper, page transitions
  home.js               Homepage-only: services accordion, team modal, contact form
  pages.js              About/Team/Work-only: accordion, team modal, filters

assets/
  sequence/             240 WebP frames for the scroll animation
  team/                 Team photos
  work/                 Work & portfolio photos
```

## Deploying to GoDaddy

Upload all files and folders (`assets/`, `css/`, `js/`, and `.html` files) directly into your `public_html` directory via GoDaddy cPanel File Manager or FTP.

## Notes on content

- Contact info (phone `+91 80865 60664`, Instagram `@goldenpushers`) was
  corrected to match the studio's real, verified Instagram business page.
- Team names, roles, and photos are the real team — no placeholder/stock people.
- Work page uses the 6 real photos already in the project (`assets/work/ig-*.jpg`).
- The contact form has one implementation, used identically on the homepage
  and the standalone contact page.

## Browser support

Built on plain CSS Grid/Flexbox, `IntersectionObserver`, and Canvas —
works in every browser from the last ~5 years. No polyfills included;
add them if you need to support older browsers.
