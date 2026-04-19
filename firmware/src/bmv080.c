#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/semphr.h"
#include "driver/spi_master.h"
#include "esp_log.h"

#include "bmv080.h"         // Bosch SDK
#include "bmv080_sensor.h"  // our wrapper API
#include "bmv080_io.h"

static const char *TAG = "bmv080";

static bmv080_handle_t   s_handle = NULL;
static SemaphoreHandle_t s_mutex;

static struct {
    float pm1;
    float pm2_5;
    float pm10;
    bool  valid;
} s_latest = {0};

static void data_ready_cb(bmv080_output_t output, void *param)
{
    (void)param;
    if (output.is_obstructed || output.is_outside_measurement_range) {
        return;
    }
    xSemaphoreTake(s_mutex, portMAX_DELAY);
    s_latest.pm1   = output.pm1_mass_concentration;
    s_latest.pm2_5 = output.pm2_5_mass_concentration;
    s_latest.pm10  = output.pm10_mass_concentration;
    s_latest.valid = true;
    xSemaphoreGive(s_mutex);
}

static void bmv080_task(void *arg)
{
    while (1) {
        bmv080_status_code_t rc = bmv080_serve_interrupt(s_handle, data_ready_cb, NULL);
        if (rc != E_BMV080_OK && rc != E_BMV080_WARNING_INVALID_REG_READ) {
            ESP_LOGW(TAG, "serve_interrupt: %d", (int)rc);
        }
        vTaskDelay(pdMS_TO_TICKS(500));
    }
}

void bmv080_sensor_init(void)
{
    bmv080_sercom_handle_t sercom = bmv080_io_init();
    s_mutex = xSemaphoreCreateMutex();

    bmv080_status_code_t rc = bmv080_open(&s_handle, sercom,
        bmv080_io_read, bmv080_io_write, bmv080_io_delay_ms);
    if (rc != E_BMV080_OK) {
        ESP_LOGE(TAG, "bmv080_open failed: %d", (int)rc);
        return;
    }

    rc = bmv080_reset(s_handle);
    if (rc != E_BMV080_OK) {
        ESP_LOGE(TAG, "bmv080_reset failed: %d", (int)rc);
        return;
    }

    float integration_time = 10.0f;
    uint16_t duty_period   = 30;
    bmv080_set_parameter(s_handle, "integration_time",  &integration_time);
    bmv080_set_parameter(s_handle, "duty_cycling_period", &duty_period);

    rc = bmv080_start_duty_cycling_measurement(s_handle, bmv080_io_tick_ms,
        E_BMV080_DUTY_CYCLING_MODE_0);
    if (rc != E_BMV080_OK) {
        ESP_LOGE(TAG, "start measurement failed: %d", (int)rc);
        return;
    }

    ESP_LOGI(TAG, "BMV080 running (duty cycle: %ds on / %ds period)",
        (int)integration_time, duty_period);
}

void bmv080_start_task(void)
{
    xTaskCreate(bmv080_task, "bmv080", 4096, NULL, 5, NULL);
}

void bmv080_get_latest(sensor_reading_t *out)
{
    xSemaphoreTake(s_mutex, portMAX_DELAY);
    out->pm1      = s_latest.pm1;
    out->pm2_5    = s_latest.pm2_5;
    out->pm10     = s_latest.pm10;
    out->pm_valid = s_latest.valid;
    xSemaphoreGive(s_mutex);
}
