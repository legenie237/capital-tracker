package com.capitaltracker.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;

/**
 * Appli Android de Capital Tracker : une fenêtre plein écran qui affiche le site
 * en ligne. Les liens externes (paiement, WhatsApp, etc.) s'ouvrent dans le
 * navigateur ou l'appli concernée.
 */
public class MainActivity extends Activity {

    static final String SITE = "https://capital-tracker-six.vercel.app";
    static final String HOTE = "capital-tracker-six.vercel.app";
    static final int CHOIX_FICHIER = 42;

    private WebView web;
    private ProgressBar barre;
    private ValueCallback<Uri[]> rappelFichier;
    private String derniereUrl = SITE + "/dashboard";

    @Override
    protected void onCreate(Bundle etat) {
        super.onCreate(etat);

        FrameLayout racine = new FrameLayout(this);
        racine.setBackgroundColor(Color.parseColor("#070a12"));

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#070a12"));
        racine.addView(web, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        barre = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        barre.setMax(100);
        barre.setIndeterminate(false);
        racine.addView(barre, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 8));
        setContentView(racine);

        WebSettings r = web.getSettings();
        r.setJavaScriptEnabled(true);
        r.setDomStorageEnabled(true);
        r.setDatabaseEnabled(true);
        r.setAllowFileAccess(false);
        r.setLoadWithOverviewMode(true);
        r.setUseWideViewPort(true);
        r.setMediaPlaybackRequiresUserGesture(true);
        r.setUserAgentString(r.getUserAgentString() + " CapitalTrackerAndroid/1.0");

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);

        web.setWebViewClient(new Client());
        web.setWebChromeClient(new Chrome());
        web.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String ua, String cd, String type, long len) {
                ouvrirAilleurs(Uri.parse(url));
            }
        });

        if (etat != null) {
            web.restoreState(etat);
        } else {
            Uri lien = getIntent() != null ? getIntent().getData() : null;
            web.loadUrl(lien != null && HOTE.equals(lien.getHost()) ? lien.toString() : SITE + "/dashboard");
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        Uri lien = intent.getData();
        if (lien != null && HOTE.equals(lien.getHost())) web.loadUrl(lien.toString());
    }

    @Override
    protected void onSaveInstanceState(Bundle etat) {
        super.onSaveInstanceState(etat);
        web.saveState(etat);
    }

    @Override
    protected void onPause() {
        super.onPause();
        CookieManager.getInstance().flush();
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onActivityResult(int code, int resultat, Intent donnees) {
        if (code == CHOIX_FICHIER && rappelFichier != null) {
            rappelFichier.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultat, donnees));
            rappelFichier = null;
            return;
        }
        super.onActivityResult(code, resultat, donnees);
    }

    private boolean estDuSite(Uri u) {
        return u != null && "https".equals(u.getScheme()) && HOTE.equals(u.getHost());
    }

    private void ouvrirAilleurs(Uri u) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, u));
        } catch (ActivityNotFoundException e) {
            // aucune appli pour ce lien : on ne fait rien
        }
    }

    private void pageHorsLigne() {
        String html = "<html><head><meta name='viewport' content='width=device-width,initial-scale=1'>"
                + "<style>body{background:#070a12;color:#e6edf7;font-family:sans-serif;display:flex;"
                + "flex-direction:column;align-items:center;justify-content:center;height:90vh;text-align:center;padding:24px}"
                + "h1{font-size:20px}p{color:#94a3b8}button{margin-top:16px;padding:12px 24px;border:0;border-radius:10px;"
                + "background:linear-gradient(90deg,#10b981,#22d3ee);color:#000;font-weight:bold;font-size:16px}</style></head>"
                + "<body><h1>Pas de connexion</h1><p>Vérifie ta connexion Internet, puis réessaie.</p>"
                + "<button onclick=\"location.href='" + derniereUrl.replace("'", "%27") + "'\">Réessayer</button></body></html>";
        web.loadDataWithBaseURL(SITE, html, "text/html", "utf-8", derniereUrl);
    }

    private class Client extends WebViewClient {
        @Override
        @SuppressWarnings("deprecation")
        public boolean shouldOverrideUrlLoading(WebView v, String url) {
            Uri u = Uri.parse(url);
            if (estDuSite(u)) return false;
            ouvrirAilleurs(u);
            return true;
        }

        @Override
        public void onPageStarted(WebView v, String url, Bitmap icone) {
            if (url != null && url.startsWith(SITE)) derniereUrl = url;
            barre.setVisibility(View.VISIBLE);
        }

        @Override
        public void onPageFinished(WebView v, String url) {
            barre.setVisibility(View.GONE);
            CookieManager.getInstance().flush();
        }

        @Override
        public void onReceivedError(WebView v, WebResourceRequest req, WebResourceError err) {
            if (req.isForMainFrame()) pageHorsLigne();
        }
    }

    private class Chrome extends WebChromeClient {
        @Override
        public void onProgressChanged(WebView v, int p) {
            barre.setProgress(p);
        }

        @Override
        public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> rappel, FileChooserParams params) {
            if (rappelFichier != null) rappelFichier.onReceiveValue(null);
            rappelFichier = rappel;
            try {
                Intent i = params.createIntent();
                if (params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) {
                    i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                }
                // les fichiers MT5 (.htm/.html) n'ont pas toujours le bon type : on accepte tout
                String[] types = params.getAcceptTypes();
                boolean images = types.length > 0 && types[0].startsWith("image/");
                i.setType(images ? "image/*" : "*/*");
                startActivityForResult(Intent.createChooser(i, "Choisir un fichier"), CHOIX_FICHIER);
            } catch (ActivityNotFoundException e) {
                rappelFichier = null;
                return false;
            }
            return true;
        }
    }
}
