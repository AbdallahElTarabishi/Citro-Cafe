/**
 * CITRO Café - Cloud Realtime Synchronization Engine
 * Powered by Firebase Realtime Database (with LocalStorage Fallback)
 */

const CitroCloud = (function () {
    const CLOUD_CONFIG_KEY = 'citro_cafe_cloud_config_v2';
    const DEFAULT_CLOUD_CONFIG = {
        databaseURL: 'https://citro-cafe-98867-default-rtdb.firebaseio.com',
        projectId: 'citro-cafe-98867'
    };
    let dbInstance = null;
    let dbRef = null;
    let isConnected = false;
    let updateCallback = null;

    // Load saved Firebase configuration or defaults
    function getCloudConfig() {
        try {
            const raw = localStorage.getItem(CLOUD_CONFIG_KEY);
            return raw ? JSON.parse(raw) : DEFAULT_CLOUD_CONFIG;
        } catch (e) {
            return DEFAULT_CLOUD_CONFIG;
        }
    }

    function saveCloudConfig(config) {
        try {
            localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
            init(config, updateCallback);
            return true;
        } catch (e) {
            console.error('Failed to save cloud config', e);
            return false;
        }
    }

    // Initialize Firebase Connection
    function init(customConfig = null, onCloudUpdate = null) {
        if (onCloudUpdate) updateCallback = onCloudUpdate;

        const config = customConfig || getCloudConfig();

        // If no config provided, run in Local-Only mode with local storage
        if (!config || !config.databaseURL) {
            updateConnectionStatus(false, 'وضع التخزين المحلي (بدون مزامنة سحابية)');
            return;
        }

        try {
            // Check if Firebase is loaded via CDN
            if (typeof firebase === 'undefined') {
                console.warn('Firebase SDK not loaded, running in offline mode');
                updateConnectionStatus(false, 'غير متصل (SDK غير متاح)');
                return;
            }

            // Initialize or retrieve existing app
            let app;
            if (!firebase.apps.length) {
                app = firebase.initializeApp(config);
            } else {
                app = firebase.app();
            }

            dbInstance = firebase.database(app);
            dbRef = dbInstance.ref('citro_cafe_data');

            // Monitor connection state
            const connectedRef = dbInstance.ref('.info/connected');
            connectedRef.on('value', (snap) => {
                if (snap.val() === true) {
                    isConnected = true;
                    updateConnectionStatus(true, 'متصل سحابياً (مزامنة لحظية)');
                } else {
                    isConnected = false;
                    updateConnectionStatus(false, 'جاري الاتصال بالسحابة...');
                }
            });

            // Listen for Realtime Cloud Updates
            dbRef.on('value', (snapshot) => {
                const cloudData = snapshot.val();
                if (cloudData && typeof updateCallback === 'function') {
                    updateCallback(cloudData);
                } else if (cloudData === null) {
                    // Database is fresh/empty, automatically seed with current menu & settings
                    if (typeof window.seedInitialCloudData === 'function') {
                        window.seedInitialCloudData();
                    }
                }
            }, (error) => {
                console.error('Firebase read error:', error);
                updateConnectionStatus(false, 'خطأ في قراءة السحابة: ' + (error.message || ''));
            });

        } catch (err) {
            console.error('Firebase init error:', err);
            updateConnectionStatus(false, 'فشل الاتصال: ' + (err.message || ''));
        }
    }

    // Push local update to cloud database
    async function syncToCloud(key, value) {
        // Always save locally first
        try {
            localStorage.setItem('citro_cafe_' + key + '_v2', JSON.stringify(value));
        } catch (e) {}

        // If connected to Firebase, push to cloud
        if (dbRef && isConnected) {
            try {
                await dbRef.child(key).set(value);
                return { success: true, mode: 'cloud' };
            } catch (err) {
                console.error('Cloud sync failed for key:', key, err);
                return { success: false, mode: 'local', error: err.message };
            }
        }

        return { success: true, mode: 'local' };
    }

    // Push entire snapshot to cloud (useful for initial setup)
    async function pushAllToCloud(allData) {
        if (!dbRef) return { success: false, error: 'السحابة غير مفعلة بعد' };
        try {
            await dbRef.set(allData);
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    function updateConnectionStatus(connected, text) {
        const badge = document.getElementById('cloudStatusBadge');
        const textEl = document.getElementById('cloudStatusText');
        if (badge && textEl) {
            textEl.textContent = text;
            if (connected) {
                badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300';
            } else {
                badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-300';
            }
        }
    }

    return {
        init,
        syncToCloud,
        pushAllToCloud,
        getCloudConfig,
        saveCloudConfig,
        isConfigured: () => Boolean(getCloudConfig() && getCloudConfig().databaseURL)
    };
})();
