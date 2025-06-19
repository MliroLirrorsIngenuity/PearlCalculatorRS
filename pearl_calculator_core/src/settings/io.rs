use super::types::AppSettings;
use std::fs;
use std::path::Path;

impl AppSettings {
    pub fn load(path: &Path) -> Result<Self, Box<dyn std::error::Error>> {
        let content = fs::read_to_string(path)?;
        let settings = serde_json::from_str(&content)?;
        Ok(settings)
    }

    pub fn save(&self, path: &Path) -> Result<(), Box<dyn std::error::Error>> {
        let json_content = serde_json::to_string_pretty(self)?;
        fs::write(path, json_content)?;
        Ok(())
    }
}
