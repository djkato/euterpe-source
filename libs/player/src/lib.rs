use futures_signals::signal::Mutable;
use wasm_bindgen::JsValue;
use wasm_bindgen_futures::JsFuture;
use web_sys::{
    AudioContext, AudioContextState, AudioNode, GainNode, HtmlAudioElement,
    MediaElementAudioSourceNode,
};

pub struct MusicPlayerBuilder {
    audio_context: AudioContext,
    audio_element: HtmlAudioElement,
    gain: GainNode,
    track: MediaElementAudioSourceNode,
    volume: f32,
    prev_node: Option<AudioNode>,
    is_gain_connected: bool,
}

impl MusicPlayerBuilder {
    pub fn new(audio_element: HtmlAudioElement) -> Result<MusicPlayerBuilder, JsValue> {
        if audio_element.is_undefined() {
            return Err("Audio Element is undefined".into());
        }
        let audio_context = AudioContext::new()?;
        let track = audio_context.create_media_element_source(&audio_element)?;
        let gain = audio_context.create_gain()?;
        Ok(MusicPlayerBuilder {
            audio_context,
            audio_element,
            gain,
            track,
            volume: 1.,
            prev_node: None,
            is_gain_connected: false,
        })
    }

    pub fn add_analyzer(mut self) -> Result<MusicPlayerBuilder, JsValue> {
        let analyzer = self.audio_context.create_analyser()?;
        if let Some(node) = &self.prev_node {
            node.connect_with_audio_node(&analyzer)?;
        } else {
            self.track.connect_with_audio_node(&analyzer)?;
        }
        self.prev_node = Some(analyzer.into());
        Ok(self)
    }

    pub fn add_custom_node(mut self, node: AudioNode) -> Result<MusicPlayerBuilder, JsValue> {
        match &self.prev_node {
            Some(n) => n.connect_with_audio_node(&node)?,
            None => self.track.connect_with_audio_node(&node)?,
        };
        self.prev_node = Some(node);
        Ok(self)
    }

    pub fn build(self) -> Result<MusicPlayer, JsValue> {
        if !self.is_gain_connected {
            match &self.prev_node {
                None => {
                    self.track.connect_with_audio_node(self.gain.as_ref())?;
                }
                Some(node) => {
                    node.connect_with_audio_node(self.gain.as_ref())?;
                }
            };
        }
        if let Some(node) = &self.prev_node {
            node.connect_with_audio_node(self.audio_context.destination().as_ref())?;
        }
        Ok(MusicPlayer {
            audio_context: self.audio_context,
            gain: self.gain,
            volume: Mutable::new(self.volume),
            audio_element: self.audio_element,
            volume_cache: 0.,
            current_song_duration: Mutable::new(0.),
            is_playing: Mutable::new(false),
            time: Mutable::new(0.),
            current_song_path: None,
        })
    }
}

pub struct MusicPlayer {
    pub current_song_duration: Mutable<f64>,
    pub is_playing: Mutable<bool>,
    pub time: Mutable<f32>,
    pub audio_context: AudioContext,
    pub audio_element: HtmlAudioElement,
    pub gain: GainNode,
    pub volume: Mutable<f32>,
    current_song_path: Option<String>,
    volume_cache: f32,
}

impl MusicPlayer {
    pub fn mute_toggle(&mut self) {
        if self.gain.gain().value() == 0. {
            self.unmute();
        } else {
            self.mute()
        }
    }

    pub fn mute(&mut self) {
        self.volume_cache = self.gain.gain().value();
        /* Gentler mute, doesn't pop
        gain.gain.linearRampToValueAtTime(
            0,
            audio_context.currentTime + 0.1
        );*/
        self.volume.set(0.);
        self.gain.gain().set_value(0.);
    }

    pub fn unmute(&mut self) {
        self.volume.set(self.volume_cache);
        self.gain.gain().set_value(self.volume_cache);
    }

    pub fn change_volume(&mut self, volume: f32) {
        self.volume.set(volume);
        self.gain.gain().set_value(volume);
    }

    pub async fn seek(&mut self, new_time: f64) -> Result<(), ()> {
        if self.audio_context.state() != AudioContextState::Running {
            self.is_playing.set(false);
        }
        self.audio_element.set_current_time(new_time);
        Ok(())
    }

    pub async fn play_toggle(&mut self) -> Result<(), ()> {
        if self.audio_context.state() != AudioContextState::Running {
            JsFuture::from(self.audio_context.resume().unwrap())
                .await
                .unwrap();
        }
        if self.audio_element.paused() {
            // try {
            JsFuture::from(self.audio_element.play().unwrap())
                .await
                .unwrap();
            self.is_playing.set(true);
            // } catch (e) {
            self.is_playing.set(false);
        // 	throw e
        // }
        } else {
            self.audio_element.pause().unwrap();
            self.is_playing.set(false);
        }
        Ok(())
    }

    pub async fn play(&mut self) -> Result<&mut Self, JsValue> {
        if self.is_playing.get() {
            return Ok(self);
        }
        if self.audio_context.state() != AudioContextState::Running {
            JsFuture::from(self.audio_context.resume()?).await?;
        }
        if self.audio_element.paused() {
            // try {
            JsFuture::from(self.audio_element.play()?).await?;
            self.is_playing.set(true);
            // } catch (e) {
            self.is_playing.set(false);
            // throw e
            // }
        }
        Ok(self)
    }

    pub fn pause(&mut self) -> Result<&mut Self, JsValue> {
        self.audio_element.pause()?;
        self.is_playing.set(false);
        Ok(self)
    }

    pub async fn new_song(&mut self, path: String) -> Result<&mut Self, JsValue> {
        if self.audio_context.state() != AudioContextState::Running {
            JsFuture::from(self.audio_context.resume()?).await?;
        }
        self.audio_element.set_src(&path);
        Ok(self)
        /*
        let good_abort_controller = AbortController::new()?;
        let bad_abort_controller = AbortController::new()?;

        let can_play_through: Box<dyn FnMut(_)> = Box::new(move |_: web_sys::Event| {
            good_abort_controller.abort();
        });
        let can_play_through_cb = Closure::wrap(can_play_through);

        let bad_event: Box<dyn FnMut(_)> = Box::new(move |_: web_sys::Event| {
            bad_abort_controller.abort();
        });
        let bad_event_cb = Closure::wrap(bad_event);

        self.audio_element.add_event_listener_with_callback(
            "canplaythrough",
            can_play_through_cb.as_ref().unchecked_ref(),
        )?;

        self.audio_element
            .add_event_listener_with_callback("error", abort_cb.as_ref().unchecked_ref())?;

        self.audio_element.remove_event_listener_with_callback(
            "canplaythrough",
            abort_cb.as_ref().unchecked_ref(),
        )?;
        self.audio_element
            .remove_event_listener_with_callback("error", abort_cb.as_ref().unchecked_ref())?;
        self.audio_element
            .remove_event_listener_with_callback("stalled", abort_cb.as_ref().unchecked_ref())?;
        */
    }

    // /**
    //  * Will parse the duration of the song to make it easy to display in UI
    //  * If somethings undefined it returns "0:00"
    //  */
    // pub fn get_formatted_duration() {
    // 	let dur = self.audio_element.duration;
    // 	self.current_song_duration = self.audio_element.duration;
    //
    // 	if (dur == 0 || !dur) return "0:00";
    //
    // 	// ~ is Bitwise NOT, equivalent to Math.floor()
    // 	let hrs = ~~(dur / 3600)
    // 	let mins = ~~((dur % 3600) / 60)
    // 	let secs = ~~dur % 60
    //
    // 	let ret = ""
    // 	if (hrs > 0) {
    // 		ret += "" + hrs + ":" + (mins < 10 ? "0" : "")
    // 	}
    //
    // 	ret += "" + mins + ":" + (secs < 10 ? "0" : "")
    // 	ret += "" + secs
    // 	return ret
    // }
    // /**
    //  * Will parse the current time of the song to make it easy to display in UI
    //  * If somethings undefined it returns "0:00"
    //  */
    fn get_formatted_current_time(time: f64) -> String {
        if time == 0. {
            return "0:00".to_owned();
        }
        let hrs = f64::floor(time / 3600.);
        let mins = f64::floor((time % 3600.) / 60.);
        let secs = time / 60.;
        let mut res = "".to_owned();
        if hrs > 0. {
            res = hrs.to_string()
                + ":"
                + match mins < 10. {
                    true => "0",
                    false => "",
                };
        }
        res = res
            + &mins.to_string()
            + ":"
            + match secs < 10. {
                true => "0",
                false => "",
            };
        res = res + &secs.to_string();
        res
    }
}
