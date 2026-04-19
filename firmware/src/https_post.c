#include <stdio.h>
#include "esp_log.h"
#include "esp_http_client.h"
#include "esp_crt_bundle.h"
#include "https_post.h"
#include "config.h"

static const char *TAG = "https_post";

static esp_err_t http_event_handler(esp_http_client_event_t *evt)
{
    if (evt->event_id == HTTP_EVENT_ERROR) {
        ESP_LOGW(TAG, "http error");
    }
    return ESP_OK;
}

esp_err_t https_post_reading(const sensor_reading_t *r)
{
    if (g_config.worker_url[0] == '\0') {
        ESP_LOGW(TAG, "worker_url not configured, skipping post");
        return ESP_ERR_INVALID_STATE;
    }

    char body[512];
    int len = snprintf(body, sizeof(body),
        "{"
        "\"device_id\":\"%s\","
        "\"timestamp\":%ld,"
        "\"iaq\":%.1f,"
        "\"iaq_accuracy\":%d,"
        "\"temperature\":%.2f,"
        "\"humidity\":%.2f,"
        "\"pressure\":%.2f,"
        "\"co2_eq\":%.1f,"
        "\"voc_eq\":%.3f,"
        "\"pm1\":%.1f,"
        "\"pm2_5\":%.1f,"
        "\"pm10\":%.1f"
        "}",
        g_config.device_id,
        r->timestamp,
        r->iaq, r->iaq_accuracy,
        r->temperature, r->humidity, r->pressure,
        r->co2_eq, r->voc_eq,
        r->pm1, r->pm2_5, r->pm10);

    if (len >= (int)sizeof(body)) {
        ESP_LOGE(TAG, "body truncated");
        return ESP_ERR_INVALID_SIZE;
    }

    char auth_header[CONFIG_STR_MAX + 8];
    snprintf(auth_header, sizeof(auth_header), "Bearer %s", g_config.api_key);

    esp_http_client_config_t cfg = {
        .url               = g_config.worker_url,
        .crt_bundle_attach = esp_crt_bundle_attach,
        .event_handler     = http_event_handler,
        .method            = HTTP_METHOD_POST,
        .timeout_ms        = 10000,
    };

    esp_http_client_handle_t client = esp_http_client_init(&cfg);
    esp_http_client_set_header(client, "Content-Type", "application/json");
    esp_http_client_set_header(client, "Authorization", auth_header);
    esp_http_client_set_post_field(client, body, len);

    esp_err_t err = esp_http_client_perform(client);
    if (err == ESP_OK) {
        int status = esp_http_client_get_status_code(client);
        if (status != 200 && status != 201) {
            ESP_LOGW(TAG, "worker returned HTTP %d", status);
            err = ESP_FAIL;
        } else {
            ESP_LOGI(TAG, "posted ok (HTTP %d)", status);
        }
    } else {
        ESP_LOGE(TAG, "post failed: %s", esp_err_to_name(err));
    }

    esp_http_client_cleanup(client);
    return err;
}
