#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/semphr.h"
#include "esp_log.h"

#include "bmv080.h"
#include "bmv080_sensor.h"
#include "bmv080_io.h"

static const char *TAG = "bmv080";

static bmv080_handle_t s_handle = NULL;
static SemaphoreHandle_t s_mutex;

static struct {
    float pm1;
    float pm2_5;
    float pm10;
    bool valid;
    bool obstructed;
} s_latest = {0};

static void data_ready_cb(bmv080_output_t output, void *param)
{
    (void)param;

    xSemaphoreTake(s_mutex, portMAX_DELAY);
    s_latest.obstructed = output.is_obstructed;
    xSemaphoreGive(s_mutex);

    if (output.is_obstructed || output.is_outside_measurement_range) {
        return;
    }

    xSemaphoreTake(s_mutex, portMAX_DELAY);
    s_latest.pm1 = output.pm1_mass_concentration;
    s_latest.pm2_5 = output.pm2_5_mass_concentration;
    s_latest.pm10 = output.pm10_mass_concentration;
    s_latest.valid = true;
    xSemaphoreGive(s_mutex);
}

static void bmv080_task(void *arg)
{
    (void)arg;

    while (1) {
        bmv080_io_delay_ms(1000);
        bmv080_status_code_t rc = bmv080_serve_interrupt(s_handle, data_ready_cb, NULL);
        if (rc != E_BMV080_OK && rc != E_BMV080_WARNING_INVALID_REG_READ) {
            ESP_LOGW(TAG, "serve_interrupt: %d", (int)rc);
        }
    }
}

bool bmv080_sensor_init(void)
{
    bmv080_sercom_handle_t sercom = bmv080_io_init();
    if (sercom == NULL) {
        ESP_LOGE(TAG, "BMV080 I/O init failed");
        return false;
    }

    s_mutex = xSemaphoreCreateMutex();
    if (s_mutex == NULL) {
        ESP_LOGE(TAG, "failed to create BMV080 mutex");
        return false;
    }

    bmv080_status_code_t rc = bmv080_open(&s_handle, sercom,
        bmv080_io_read, bmv080_io_write, bmv080_io_delay_ms);
    if (rc != E_BMV080_OK) {
        ESP_LOGE(TAG, "bmv080_open failed: %d", (int)rc);
        return false;
    }

    rc = bmv080_reset(s_handle);
    if (rc != E_BMV080_OK) {
        ESP_LOGE(TAG, "bmv080_reset failed: %d", (int)rc);
        return false;
    }

    float integration_time = 10.0f;
    uint16_t duty_period = 30;
    rc = bmv080_set_parameter(s_handle, "integration_time", &integration_time);
    rc = bmv080_set_parameter(s_handle, "duty_cycling_period", &duty_period);

    rc = bmv080_start_duty_cycling_measurement(s_handle, bmv080_io_tick_ms,
        E_BMV080_DUTY_CYCLING_MODE_0);
    if (rc != E_BMV080_OK) {
        ESP_LOGE(TAG, "start measurement failed: %d", (int)rc);
        return false;
    }

    ESP_LOGI(TAG, "BMV080 running (integration: %ds, period: %ds)",
        (int)integration_time, duty_period);
    return true;
}

bool bmv080_start_task(void)
{
    if (s_handle == NULL || s_mutex == NULL) {
        ESP_LOGW(TAG, "BMV080 task not started because init did not complete");
        return false;
    }

    BaseType_t ok = xTaskCreate(bmv080_task, "bmv080", 60 * 1024, NULL, 5, NULL);
    if (ok != pdPASS) {
        ESP_LOGE(TAG, "failed to create BMV080 task");
        return false;
    }

    ESP_LOGI(TAG, "BMV080 polling task started");
    return true;
}

void bmv080_get_latest(sensor_reading_t *out)
{
    xSemaphoreTake(s_mutex, portMAX_DELAY);
    out->pm1 = s_latest.pm1;
    out->pm2_5 = s_latest.pm2_5;
    out->pm10 = s_latest.pm10;
    out->pm_valid = s_latest.valid;
    out->obstructed = s_latest.obstructed;
    xSemaphoreGive(s_mutex);
}
