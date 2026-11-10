# Unit voices and gameplay audio — 10 November 2026

The live game now uses the user-approved neural military voice as part of an offline, per-unit voice bank. This replaces the older robotic speech recordings. No campaign narration or illustrations were generated or changed in this pass.

- 237 unit definitions have category-specific select, move, attack, spawn and repeated-click responses. Workers also have work responses. Each category uses six variants, shuffled without repetition until the bag is exhausted; the first line in the next bag cannot repeat the last line of the previous bag.
- A selected group emits one response. Repeated clicks choose the unit's annoyed responses. Monsters, animals and appropriate mechanical units use original procedural vocal/equipment sounds, according to the profile manifest.
- Symbiote responses use five distinct recorded voice layers playing together. Layers share an onset and duration, with restrained stereo spread and volume. These are separate speakers, not five delayed copies of one waveform.
- Unit and base attack warnings interrupt ordinary acknowledgments and have a ten-second gameplay alert cooldown. Music ducks under speech. Opening a campaign cinematic stops unit voices and mutes gameplay audio, avoiding doubled soundtracks.
- Default gameplay music volume is 40%; the old exact default migrates to this setting. User-adjusted values are preserved. Music and effects are generated locally; voice OGG files are bundled for HTTP and direct file launch.
- Runtime loads recordings on demand and bounds its decoded cache. It has no network speech service or dependency on installed Windows voices.

## Files and reproducibility

`src/voice-bank.js` is the installed manifest; `src/audio.js` handles playback. `docs/VOICE-RECORDING-MANIFEST.json` contains every unit profile, line, category and path. Source dialogue and profile assignments are in `tests/prepare-neural-voices.cjs`; local generation is in `tests/render-neural-voices.py`. The generator and temporary model tools are development dependencies only, under `.art-work`; playing requires none of them.

Speech uses the Kokoro-82M stock model/voices, licensed Apache-2.0: https://huggingface.co/hexgrad/Kokoro-82M . The local inference wrapper is kokoro-onnx: https://github.com/thewh1teagle/kokoro-onnx . Dialogue, nonverbal synthesis and sound processing are authored for this game. No commercial-game recordings or cloned celebrity voice are used. Model weights are development files only and are not loaded during gameplay. Consult the linked model repository for its license text and notices.

## Verification

`docs/voice-assets-verification.json`: 9,612 files, 2,662 unique recordings, 126,354,236 bytes; every referenced recording exists, decodes and contains finite, nonsilent audio. Collective lines have five distinct recordings. Duration range is 0.576–4.520 seconds.

`tests/neural-audio-browser.cjs` and `tests/audio-neutral-browser.cjs` passed against the installed live files: shuffled responses, one group voice, attack orders, collective layers, warning priority, music gain, cinematic muting and direct offline launch. The user approved the military base sample and subsequently reported that the sound is much better. This is not a claim that every species' voice has received individual listening approval.

The obsolete `assets/audio/voices` WAV bank was removed after live and offline playback passed. The 126 MB OGG bank, campaign MP3s and source dialogue remain.
