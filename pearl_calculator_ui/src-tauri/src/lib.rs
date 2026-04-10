mod app_state;
mod commands;

use commands::{
    calculate_pearl_trace_command, calculate_raw_trace_command, calculate_tnt_amount_command,
    dispatch_app_state_action, get_app_state, load_config, load_config_from_content, verify_config,
};
use commands::state::AppStateStore;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppStateStore::new(app_state::AppStateSnapshot::default()))
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            get_app_state,
            dispatch_app_state_action,
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
