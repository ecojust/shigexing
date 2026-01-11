use std::fs;
use std::path::Path;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn write_file(path: String, content: String) -> Result<String, String> {
    match fs::write(Path::new(&path), content) {
        Ok(_) => Ok("File written successfully".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    match fs::read_to_string(Path::new(&path)) {
        Ok(content) => Ok(content),
        Err(e) => Err(e.to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![greet, write_file, read_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
