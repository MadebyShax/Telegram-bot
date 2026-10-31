#!/usr/bin/env python3
"""
Repairs and re-packages the "3D QR" Android APK (WebView wrapper around a Vite build).

Problems fixed (see README.md for details):
  1. Asset file names were stored with Windows backslashes ("assets\\index-XXX.js"),
     so the WebView could not find the bundle -> blank screen.
  2. index.html referenced "/assets/..." (absolute path). In a WebView loaded from
     file:///android_asset/ that resolves to file:///assets/... -> not found.
  3. The bundle was loaded as <script type="module"> from file://. Chromium/WebView
     blocks module scripts from file:// (CORS, origin "null"). The bundle is an ES
     module that also lazy-loads model-viewer, so it is re-bundled into one classic
     IIFE script that works from file://.
  4. The API base was the relative "/api". From file:// it points at the device's
     file system, so every backend call fails. It is set to the production host
     that the bundle itself uses: https://3dqr.io/api.
  5. The original APK was signed with an unknown key and its signature no longer
     matches changed content, so the package is re-signed with a new key (v2 scheme).
  6. The page was 462px wide on 412px phones, clipping the Sign In button. Small CSS
     overrides (CSS_FIXES) keep the layout inside the screen.
  7. The unused CDN <script> for model-viewer was removed: the bundle already contains
     model-viewer, and the CDN copy required a network request on every start.

Usage:
  python3 build_apk.py <original.apk> <output.apk> [--keystore PATH] [--api-base URL]

Requirements: python3, java (JDK), npm/npx (to run esbuild 0.25.0), tools/apksig.jar
(apksig 2.3.0 from Maven Central, see README.md).
"""
import argparse
import os
import re
import shutil
import struct
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
APKSIG_JAR = HERE / "tools" / "apksig.jar"
SIGN_CLASSES = HERE / "tools" / "classes"
DEFAULT_KEYSTORE = Path.home() / ".apk-keys" / "3dqr-fix.p12"
KEY_PASS = "3dqr-fix-pass"
KEY_ALIAS = "3dqr-fix"
DEFAULT_API = "https://3dqr.io/api"
# apksig 2.3.0 reaches into JDK internals (sun.security.x509); modern JDKs need an export.
JAVA_OPTS = [f"--add-exports=java.base/{pkg}=ALL-UNNAMED"
             for pkg in ("sun.security.x509", "sun.security.pkcs", "sun.security.util")]

INDEX_HTML = """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232563EB'><rect width='24' height='24' rx='6'/></svg>" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <title>3D QR</title>
    <link rel="stylesheet" href="./app.css" />
  </head>
  <body>
    <div id="root"></div>
    <!-- Classic (non-module) script: works from file:///android_asset/ inside the WebView. -->
    <script src="./app.js"></script>
  </body>
</html>
"""

# Bundle entries that live in the APK under the (wrongly named) backslash paths.
MAIN_JS_RE = re.compile(r"index-[A-Za-z0-9_-]+\.js$")
MODEL_JS_RE = re.compile(r"model-viewer-[A-Za-z0-9_-]+\.js$")
CSS_RE = re.compile(r"index-[A-Za-z0-9_-]+\.css$")

# Layout fixes for phone widths (412px): the page was 462px wide, so the Sign In button
# was clipped. Appended to the original stylesheet; desktop layout is unchanged.
CSS_FIXES = """
/* build fix: keep the page inside the phone width */
main.container{box-sizing:border-box;width:100%!important;min-width:0}
html,body{max-width:100%;overflow-x:hidden}
header .container{flex-wrap:wrap!important;row-gap:.5rem}
"""


def run(cmd, **kw):
    print("+", " ".join(str(c) for c in cmd))
    subprocess.run(cmd, check=True, **kw)


def normalize(name: str) -> str:
    """Turn 'assets\\index-X.js' (Windows separators) into 'assets/index-X.js'."""
    return name.replace("\\", "/")


def expect_one(text: str, old: str, new: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"patch anchor found {count} times (expected 1): {old[:60]!r}")
    return text.replace(old, new)


def patch_main_js(src: str, api_base: str) -> str:
    # API base: the relative "/api" can never work from file://, so use the real host.
    return expect_one(src, "Vt=`/api`", f"Vt=`{api_base}`")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("original")
    ap.add_argument("output")
    ap.add_argument("--keystore", default=str(DEFAULT_KEYSTORE))
    ap.add_argument("--api-base", default=DEFAULT_API)
    args = ap.parse_args()

    work = Path(tempfile.mkdtemp(prefix="3dqr-build-"))
    print("work dir:", work)
    src_dir = work / "src"
    out_dir = work / "out"
    src_dir.mkdir()
    out_dir.mkdir()

    with zipfile.ZipFile(args.original) as zin:
        entries = {normalize(i.filename): zin.read(i.filename) for i in zin.infolist()}

    main_name = next(n for n in entries if n.startswith("assets/") and MAIN_JS_RE.search(n))
    model_name = next(n for n in entries if n.startswith("assets/") and MODEL_JS_RE.search(n))
    css_name = next(n for n in entries if n.startswith("assets/") and CSS_RE.search(n))
    print("bundle:", main_name, "| chunk:", model_name, "| css:", css_name)

    # --- Step 1: patch the main bundle and prepare the esbuild input ---
    main_src = patch_main_js(entries[main_name].decode("utf-8"), args.api_base)
    model_src = entries[model_name].decode("utf-8")
    # import.meta is undefined in a classic script; give the code an equivalent object.
    main_src = main_src.replace("import.meta", "__import_meta")
    model_src = model_src.replace("import.meta", "__import_meta")
    # Keep the original file names: the model-viewer chunk imports its helpers from the
    # main module by name ("./index-XXXX.js"), so both files must sit side by side.
    main_file = src_dir / Path(main_name).name
    main_file.write_text(main_src, encoding="utf-8")
    (src_dir / Path(model_name).name).write_text(model_src, encoding="utf-8")

    # --- Step 2: bundle everything into ONE classic IIFE script ---
    banner = "var __import_meta={url:location.href,resolve:void 0};"
    run([
        "npx", "--yes", "esbuild@0.25.0", str(main_file),
        "--bundle", "--format=iife", "--minify", "--target=es2020",
        f"--banner:js={banner}",
        f"--outfile={out_dir / 'app.js'}",
    ])
    app_js = (out_dir / "app.js").read_bytes()
    # The lazy chunk must be inlined: its file name must not survive in the output.
    if Path(model_name).name.encode("utf-8") in app_js:
        raise SystemExit("esbuild did not inline the model-viewer chunk")

    # --- Step 3: assemble the APK file tree (served from file:///android_asset/) ---
    files = {
        "AndroidManifest.xml": entries["AndroidManifest.xml"],
        "classes.dex": entries["classes.dex"],
        "resources.arsc": entries["resources.arsc"],
    }
    for n, data in entries.items():
        if n.startswith("res/"):
            files[n] = data
    files["assets/index.html"] = INDEX_HTML.encode("utf-8")
    files["assets/app.js"] = app_js
    files["assets/app.css"] = entries[css_name] + CSS_FIXES.encode("utf-8")

    unsigned = work / "unsigned.apk"
    write_zip(unsigned, files)

    # --- Step 4: sign (v2 scheme) ---
    if not APKSIG_JAR.exists():
        raise SystemExit(f"missing {APKSIG_JAR}; download apksig 2.3.0 (see README.md)")
    if not (SIGN_CLASSES / "ApkSign.class").exists():
        SIGN_CLASSES.mkdir(parents=True, exist_ok=True)
        run(["javac", "-cp", str(APKSIG_JAR), "-d", str(SIGN_CLASSES), str(HERE / "tools" / "ApkSign.java")])
    ks_path = Path(args.keystore)
    if not ks_path.exists():
        ks_path.parent.mkdir(parents=True, exist_ok=True)
        run(["keytool", "-genkeypair", "-keystore", str(ks_path), "-storetype", "PKCS12",
             "-alias", KEY_ALIAS, "-keyalg", "RSA", "-keysize", "2048", "-validity", "18000",
             "-dname", "CN=3DQR Fix, O=Local Build, C=UZ",
             "-storepass", KEY_PASS, "-keypass", KEY_PASS])
    signed = work / "signed.apk"
    run(["java", *JAVA_OPTS, "-cp", f"{APKSIG_JAR}{os.pathsep}{SIGN_CLASSES}", "ApkSign", "sign",
         str(unsigned), str(signed), str(ks_path), KEY_PASS, KEY_ALIAS, KEY_PASS])

    shutil.copy(signed, args.output)
    print("\nOutput:", args.output)
    run(["java", *JAVA_OPTS, "-cp", f"{APKSIG_JAR}{os.pathsep}{SIGN_CLASSES}", "ApkSign", "verify", args.output])
    return 0


def write_zip(path: Path, files: dict) -> None:
    """Write a zip where resources.arsc is STORED and 4-byte aligned (like zipalign)."""
    stamp = (1980, 1, 1, 0, 0, 0)
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as zout:
        for name, data in files.items():
            zi = zipfile.ZipInfo(name, date_time=stamp)
            if name == "resources.arsc":
                zi.compress_type = zipfile.ZIP_STORED
                header_len = 30 + len(name.encode("utf-8"))
                data_start = zout.fp.tell() + header_len
                pad = (-data_start) % 4
                if pad:
                    if pad < 4:
                        pad += 4  # an extra field needs at least a 4-byte header
                    zi.extra = struct.pack("<HH", 0xD935, pad - 4) + b"\0" * (pad - 4)
            else:
                zi.compress_type = zipfile.ZIP_DEFLATED
            zout.writestr(zi, data)


if __name__ == "__main__":
    sys.exit(main())
