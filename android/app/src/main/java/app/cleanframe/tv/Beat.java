package app.cleanframe.tv;

import android.content.Context;
import android.content.pm.PackageManager;
import android.media.audiofx.Visualizer;

/**
 * Beat level of what the TV is playing, for the music view's beat pulse. Android's Visualizer reads the
 * mixed output (audio session 0), never the microphone, but it still needs RECORD_AUDIO. Only one number,
 * 0 to 1, leaves this class, refreshed about twenty times a second.
 *
 * Songs carry their beat in different places: an 808 in the sub bass, a kick, a snare or claps, or hi-hats
 * and high drums. Five bands are watched at once; each keeps a few seconds of onsets (sudden rises above its
 * own average) and is scored on how regular they are (autocorrelation at 60 to 200 BPM) and how sharp. The
 * best band drives the pulse, it only changes when another is clearly better, and a new song starts over.
 */
final class Beat {
    static final String PERMISSION = "android.permission.RECORD_AUDIO";
    private static Visualizer vis;
    private static volatile float level;

    /** Hz ranges: sub/808, kick, snare body, snare and claps, hats and high drums. */
    private static final float[][] BANDS = { { 25, 70 }, { 70, 160 }, { 160, 500 }, { 1500, 5000 }, { 6000, 14000 } };
    private static final int HISTORY = 160, START_BAND = 1; // 8 s at 20 captures a second; the kick until the song has taught us
    private static final Object LOCK = new Object();
    private static final float[] avg = new float[BANDS.length], last = new float[BANDS.length], peak = new float[BANDS.length], score = new float[BANDS.length];
    private static final float[][] flux = new float[BANDS.length][HISTORY];
    private static int at, frames, band = START_BAND;

    private Beat() { }

    static boolean allowed(Context context) { return context.checkSelfPermission(PERMISSION) == PackageManager.PERMISSION_GRANTED; }

    /** Starts listening; false without permission or when the TV refuses a visualizer. */
    static synchronized boolean start(Context context) {
        if (vis != null) return true;
        if (!allowed(context)) return false;
        try {
            Visualizer v = new Visualizer(0);
            v.setEnabled(false);
            int[] range = Visualizer.getCaptureSizeRange();
            v.setCaptureSize(Math.max(range[0], Math.min(1024, range[1])));
            v.setDataCaptureListener(new Visualizer.OnDataCaptureListener() {
                @Override public void onWaveFormDataCapture(Visualizer x, byte[] wave, int rate) { }
                @Override public void onFftDataCapture(Visualizer x, byte[] fft, int rate) { analyse(fft, rate); }
            }, Visualizer.getMaxCaptureRate(), false, true);
            v.setEnabled(true);
            vis = v;
            return true;
        } catch (Throwable e) { return false; }
    }

    static synchronized void stop() {
        if (vis == null) return;
        try { vis.setEnabled(false); vis.release(); } catch (Throwable ignored) { }
        vis = null; level = 0;
    }

    /** A new song: forget what was learned. */
    static void reset() {
        synchronized (LOCK) {
            for (int b = 0; b < BANDS.length; b++) { avg[b] = last[b] = score[b] = 0; peak[b] = 1; java.util.Arrays.fill(flux[b], 0); }
            at = frames = 0; band = START_BAND; level = 0;
        }
    }

    /** -1 while not listening, otherwise how far the bass stands above its recent average, 0 to 1. */
    static float level() { return vis == null ? -1 : level; }

    private static void analyse(byte[] fft, int rateMilliHz) {
        synchronized (LOCK) {
            int n = fft.length;
            float hz = rateMilliHz / 1000f;
            for (int b = 0; b < BANDS.length; b++) {
                int from = Math.max(1, Math.round(BANDS[b][0] * n / hz)), to = Math.max(from, Math.round(BANDS[b][1] * n / hz)), count = 0;
                float sum = 0;
                for (int k = from; k <= to && 2 * k + 1 < n; k++, count++) sum += (float) Math.hypot(fft[2 * k], fft[2 * k + 1]);
                float e = count > 0 ? sum / count : 0;
                // Onset: how far this capture rose above the last one, against the band's own average, so quiet hats count as much as loud 808s.
                float rise = Math.max(0, e - Math.max(last[b], avg[b] * 1.15f)) / (avg[b] + 1f);
                last[b] = e;
                avg[b] = avg[b] == 0 ? e : avg[b] * .95f + e * .05f;
                flux[b][at] = rise;
                peak[b] = Math.max(rise, peak[b] * .996f);
            }
            at = (at + 1) % HISTORY;
            if (++frames % 20 == 0 && frames >= 60) learn(); // once a second, after three seconds
            float v = peak[band] > 0 ? flux[band][(at + HISTORY - 1) % HISTORY] / peak[band] : 0;
            level = v < .35f ? 0 : Math.min(1, (v - .35f) / .65f);
        }
    }

    /** Scores every band and moves the pulse to a clearly better one. */
    private static void learn() {
        int filled = Math.min(frames, HISTORY), best = band;
        for (int b = 0; b < BANDS.length; b++) {
            float mean = 0, energy = 0, top = 0;
            for (int i = 0; i < filled; i++) { float f = flux[b][i]; mean += f; energy += f * f; }
            mean /= filled;
            if (energy <= 0) { score[b] = 0; continue; }
            // Regularity: the strongest repeat between 6 and 20 captures apart (200 to 60 BPM), against the signal itself.
            for (int lag = 6; lag <= 20; lag++) {
                float r = 0;
                for (int i = lag; i < filled; i++) r += flux[b][(at - 1 - i + lag + 2 * HISTORY) % HISTORY] * flux[b][(at - 1 - i + 2 * HISTORY) % HISTORY];
                top = Math.max(top, r / energy);
            }
            // Sharpness: hits that stand out from the band's usual movement.
            float sharp = mean > 0 ? Math.min(4, peakMean(flux[b], filled) / mean) / 4 : 0;
            score[b] = score[b] * .6f + (top * .7f + sharp * .3f) * .4f;
            if (score[b] > score[best] * 1.25f) best = b;
        }
        band = best;
    }

    /** Mean of the strongest tenth of the history: how big a hit is. */
    private static float peakMean(float[] h, int filled) {
        float[] copy = java.util.Arrays.copyOf(h, filled);
        java.util.Arrays.sort(copy);
        int k = Math.max(1, filled / 10);
        float sum = 0;
        for (int i = filled - k; i < filled; i++) sum += copy[i];
        return sum / k;
    }
}
