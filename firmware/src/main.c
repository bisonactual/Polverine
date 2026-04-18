#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "esp_sntp.h"
#include "time.h"

#include "config.h"
#include "wifi.h"
#include "bme690.h"
#include "bmv080.h"
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

        ESP_LOGI(TAG, "IAQ=%.1f(%d) T=%.1f H=%.1f P=%.1f PM2.5=%.1f",
            reading.iaq, reading.iaq_accuracy,
            reading.temperature, reading.humidity, reading.pressure,
            reading.pm2_5);

        https_post_reading(&reading);
    }
}

void app_main(void)
{
    config_init();
    wifi_init();
    sntp_init_and_sync();

    bme690_init();
    bme690_start_task();

    bmv080_sensor_init();
    bmv080_start_task();

    xTaskCreate(reporter_task, "reporter", 8192, NULL, 4, NULL);
}
