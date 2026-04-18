#include <string.h>
#include "esp_log.h"
#include "nvs_flash.h"
#include "nvs.h"
#include "config.h"

static const char *TAG = "config";

app_config_t g_config = {0};

static void load_str(nvs_handle_t h, const char *key, char *dst, size_t dst_len, const char *fallback)
{
    size_t len = dst_len;
    esp_err_t err = nvs_get_str(h, key, dst, &len);
    if (err != ESP_OK || len <= 1) {
        strncpy(dst, fallback, dst_len - 1);
        dst[dst_len - 1] = '\0';
        ESP_LOGW(TAG, "%s not set, using default", key);
    }
}

void config_init(void)
{
    esp_err_t err = nvs_flash_init();
    if (err == ESP_ERR_NVS_NO_FREE_PAGES || err == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        err = nvs_flash_init();
    }
    ESP_ERROR_CHECK(err);

    nvs_handle_t h;
    err = nvs_open(CONFIG_NVS_NAMESPACE, NVS_READONLY, &h);
    if (err != ESP_OK) {
        ESP_LOGW(TAG, "NVS namespace not found, all defaults will be used");
        strncpy(g_config.device_id, CONFIG_DEFAULT_DEVICE_ID, CONFIG_STR_MAX - 1);
        strncpy(g_config.worker_url, CONFIG_DEFAULT_WORKER_URL, CONFIG_STR_MAX - 1);
        strncpy(g_config.api_key, CONFIG_DEFAULT_API_KEY, CONFIG_STR_MAX - 1);
        return;
    }

    load_str(h, "wifi_ssid",   g_config.wifi_ssid,   sizeof(g_config.wifi_ssid),   "");
    load_str(h, "wifi_pwd",    g_config.wifi_pwd,     sizeof(g_config.wifi_pwd),     "");
    load_str(h, "worker_url",  g_config.worker_url,   sizeof(g_config.worker_url),   CONFIG_DEFAULT_WORKER_URL);
    load_str(h, "api_key",     g_config.api_key,      sizeof(g_config.api_key),      CONFIG_DEFAULT_API_KEY);
    load_str(h, "device_id",   g_config.device_id,    sizeof(g_config.device_id),    CONFIG_DEFAULT_DEVICE_ID);

    nvs_close(h);
    ESP_LOGI(TAG, "config loaded: device_id=%s", g_config.device_id);
}
