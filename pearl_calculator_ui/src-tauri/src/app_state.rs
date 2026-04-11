use pearl_calculator_bridge::outputs::{PearlTraceOutput, TNTResultOutput};
use pearl_calculator_utils::{
    BitInputState, BitTemplateConfig, CalculatorInputs, CannonCenter, CannonMode, GeneralConfig,
    MultiplierBitInputState, MultiplierConfig, PearlMomentum, PearlVersion, SimulatorConfig,
    TntDirection, config_to_input_state, config_to_multiplier_input_state, convert_config_to_draft,
    convert_draft_to_config, input_state_to_config, input_state_to_multiplier_config,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppStateSnapshot {
    pub config: ConfigStoreState,
    pub configuration: ConfigurationStoreState,
    pub calculator: CalculatorStoreState,
}

impl Default for AppStateSnapshot {
    fn default() -> Self {
        Self {
            config: ConfigStoreState::default(),
            configuration: ConfigurationStoreState::default(),
            calculator: CalculatorStoreState::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigStoreState {
    pub has_config: bool,
    pub version: PearlVersion,
    pub config_data: GeneralConfig,
    pub config_path: String,
    pub bit_template_config: Option<BitTemplateConfig>,
    pub multiplier_config: Option<MultiplierConfig>,
}

impl Default for ConfigStoreState {
    fn default() -> Self {
        Self {
            has_config: false,
            version: PearlVersion::default(),
            config_data: GeneralConfig::default(),
            config_path: String::new(),
            bit_template_config: None,
            multiplier_config: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigurationStoreState {
    pub draft_config: pearl_calculator_utils::DraftConfig,
    pub cannon_center: CannonCenter,
    pub pearl_momentum: PearlMomentum,
    pub red_tnt_location: Option<TntDirection>,
    pub bit_template_state: Option<BitInputState>,
    pub is_wizard_active: bool,
    pub is_finished: bool,
    pub is_bit_config_skipped: bool,
    pub saved_path: Option<String>,
    pub calculation_mode: CannonMode,
    pub wizard_mode: CannonMode,
    pub multiplier_bit_state: Option<MultiplierBitInputState>,
    pub is_multiplier_config_skipped: bool,
}

impl Default for ConfigurationStoreState {
    fn default() -> Self {
        Self {
            draft_config: pearl_calculator_utils::DraftConfig::default(),
            cannon_center: CannonCenter::default(),
            pearl_momentum: PearlMomentum::default(),
            red_tnt_location: None,
            bit_template_state: None,
            is_wizard_active: false,
            is_finished: false,
            is_bit_config_skipped: false,
            saved_path: None,
            calculation_mode: CannonMode::Standard,
            wizard_mode: CannonMode::Standard,
            multiplier_bit_state: None,
            is_multiplier_config_skipped: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalculatorStoreState {
    pub default_calculator: DefaultCalculatorState,
    pub simulator: SimulatorState,
}

impl Default for CalculatorStoreState {
    fn default() -> Self {
        Self {
            default_calculator: DefaultCalculatorState::default(),
            simulator: SimulatorState::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DefaultCalculatorState {
    pub inputs: CalculatorInputs,
    pub results: Vec<TNTResultOutput>,
    pub trace: CalculatorTraceState,
}

impl Default for DefaultCalculatorState {
    fn default() -> Self {
        Self {
            inputs: CalculatorInputs::default(),
            results: Vec::new(),
            trace: CalculatorTraceState::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalculatorTraceState {
    pub data: Option<PearlTraceOutput>,
    pub direction: String,
    pub tnt: Option<TraceTntState>,
    pub show: bool,
    pub bit_calculation: BitCalculationUiState,
}

impl Default for CalculatorTraceState {
    fn default() -> Self {
        Self {
            data: None,
            direction: String::new(),
            tnt: None,
            show: false,
            bit_calculation: BitCalculationUiState::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct BitCalculationUiState {
    pub show: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SimulatorState {
    pub inputs: CalculatorInputs,
    pub config: SimulatorConfig,
    pub trace: SimulatorTraceState,
}

impl Default for SimulatorState {
    fn default() -> Self {
        Self {
            inputs: CalculatorInputs::default(),
            config: SimulatorConfig::default(),
            trace: SimulatorTraceState::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SimulatorTraceState {
    pub data: Option<PearlTraceOutput>,
    pub direction: String,
    pub tnt: Option<TraceTntState>,
    pub show: bool,
}

impl Default for SimulatorTraceState {
    fn default() -> Self {
        Self {
            data: None,
            direction: String::new(),
            tnt: None,
            show: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TraceTntState {
    pub blue: u32,
    pub red: u32,
    pub total: u32,
    #[serde(default)]
    pub vertical: Option<u32>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    tag = "type"
)]
pub enum AppStateAction {
    SetHasConfig {
        value: bool,
    },
    SetVersion {
        version: PearlVersion,
    },
    SetConfigData {
        data: GeneralConfig,
    },
    SetConfigPath {
        path: String,
    },
    SetBitTemplateConfig {
        data: Option<BitTemplateConfig>,
    },
    SetMultiplierConfig {
        data: Option<MultiplierConfig>,
    },
    ResetConfig,

    SetDraftConfig {
        config: pearl_calculator_utils::DraftConfig,
    },
    SetCannonCenter {
        center: CannonCenter,
    },
    SetPearlMomentum {
        momentum: PearlMomentum,
    },
    SetRedTntLocation {
        location: Option<TntDirection>,
    },
    SetBitTemplateState {
        state: Option<BitInputState>,
    },
    SetIsWizardActive {
        active: bool,
    },
    SetIsFinished {
        finished: bool,
    },
    SetIsBitConfigSkipped {
        skipped: bool,
    },
    SetSavedPath {
        path: Option<String>,
    },
    SetCalculationMode {
        mode: CannonMode,
    },
    SetWizardMode {
        mode: CannonMode,
    },
    SetMultiplierBitState {
        state: Option<MultiplierBitInputState>,
    },
    SetIsMultiplierConfigSkipped {
        skipped: bool,
    },
    ResetDraft,

    UpdateDefaultInput {
        field: CalculatorInputField,
        value: Value,
    },
    SetDefaultResults {
        results: Vec<TNTResultOutput>,
    },
    UpdateDefaultTrace {
        patch: DefaultTracePatch,
    },
    UpdateBitCalculation {
        show: bool,
    },
    ResetDefaultCalculator,

    SetSimulatorConfig {
        config: SimulatorConfig,
    },
    UpdateSimulatorTrace {
        patch: SimulatorTracePatchPatch,
    },
    ResetSimulatorConfig,

    ApplyConfigToCalculator {
        config: GeneralConfig,
        bit_template: Option<BitTemplateConfig>,
        multiplier_template: Option<MultiplierConfig>,
        path: String,
    },
    ApplyConfigToWizard {
        config: GeneralConfig,
        bit_template: Option<BitTemplateConfig>,
        multiplier_template: Option<MultiplierConfig>,
        path: Option<String>,
    },
    ApplyWizardToCalculator,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum CalculatorInputField {
    PearlX,
    PearlZ,
    DestX,
    DestY,
    PlaneInterceptY,
    DestZ,
    CannonY,
    OffsetX,
    OffsetZ,
    TickRange,
    DistanceRange,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct DefaultTracePatch {
    pub data: Option<PearlTraceOutput>,
    pub direction: Option<String>,
    pub tnt: Option<TraceTntState>,
    pub show: Option<bool>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SimulatorTracePatchPatch {
    pub data: Option<PearlTraceOutput>,
    pub direction: Option<String>,
    pub tnt: Option<TraceTntState>,
    pub show: Option<bool>,
}

impl AppStateSnapshot {
    pub fn apply(&mut self, action: AppStateAction) {
        match action {
            AppStateAction::SetHasConfig { value } => self.config.has_config = value,
            AppStateAction::SetVersion { version } => self.config.version = version,
            AppStateAction::SetConfigData { data } => self.config.config_data = data,
            AppStateAction::SetConfigPath { path } => self.config.config_path = path,
            AppStateAction::SetBitTemplateConfig { data } => self.config.bit_template_config = data,
            AppStateAction::SetMultiplierConfig { data } => self.config.multiplier_config = data,
            AppStateAction::ResetConfig => self.reset_config(),

            AppStateAction::SetDraftConfig { config } => self.configuration.draft_config = config,
            AppStateAction::SetCannonCenter { center } => self.configuration.cannon_center = center,
            AppStateAction::SetPearlMomentum { momentum } => {
                self.configuration.pearl_momentum = momentum
            }
            AppStateAction::SetRedTntLocation { location } => {
                self.configuration.red_tnt_location = location
            }
            AppStateAction::SetBitTemplateState { state } => {
                self.configuration.bit_template_state = state
            }
            AppStateAction::SetIsWizardActive { active } => {
                self.configuration.is_wizard_active = active
            }
            AppStateAction::SetIsFinished { finished } => self.configuration.is_finished = finished,
            AppStateAction::SetIsBitConfigSkipped { skipped } => {
                self.configuration.is_bit_config_skipped = skipped
            }
            AppStateAction::SetSavedPath { path } => self.configuration.saved_path = path,
            AppStateAction::SetCalculationMode { mode } => {
                self.configuration.calculation_mode = mode
            }
            AppStateAction::SetWizardMode { mode } => self.configuration.wizard_mode = mode,
            AppStateAction::SetMultiplierBitState { state } => {
                self.configuration.multiplier_bit_state = state
            }
            AppStateAction::SetIsMultiplierConfigSkipped { skipped } => {
                self.configuration.is_multiplier_config_skipped = skipped
            }
            AppStateAction::ResetDraft => self.reset_draft(),

            AppStateAction::UpdateDefaultInput { field, value } => apply_calculator_input_update(
                &mut self.calculator.default_calculator.inputs,
                field,
                value,
            ),
            AppStateAction::SetDefaultResults { results } => {
                self.calculator.default_calculator.results = results
            }
            AppStateAction::UpdateDefaultTrace { patch } => {
                if let Some(data) = patch.data {
                    self.calculator.default_calculator.trace.data = Some(data);
                }
                if let Some(direction) = patch.direction {
                    self.calculator.default_calculator.trace.direction = direction;
                }
                if let Some(tnt) = patch.tnt {
                    self.calculator.default_calculator.trace.tnt = Some(tnt);
                }
                if let Some(show) = patch.show {
                    self.calculator.default_calculator.trace.show = show;
                }
            }
            AppStateAction::UpdateBitCalculation { show } => {
                self.calculator
                    .default_calculator
                    .trace
                    .bit_calculation
                    .show = show
            }
            AppStateAction::ResetDefaultCalculator => self.reset_default_calculator(),

            AppStateAction::SetSimulatorConfig { config } => {
                self.calculator.simulator.config = config
            }
            AppStateAction::UpdateSimulatorTrace { patch } => {
                if let Some(data) = patch.data {
                    self.calculator.simulator.trace.data = Some(data);
                }
                if let Some(direction) = patch.direction {
                    self.calculator.simulator.trace.direction = direction;
                }
                if let Some(tnt) = patch.tnt {
                    self.calculator.simulator.trace.tnt = Some(tnt);
                }
                if let Some(show) = patch.show {
                    self.calculator.simulator.trace.show = show;
                }
            }
            AppStateAction::ResetSimulatorConfig => self.reset_simulator_config(),

            AppStateAction::ApplyConfigToCalculator {
                config,
                bit_template,
                multiplier_template,
                path,
            } => self.apply_config_to_calculator(config, bit_template, multiplier_template, path),
            AppStateAction::ApplyConfigToWizard {
                config,
                bit_template,
                multiplier_template,
                path,
            } => self.apply_config_to_wizard(config, bit_template, multiplier_template, path),
            AppStateAction::ApplyWizardToCalculator => self.apply_wizard_to_calculator(),
        }
    }

    fn reset_config(&mut self) {
        self.config = ConfigStoreState::default();
    }

    fn reset_draft(&mut self) {
        self.configuration = ConfigurationStoreState::default();
    }

    fn reset_default_calculator(&mut self) {
        self.calculator.default_calculator = DefaultCalculatorState {
            inputs: empty_calculator_inputs(),
            results: Vec::new(),
            trace: CalculatorTraceState::default(),
        };
    }

    fn reset_simulator_config(&mut self) {
        self.calculator.simulator.config = SimulatorConfig::default();
        self.calculator.simulator.trace = SimulatorTraceState::default();
    }

    fn apply_config_to_calculator(
        &mut self,
        config: GeneralConfig,
        bit_template: Option<BitTemplateConfig>,
        multiplier_template: Option<MultiplierConfig>,
        path: String,
    ) {
        self.config.config_data = config.clone();
        self.config.config_path = path;
        self.config.bit_template_config = bit_template;
        self.config.multiplier_config = multiplier_template;
        self.config.has_config = true;

        self.configuration.calculation_mode = config.mode.unwrap_or(CannonMode::Standard);

        let inputs = &mut self.calculator.default_calculator.inputs;
        inputs.pearl_x = config.pearl_x_position.to_string();
        inputs.pearl_z = config.pearl_z_position.to_string();
        inputs.cannon_y = config.pearl_y_position.floor().to_string();
        inputs.offset_x = config.offset_x.unwrap_or(0.0).to_string();
        inputs.offset_z = config.offset_z.unwrap_or(0.0).to_string();
    }

    fn apply_config_to_wizard(
        &mut self,
        config: GeneralConfig,
        bit_template: Option<BitTemplateConfig>,
        multiplier_template: Option<MultiplierConfig>,
        path: Option<String>,
    ) {
        let converted = convert_config_to_draft(&config);

        self.configuration.draft_config = converted.draft;
        self.configuration.cannon_center = converted.center;
        self.configuration.pearl_momentum = converted.momentum;
        self.configuration.red_tnt_location = converted.red_location;
        self.configuration.bit_template_state = config_to_input_state(bit_template.as_ref());
        self.configuration.saved_path = path;
        self.configuration.is_wizard_active = true;
        self.configuration.is_finished = false;
        self.configuration.is_bit_config_skipped = false;
        self.configuration.wizard_mode = config.mode.unwrap_or(CannonMode::Standard);
        self.configuration.multiplier_bit_state =
            config_to_multiplier_input_state(multiplier_template.as_ref());
        self.configuration.is_multiplier_config_skipped = false;
    }

    fn apply_wizard_to_calculator(&mut self) {
        let config = convert_draft_to_config(
            &self.configuration.draft_config,
            &self.configuration.cannon_center,
            self.configuration.red_tnt_location,
            Some(self.configuration.wizard_mode),
        );

        self.configuration.calculation_mode = self.configuration.wizard_mode;

        self.calculator.default_calculator.inputs.pearl_x = "0".to_string();
        self.calculator.default_calculator.inputs.pearl_z = "0".to_string();

        let cannon_x = parse_f64(&self.configuration.cannon_center.x);
        let cannon_z = parse_f64(&self.configuration.cannon_center.z);
        let pearl_x = parse_f64(&self.configuration.draft_config.pearl_x_position);
        let pearl_z = parse_f64(&self.configuration.draft_config.pearl_z_position);
        let pearl_y = parse_f64(&self.configuration.draft_config.pearl_y_position);

        self.calculator.default_calculator.inputs.offset_x = (pearl_x - cannon_x).to_string();
        self.calculator.default_calculator.inputs.offset_z = (pearl_z - cannon_z).to_string();
        self.calculator.default_calculator.inputs.cannon_y = pearl_y.floor().to_string();

        self.config.config_data = config;
        self.config.has_config = true;

        self.config.bit_template_config = self
            .configuration
            .bit_template_state
            .as_ref()
            .map(input_state_to_config);

        self.config.multiplier_config = self
            .configuration
            .multiplier_bit_state
            .as_ref()
            .map(input_state_to_multiplier_config);
    }
}

fn empty_calculator_inputs() -> CalculatorInputs {
    CalculatorInputs {
        cannon_y: "0".to_string(),
        ..CalculatorInputs::default()
    }
}

fn parse_f64(value: &str) -> f64 {
    value.parse::<f64>().unwrap_or(0.0)
}

fn apply_calculator_input_update(
    inputs: &mut CalculatorInputs,
    field: CalculatorInputField,
    value: Value,
) {
    match field {
        CalculatorInputField::PearlX => inputs.pearl_x = value_to_string(value),
        CalculatorInputField::PearlZ => inputs.pearl_z = value_to_string(value),
        CalculatorInputField::DestX => inputs.dest_x = value_to_string(value),
        CalculatorInputField::DestY => inputs.dest_y = Some(value_to_string(value)),
        CalculatorInputField::PlaneInterceptY => {
            inputs.plane_intercept_y = value.as_bool().unwrap_or(false)
        }
        CalculatorInputField::DestZ => inputs.dest_z = value_to_string(value),
        CalculatorInputField::CannonY => inputs.cannon_y = value_to_string(value),
        CalculatorInputField::OffsetX => inputs.offset_x = value_to_string(value),
        CalculatorInputField::OffsetZ => inputs.offset_z = value_to_string(value),
        CalculatorInputField::TickRange => {
            if let Some(range) = parse_range(&value) {
                inputs.tick_range = range;
            }
        }
        CalculatorInputField::DistanceRange => {
            if let Some(range) = parse_range(&value) {
                inputs.distance_range = range;
            }
        }
    }
}

fn value_to_string(value: Value) -> String {
    value
        .as_str()
        .map(str::to_string)
        .unwrap_or_else(|| value.to_string().trim_matches('"').to_string())
}

fn parse_range(value: &Value) -> Option<[u32; 2]> {
    let values = value.as_array()?;
    if values.len() != 2 {
        return None;
    }

    Some([values[0].as_u64()? as u32, values[1].as_u64()? as u32])
}
