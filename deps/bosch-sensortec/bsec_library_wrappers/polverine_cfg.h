#pragma once

// Board variant index into temp_profile_tab (0 = first Polverine variant)
#define PLVN_CFG_TEMP_PROFILE_CLIENT_ID     0

// Must match the duty_cycling_period set for BMV080 (see bmv080.c)
#define PLVN_CFG_BMV080_DUTY_CYCLE_PERIOD_S 30

// Minimum FreeRTOS yield inside the BSEC loop
#define PLVN_CFG_BSEC_LOOP_DELAY_TIME_MS    pdMS_TO_TICKS(1)
