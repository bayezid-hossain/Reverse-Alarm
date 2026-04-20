// Expo Config Plugin for Reverse Alarm
// Mirrors the withOasisModule.js pattern from the Oasis project.
// Runs during `expo prebuild` to inject native Android files and patches.

const {
  withAppBuildGradle,
  withAndroidManifest,
  withMainApplication,
  withDangerousMod,
  withGradleProperties,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PACKAGE_NAME = 'com.reversealarm.app';
const PACKAGE_PATH = PACKAGE_NAME.replace(/\./g, '/');

// ─── Step 1: Copy android-src-staging → android/app/src/main/java/... ────────
function withCopyNativeSources(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const stagingDir = path.join(projectRoot, 'android-src-staging');
      const destDir = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        ...PACKAGE_PATH.split('/')
      );

      if (!fs.existsSync(stagingDir)) {
        console.warn('[withReverseAlarmModule] android-src-staging not found, skipping copy.');
        return cfg;
      }

      copyDirRecursive(stagingDir, destDir);
      console.log('[withReverseAlarmModule] Copied android-src-staging → android sources.');
      return cfg;
    },
  ]);
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ─── Step 2: Copy android-res → android/app/src/main/res/ ───────────────────
function withCopyAndroidRes(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const srcRes = path.join(projectRoot, 'android-res');
      const destRes = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');

      if (fs.existsSync(srcRes)) {
        copyDirRecursive(srcRes, destRes);
        console.log('[withReverseAlarmModule] Copied android-res → android res.');
      }
      return cfg;
    },
  ]);
}

// ─── Step 3: Patch AndroidManifest.xml ───────────────────────────────────────
function withAndroidManifestPatch(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;

    if (!manifest.manifest.$['xmlns:tools']) {
      manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    const app = manifest.manifest.application[0];
    
    app.$['android:appComponentFactory'] = 'androidx.core.app.CoreComponentFactory';
    if (!app.$['tools:replace']) {
      app.$['tools:replace'] = 'android:appComponentFactory';
    } else if (!app.$['tools:replace'].includes('android:appComponentFactory')) {
      app.$['tools:replace'] += ',android:appComponentFactory';
    }

    // Services
    const services = app.service || [];
    const serviceExists = (name) => services.some((s) => s.$['android:name'] === name);

    if (!serviceExists('.AlarmForegroundService')) {
      services.push({
        $: {
          'android:name': '.AlarmForegroundService',
          'android:foregroundServiceType': 'mediaPlayback',
          'android:exported': 'false',
        },
      });
    }
    app.service = services;

    // Receivers
    const receivers = app.receiver || [];
    const receiverExists = (name) => receivers.some((r) => r.$['android:name'] === name);

    if (!receiverExists('.AlarmBroadcastReceiver')) {
      receivers.push({
        $: {
          'android:name': '.AlarmBroadcastReceiver',
          'android:exported': 'false',
        },
      });
    }

    if (!receiverExists('.BootReceiver')) {
      receivers.push({
        $: {
          'android:name': '.BootReceiver',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } },
              { $: { 'android:name': 'android.intent.action.LOCKED_BOOT_COMPLETED' } },
            ],
          },
        ],
      });
    }
    app.receiver = receivers;

    // MainActivity flags
    const activities = app.activity || [];
    const mainActivity = activities.find(
      (a) => a.$['android:name'] === '.MainActivity'
    );
    if (mainActivity) {
      mainActivity.$['android:showWhenLocked'] = 'true';
      mainActivity.$['android:turnScreenOn'] = 'true';
      mainActivity.$['android:launchMode'] = 'singleTop';
    }

    return cfg;
  });
}

// ─── Step 4: Patch app/build.gradle ─────────────────────────────────────────
function withAppBuildGradlePatch(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;

    // Add kapt plugin if missing
    if (!gradle.includes("apply plugin: 'kotlin-kapt'") && !gradle.includes('id("kotlin-kapt")')) {
      gradle = gradle.replace(
        /apply plugin: 'com\.android\.application'/,
        "apply plugin: 'com.android.application'\napply plugin: 'kotlin-kapt'"
      );
    }

    // Add dependencies if missing
    if (!gradle.includes('androidx.work:work-runtime-ktx')) {
      gradle = gradle.replace(
        /dependencies \{/,
        `dependencies {
    // Reverse Alarm
    implementation 'androidx.work:work-runtime-ktx:2.9.0'
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'`
      );
    }

    cfg.modResults.contents = gradle;
    return cfg;
  });
}

// ─── Step 5: Patch MainApplication.kt to register packages ──────────────────
function withMainApplicationPatch(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const mainAppPath = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        ...PACKAGE_PATH.split('/'),
        'MainApplication.kt'
      );

      // The MainApplication.kt from android-src-staging already has the packages.
      // This step is a safety check / fallback.
      if (fs.existsSync(mainAppPath)) {
        let content = fs.readFileSync(mainAppPath, 'utf8');
        const packages = [
          'AlarmPackage()',
          'ForegroundServicePackage()',
          'WakeLockPackage()',
          'VolumePackage()',
          'LockTaskPackage()',
        ];
        const missingPackages = packages.filter((p) => !content.includes(p));
        if (missingPackages.length > 0) {
          const additions = missingPackages.map((p) => `                    add(${p})`).join('\n');
          content = content.replace(
            /PackageList\(this\)\.packages\.apply \{/,
            `PackageList(this).packages.apply {\n${additions}`
          );
          fs.writeFileSync(mainAppPath, content, 'utf8');
          console.log('[withReverseAlarmModule] Patched MainApplication.kt with missing packages.');
        }
      }
      return cfg;
    },
  ]);
}

// ─── Step 6: Write ProGuard rules ────────────────────────────────────────────
function withProguardRules(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const proguardPath = path.join(projectRoot, 'android', 'app', 'proguard-rules.pro');
      const rules = `
# Reverse Alarm — keep native module classes
-keep class com.reversealarm.app.AlarmModule { *; }
-keep class com.reversealarm.app.AlarmPackage { *; }
-keep class com.reversealarm.app.ForegroundServiceModule { *; }
-keep class com.reversealarm.app.ForegroundServicePackage { *; }
-keep class com.reversealarm.app.WakeLockModule { *; }
-keep class com.reversealarm.app.WakeLockPackage { *; }
-keep class com.reversealarm.app.VolumeModule { *; }
-keep class com.reversealarm.app.VolumePackage { *; }
-keep class com.reversealarm.app.LockTaskModule { *; }
-keep class com.reversealarm.app.LockTaskPackage { *; }
-keep class com.reversealarm.app.AlarmForegroundService { *; }
-keep class com.reversealarm.app.AlarmBroadcastReceiver { *; }
-keep class com.reversealarm.app.BootReceiver { *; }
`;
      const existing = fs.existsSync(proguardPath)
        ? fs.readFileSync(proguardPath, 'utf8')
        : '';
      if (!existing.includes('Reverse Alarm')) {
        fs.appendFileSync(proguardPath, rules, 'utf8');
        console.log('[withReverseAlarmModule] Appended ProGuard rules.');
      }
      return cfg;
    },
  ]);
}

// ─── Step 7: Patch gradle.properties ─────────────────────────────────────────
function withGradlePropertiesPatch(config) {
  return withGradleProperties(config, (cfg) => {
    const jetifierKey = 'android.enableJetifier';
    const jetifierProp = cfg.modResults.find((item) => item.type === 'property' && item.key === jetifierKey);
    if (!jetifierProp) {
      cfg.modResults.push({
        type: 'property',
        key: jetifierKey,
        value: 'true',
      });
    } else {
      jetifierProp.value = 'true';
    }

    // Disable new architecture — custom native modules use the old bridge API
    // and the new arch native C++ libs (libreact_featureflagsjni.so) are not bundled.
    const newArchKey = 'newArchEnabled';
    const newArchProp = cfg.modResults.find((item) => item.type === 'property' && item.key === newArchKey);
    if (!newArchProp) {
      cfg.modResults.push({
        type: 'property',
        key: newArchKey,
        value: 'true',
      });
    } else {
      newArchProp.value = 'true';
    }

    return cfg;
  });
}

// ─── Compose all steps ───────────────────────────────────────────────────────
module.exports = function withReverseAlarmModule(config) {
  config = withCopyNativeSources(config);
  config = withCopyAndroidRes(config);
  config = withAndroidManifestPatch(config);
  config = withAppBuildGradlePatch(config);
  config = withMainApplicationPatch(config);
  config = withProguardRules(config);
  config = withGradlePropertiesPatch(config);
  return config;
};
