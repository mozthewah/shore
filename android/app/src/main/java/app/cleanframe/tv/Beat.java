package app.cleanframe.tv;

import android.content.Context;
import android.content.pm.PackageManager;
import android.media.audiofx.Visualizer;

/**
 * Bass level of what the TV is playing, for the music view's beat pulse. Android's Visualizer reads the
 * mixed output (audio session 0), never the microphone, but it still needs RECORD_AUDIO. Only the strength
 * of the low end leaves this class: one number, 0 to 1, refreshed about twenty times a second.
 */
final class Beat {
    static final String PERMISSION = "android.permission.RECORD_AUDIO";
    private static Visualizer vis;
    private static volatile float level;
    private static float slow, peak = 1;

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

    /** -1 while not listening, otherwise how far the bass stands above its recent average, 0 to 1. */
    static float level() { return vis == null ? -1 : level; }

    /** Kick and bass hits only: energy from 35 to 120 Hz has to jump clearly above its own recent average.
     *  A steady bass line, vocals and everything above the low end leave the level at 0. */
    private static void analyse(byte[] fft, int rateMilliHz) {
        int n = fft.length;
        float hz = rateMilliHz / 1000f, sum = 0;
        int from = Math.max(1, Math.round(35 * n / hz)), to = Math.max(from, Math.round(120 * n / hz));
        for (int k = from; k <= to && 2 * k + 1 < n; k++) sum += (float) Math.hypot(fft[2 * k], fft[2 * k + 1]);
        float e = sum / (to - from + 1), rise = e - slow * 1.3f;
        slow = slow * .9f + e * .1f;
        peak = Math.max(rise, peak * .996f);
        float v = rise > 0 && peak > 0 ? rise / peak : 0;
        level = v < .35f ? 0 : Math.min(1, (v - .35f) / .65f);
    }
}
