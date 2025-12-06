mod commands;

use commands::{
    calculate_pearl_trace_command, calculate_raw_trace_command, calculate_tnt_amount_command,
    load_config, load_config_from_content, verify_config,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            verify_config,
            load_config,
            load_config_from_content,
            calculate_tnt_amount_command,
            calculate_pearl_trace_command,
            calculate_raw_trace_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
