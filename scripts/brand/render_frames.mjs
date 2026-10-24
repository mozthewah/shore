// Renders an animated SVG frame by frame: every CSS animation is paused and set to the frame's time.
// Usage: node render_frames.mjs <svg> <outdir> <width> <height> <seconds> <fps> <stillAt>
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
const [svg, out, w, h, seconds, fps, stillAt] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
await page.goto(pathToFileURL(svg).href);
await page.evaluate(() => document.fonts && document.fonts.ready);
async function at(t) {
  await page.evaluate(ms => document.getAnimations().forEach(a => { a.pause(); a.currentTime = ms; }), t * 1000);
  await page.waitForTimeout(16);
}
const n = Math.round(+seconds * +fps);
for (let i = 0; i < n; i++) { await at(i / +fps); await page.screenshot({ path: `${out}/f${String(i).padStart(4, '0')}.png` }); }
await at(+stillAt); await page.screenshot({ path: `${out}/still.png` });
await browser.close();
