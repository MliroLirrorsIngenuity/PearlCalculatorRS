use crate::app_state::{AppStateAction, AppStateSnapshot};
use std::sync::Mutex;
use tauri::State;

pub type AppStateStore = Mutex<AppStateSnapshot>;

#[tauri::command]
pub fn get_app_state(state: State<'_, AppStateStore>) -> Result<AppStateSnapshot, String> {
    let snapshot = state.lock().map_err(|error| error.to_string())?;
    Ok(snapshot.clone())
}

#[tauri::command]
pub fn dispatch_app_state_action(
    action: AppStateAction,
    state: State<'_, AppStateStore>,
) -> Result<AppStateSnapshot, String> {
    let mut snapshot = state.lock().map_err(|error| error.to_string())?;
    snapshot.apply(action);
    Ok(snapshot.clone())
}
