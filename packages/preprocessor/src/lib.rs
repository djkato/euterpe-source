use std::{
    ffi::{c_char, CString},
    path::PathBuf,
};

use anyhow::{bail, Context};
use walkdir::WalkDir;

// Actually returns JSON but ye...
#[no_mangle]
pub extern "C" fn get_fft_data() -> *mut c_char {
    let files = crawl_and_analyze(PathBuf::from("../public/media"));
    let SVG::from("");
    return CString::new("Hello!").unwrap().into_raw();
}

struct File {
    pub svg: Option<SVG>,
    pub samples: Vec<i16>,
    pub path_buf: PathBuf,
}

struct Points {
    pub x: i16,
    pub y: i16,
}

struct ViewBox {
    pub h_0: i16,
    pub h_max: i16,
    pub w_0: i16,
    pub w_max: i16,
}
impl ViewBox {
    pub fn default() -> Self {
        ViewBox {
            h_0: 0,
            w_0: 0,
            h_max: 500,
            w_max: 500,
        }
    }
}

struct SVG {
    view_box: ViewBox,
    points: Points,
    path: Option<String>,
}

impl SVG {
    fn from(samples: Vec<i16>) -> Self {}
    fn mutate_points(&mut self) {}

    fn catmull_rom_smooth(&mut self) {}

    fn normalize(&mut self) {
        // Set lowest sample value to 0, max to 1 and make it linear  instead of logarythmic
    }
}

fn crawl_and_analyze(root: PathBuf) -> anyhow::Result<Vec<PathBuf>> {
    // Find all WAV files, return their paths
    let file_paths = crawl(root)?;
    let files = file_paths.into_iter().map(|p| File {
        samples: get_file_samples(p).unwrap(),
        svg: None,
        path_buf: p,
    });
    bail!("")
}

fn crawl(root: PathBuf) -> anyhow::Result<Vec<PathBuf>> {
    let mut file_paths = vec![];
    for path in WalkDir::new(root).max_depth(5) {
        if let Ok(path) = path {
            if path.file_type().is_file() {
                if let Some(ext) = path.path().extension() {
                    if ext == "wav" {
                        file_paths.push(path.path().to_path_buf());
                    }
                }
            }
        }
    }
    Ok(file_paths)
}

fn get_file_samples(path: PathBuf) -> anyhow::Result<Vec<i16>> {
    // Read wav file, return its samples
    bail!("")
}

/*
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}*/
