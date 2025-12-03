use pearl_calculator_core::settings::types::AppSettings;
use std::path::Path;

#[tauri::command]
pub fn verify_config(path: String) -> Result<String, String> {
    let path = Path::new(&path);
    match AppSettings::load(path) {
        Ok(_) => Ok("Config is valid".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn load_config(path: String) -> Result<serde_json::Value, String> {
    let path = Path::new(&path);
    match AppSettings::load(path) {
        Ok(settings) => {
            if settings.cannon_settings.is_empty() {
                return Err("No cannon configurations found in the file".to_string());
            }

            let cannon = &settings.cannon_settings[0];

            match serde_json::to_value(cannon) {
                Ok(json) => Ok(json),
                Err(e) => Err(format!("Failed to serialize configuration: {}", e)),
            }
        }
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn load_config_from_content(content: String) -> Result<serde_json::Value, String> {
    match serde_json::from_str::<AppSettings>(&content) {
        Ok(settings) => {
            if settings.cannon_settings.is_empty() {
                return Err("No cannon configurations found in the file".to_string());
            }

            let cannon = &settings.cannon_settings[0];

            match serde_json::to_value(cannon) {
                Ok(json) => Ok(json),
                Err(e) => Err(format!("Failed to serialize configuration: {}", e)),
            }
        }
        Err(e) => Err(format!("Failed to parse configuration: {}", e)),
    }
}
