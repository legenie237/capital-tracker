#!/usr/bin/env bash
# Construit l'APK Android de Capital Tracker sans Android Studio ni Gradle.
# Outils (Ubuntu) : sudo apt install android-sdk-platform-23 aapt zipalign apksigner dalvik-exchange openjdk-17-jdk
# Usage : KEYSTORE=chemin.jks KS_PASS=motdepasse ./build.sh   -> build/capital-tracker.apk
set -euo pipefail
cd "$(dirname "$0")"
ANDROID_JAR=${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}
KEYSTORE=${KEYSTORE:?indique le fichier de clé de signature (KEYSTORE=...)}
KS_PASS=${KS_PASS:?indique le mot de passe de la clé (KS_PASS=...)}
KS_ALIAS=${KS_ALIAS:-capitaltracker}

rm -rf build && mkdir -p build/gen build/classes build/dex
aapt package -f -m -J build/gen -M AndroidManifest.xml -S res -I "$ANDROID_JAR" --min-sdk-version 23 --target-sdk-version 34
javac -source 8 -target 8 -Xlint:-options -encoding UTF-8 -bootclasspath "$ANDROID_JAR" \
  -d build/classes $(find src build/gen -name '*.java')
dalvik-exchange --dex --min-sdk-version=23 --output=build/dex/classes.dex build/classes
aapt package -f -M AndroidManifest.xml -S res -I "$ANDROID_JAR" --min-sdk-version 23 --target-sdk-version 34 -F build/unsigned.apk
(cd build/dex && aapt add ../unsigned.apk classes.dex >/dev/null)
zipalign -f -p 4 build/unsigned.apk build/aligned.apk
apksigner sign --ks "$KEYSTORE" --ks-pass "pass:$KS_PASS" --ks-key-alias "$KS_ALIAS" \
  --out build/capital-tracker.apk build/aligned.apk
apksigner verify --print-certs build/capital-tracker.apk | head -3
echo "APK prête : $(pwd)/build/capital-tracker.apk"
