#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "esp_sntp.h"
#include "time.h"

#include "config.h"
#include "wifi.h"
#include "bme690.h"
#include "bmv080_sensor.h"
#include "https_post.h"

static const char *TAG = "main";

static void sntp_init_and_sync(void)
{
    esp_sntp_setoperatingmode(SNTP_OPMODE_POLL);
    esp_sntp_setservername(0, "pool.ntp.org");
    esp_sntp_init();

    time_t now = 0;
    struct tm timeinfo = {0};
    int retries = 0;
    while (timeinfo.tm_year < (2020 - 1900) && retries++ < 20) {
        ESP_LOGI(TAG, "waiting for NTP sync...");
        vTaskDelay(pdMS_TO_TICKS(2000));
        time(&now);
        localtime_r(&now, &timeinfo);
    }
    ESP_LOGI(TAG, "time synced");
}

static void reporter_task(void *arg)
{
    while (1) {
        vTaskDelay(pdMS_TO_TICKS(CONFIG_REPORT_INTERVAL_S * 1000));

        sensor_reading_t reading = {0};
        bme690_get_latest(&reading);
        bmv080_get_latest(&reading);
        reading.timestamp = (long)time(NULL);

        ESP_LOGI(TAG, "IAQ=%.1f(%d) T=%.1f H=%.1f P=%.1f PM1=%.1f PM2.5=%.1f PM10=%.1f",
            reading.iaq, reading.iaq_accuracy,
            reading.temperature, reading.humidity, reading.pressure,
            reading.pm1, reading.pm2_5, reading.pm10);

        https_post_reading(&reading);
    }
}

void app_main(void)
{
    ESP_LOGI(TAG, "Polverine firmware booting");

    config_init();
    ESP_LOGI(TAG, "config init complete");

    bool wifi_ready = wifi_init();
    ESP_LOGI(TAG, "wifi init complete: %s", wifi_ready ? "connected" : "offline");
    if (wifi_ready) {
        sntp_init_and_sync();
    } else {
        ESP_LOGW(TAG, "skipping SNTP sync because Wi-Fi is unavailable");
    }

    bool bme_ready = bme690_init();
    ESP_LOGI(TAG, "BME690 init %s", bme_ready ? "ok" : "failed");

    bool bmv_ready = bmv080_sensor_init();
    ESP_LOGI(TAG, "BMV080 init %s", bmv_ready ? "ok" : "failed");
    if (bmv_ready) {
        bmv080_start_task();
    }

    if (bme_ready) {
        bme690_start_task();
    }

    BaseType_t ok = xTaskCreate(reporter_task, "reporter", 8192, NULL, 4, NULL);
    if (ok != pdPASS) {
        ESP_LOGE(TAG, "failed to create reporter task");
        return;
    }

    ESP_LOGI(TAG, "startup complete");
}
