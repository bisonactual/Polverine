#pragma once

#define CONFIG_NVS_NAMESPACE    "polverine"
#define CONFIG_STR_MAX          256

#define CONFIG_DEFAULT_DEVICE_ID    "workshop-01"
#define CONFIG_DEFAULT_WORKER_URL   ""   // set via NVS: https://<worker>.workers.dev/ingest
#define CONFIG_DEFAULT_API_KEY      ""   // set via NVS

// Reporting interval in seconds
#define CONFIG_REPORT_INTERVAL_S    30

typedef struct {
    char wifi_ssid[CONFIG_STR_MAX];
    char wifi_pwd[CONFIG_STR_MAX];
    char worker_url[CONFIG_STR_MAX];
    char api_key[CONFIG_STR_MAX];
    char device_id[CONFIG_STR_MAX];
} app_config_t;

extern app_config_t g_config;

void config_init(void);
