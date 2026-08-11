import { Audio, AVPlaybackStatus } from 'expo-av';

const soundFiles: Record<string, any> = {
    success: require('../../assets/sounds/success.wav'),
    fail:    require('../../assets/sounds/fail.wav'),
    win:     require('../../assets/sounds/win.wav'),
    tap:     require('../../assets/sounds/tap.wav'),
};

let audioReady = false;

async function ensureAudio() {
    if (audioReady) return;
    try {
        await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            staysActiveInBackground: false,
            playThroughEarpieceAndroid: false,
        });
        audioReady = true;
    } catch (e) {
        console.warn('[SoundManager] Audio init failed:', e);
    }
}

export const SoundManager = {
    play: async (name: string) => {
        try {
            const source = soundFiles[name];
            if (!source) {
                console.warn('[SoundManager] Unknown sound:', name);
                return;
            }

            await ensureAudio();
            const { sound } = await Audio.Sound.createAsync(source, {
                shouldPlay: true,
                volume: 1.0,
            });

            sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
                if (status.isLoaded && status.didJustFinish) {
                    sound.unloadAsync().catch(() => {});
                }
            });
        } catch (e) {
            console.warn('[SoundManager] Play failed for', name, ':', e);
        }
    },

    preload: async () => {
        await ensureAudio();
    },
};
