const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PACKAGE_NAME = 'com.reversealarm.app';
const PACKAGE_PATH = PACKAGE_NAME.split('.');

const targetPropertiesPath = path.join(__dirname, 'android', 'local.properties');
const sourcePropertiesPath = path.join('C:', 'Users', 'amiba', 'Projects', 'poultry-solution', 'android', 'local.properties');

const stagingDir = path.join(__dirname, 'android-src-staging');
const javaBaseDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'java', ...PACKAGE_PATH);

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

function ensurePrebuild() {
    console.log('--- Reverse Alarm Prebuild ---');

    const args = process.argv.slice(2);
    const isClean = args.includes('--clean');

    // 1. Run expo prebuild
    if (isClean) {
        console.log('Running npx expo prebuild --clean...');
        try {
            execSync('npx expo prebuild --platform android --clean', { stdio: 'inherit' });
            console.log('Expo prebuild --clean completed.');
        } catch (err) {
            console.error(`Expo prebuild failed: ${err.message}`);
            process.exit(1);
        }
    }

    // 2. Sync local.properties (not committed, must be restored after --clean)
    if (!fs.existsSync(targetPropertiesPath)) {
        if (fs.existsSync(sourcePropertiesPath)) {
            console.log('Copying local.properties...');
            fs.mkdirSync(path.dirname(targetPropertiesPath), { recursive: true });
            fs.copyFileSync(sourcePropertiesPath, targetPropertiesPath);
            console.log('local.properties copied.');
        } else {
            console.warn('local.properties not found — set sdk.dir manually in android/local.properties');
        }
    } else {
        console.log('local.properties exists.');
    }

    // 3. Sync android-src-staging → java/com/reversealarm/app/ (safety net for non-clean runs)
    if (fs.existsSync(stagingDir)) {
        console.log(`Syncing android-src-staging → ${path.relative(__dirname, javaBaseDir)}...`);
        try {
            copyRecursiveSync(stagingDir, javaBaseDir);
            console.log('Kotlin sources synced.');
        } catch (err) {
            console.error(`Failed to sync sources: ${err.message}`);
        }
    } else {
        console.warn('android-src-staging not found.');
    }

    // 4. Verify namespace in android/app/build.gradle
    //    parsePackageNameAsync (expo-modules-autolinking) only matches the double-quoted
    //    form; single quotes silently fall back to a truncated package.
    const buildGradlePath = path.join(__dirname, 'android', 'app', 'build.gradle');
    if (fs.existsSync(buildGradlePath)) {
        let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
        const hasCorrect = buildGradle.includes(`namespace "${PACKAGE_NAME}"`);
        if (!hasCorrect) {
            const fixed = buildGradle.replace(
                /namespace\s*[=]*\s*["'][^"']*["']/,
                `namespace "${PACKAGE_NAME}"`
            );
            if (fixed !== buildGradle) {
                fs.writeFileSync(buildGradlePath, fixed, 'utf8');
                console.log(`Corrected namespace to ${PACKAGE_NAME} in android/app/build.gradle`);
            } else {
                const withNs = buildGradle.replace(
                    /android\s*\{/,
                    `android {\n    namespace "${PACKAGE_NAME}"`
                );
                fs.writeFileSync(buildGradlePath, withNs, 'utf8');
                console.log(`Added namespace ${PACKAGE_NAME} to android/app/build.gradle`);
            }
        } else {
            console.log(`namespace ${PACKAGE_NAME} confirmed in android/app/build.gradle`);
        }
    }

    // 5. Nuke cached autolinking.json
    const autolinkCacheDir = path.join(__dirname, 'android', 'build', 'generated', 'autolinking');
    if (fs.existsSync(autolinkCacheDir)) {
        for (const f of fs.readdirSync(autolinkCacheDir)) {
            try { fs.unlinkSync(path.join(autolinkCacheDir, f)); } catch {}
        }
        console.log('Cleared autolinking cache.');
    }

    console.log('--- Prebuild Complete ---');
}

ensurePrebuild();
