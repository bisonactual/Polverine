#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/semphr.h"
#include "driver/i2c_master.h"
#include "esp_log.h"
#include "esp_timer.h"

#include "bme69x.h"
#include "bsec_integration.h"
#include "board.h"
#include "bme690.h"

static const char *TAG = "bme690";

static SemaphoreHandle_t       s_data_mutex;
static sensor_reading_t        s_latest = {0};
static uint8_t                 s_bsec_mem[BSEC_INSTANCE_SIZE];
static i2c_master_bus_handle_t s_bus_handle;
static i2c_master_dev_handle_t s_dev_handle;

// ---------------------------------------------------------------------------
// I2C platform callbacks for bme69x (ESP-IDF 5.x i2c_master API)
// ---------------------------------------------------------------------------

static BME69X_INTF_RET_TYPE i2c_read(uint8_t reg, uint8_t *data, uint32_t len, void *intf_ptr)
{
    esp_err_t err = i2c_master_transmit_receive(s_dev_handle, &reg, 1, data, len, -1);
    return (err == ESP_OK) ? 0 : -1;
}

static BME69X_INTF_RET_TYPE i2c_write(uint8_t reg, const uint8_t *data, uint32_t len, void *intf_ptr)
{
    i2c_cmd_handle_t cmd = i2c_cmd_link_create();
    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, (BME690_I2C_ADDR << 1) | I2C_MASTER_WRITE, true);
    i2c_master_write_byte(cmd, reg, true);
    i2c_master_write(cmd, data, len, true);
    i2c_master_stop(cmd);
    uint8_t buf[len + 1];
    buf[0] = reg;
    memcpy(&buf[1], data, len);
    esp_err_t err = i2c_master_transmit(s_dev_handle, buf, len + 1, -1);
    return (err == ESP_OK) ? 0 : -1;
}

static void bme_delay_us(uint32_t us, void *intf_ptr)
{
    if (us > 1000) {
        vTaskDelay(pdMS_TO_TICKS(us / 1000));
    } else {
        esp_rom_delay_us(us);
    }
}

// ---------------------------------------------------------------------------
// BSEC platform callbacks
// ---------------------------------------------------------------------------

static void bme69x_interface_init(struct bme69x_dev *bme, uint8_t intf, uint8_t sen_no)
{
    (void)intf;
    (void)sen_no;
    bme->read    = i2c_read;
    bme->write   = i2c_write;
    bme->delay_us = bme_delay_us;
    bme->intf    = BME69X_I2C_INTF;
    bme->intf_ptr = NULL;
    bme->amb_temp = 25;
}

static uint32_t get_timestamp_ms(void)
{
    return (uint32_t)(esp_timer_get_time() / 1000ULL);
}

#define BSEC_STATE_NVS_KEY "bsec_state"

static uint32_t bsec_state_load(uint8_t *buf, uint32_t n)
{
    // TODO: load BSEC state from NVS 'bsec' partition for calibration persistence
    (void)buf; (void)n;
    return 0;
}

static void bsec_state_save(const uint8_t *buf, uint32_t len)
{
    // TODO: save BSEC state to NVS 'bsec' partition
    (void)buf; (void)len;
}

static uint32_t bsec_config_load(uint8_t *buf, uint32_t n)
{
    // bsec_iaq.c (included via build_src_filter) provides bsec_config_iaq[]
    extern const uint8_t bsec_config_iaq[];
    extern const uint32_t bsec_config_iaq_len;
    uint32_t copy = (bsec_config_iaq_len < n) ? bsec_config_iaq_len : n;
    memcpy(buf, bsec_config_iaq, copy);
    return copy;
}

static void output_ready(outputs_t *out)
{
    xSemaphoreTake(s_data_mutex, portMAX_DELAY);
    s_latest.temperature  = out->compensated_temperature;
    s_latest.humidity     = out->compensated_humidity;
    s_latest.pressure     = out->raw_pressure / 100.0f;  // Pa -> hPa
    s_latest.iaq          = out->iaq;
    s_latest.iaq_accuracy = out->iaq_accuracy;
    s_latest.co2_eq       = out->co2_equivalent;
    s_latest.voc_eq       = out->breath_voc_equivalent;
    xSemaphoreGive(s_data_mutex);
}

static void bsec_task(void *arg)
{
    allocate_memory(s_bsec_mem, 0);

    return_values_init ret = bsec_iot_init(SAMPLE_RATE, bme69x_interface_init, bsec_state_load, bsec_config_load);
    if (ret.bme69x_status != 0 || ret.bsec_status != 0) {
        ESP_LOGE(TAG, "bsec_iot_init failed: bme=%d bsec=%d", ret.bme69x_status, ret.bsec_status);
        vTaskDelete(NULL);
    }

    ESP_LOGI(TAG, "BSEC running");
    bsec_iot_loop(bsec_state_save, get_timestamp_ms, output_ready);

    // bsec_iot_loop is endless; if it returns something went wrong
    ESP_LOGE(TAG, "bsec_iot_loop exited");
    vTaskDelete(NULL);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

void bme690_init(void)
{
    i2c_master_bus_config_t bus_cfg = {
        .clk_source        = I2C_CLK_SRC_DEFAULT,
        .i2c_port          = -1,
        .scl_io_num        = BME690_PIN_SCL,
        .sda_io_num        = BME690_PIN_SDA,
        .glitch_ignore_cnt = 7,
        .flags.enable_internal_pullup = true,
    };
    ESP_ERROR_CHECK(i2c_new_master_bus(&bus_cfg, &s_bus_handle));

    i2c_device_config_t dev_cfg = {
        .dev_addr_length = I2C_ADDR_BIT_LEN_7,
        .device_address  = BME690_I2C_ADDR,
        .scl_speed_hz    = BME690_I2C_FREQ_HZ,
    };
    ESP_ERROR_CHECK(i2c_master_bus_add_device(s_bus_handle, &dev_cfg, &s_dev_handle));

    s_data_mutex = xSemaphoreCreateMutex();
}

void bme690_start_task(void)
{
    xTaskCreate(bsec_task, "bsec", 8192, NULL, 5, NULL);
}

void bme690_get_latest(sensor_reading_t *out)
{
    xSemaphoreTake(s_data_mutex, portMAX_DELAY);
    out->temperature  = s_latest.temperature;
    out->humidity     = s_latest.humidity;
    out->pressure     = s_latest.pressure;
    out->iaq          = s_latest.iaq;
    out->iaq_accuracy = s_latest.iaq_accuracy;
    out->co2_eq       = s_latest.co2_eq;
    out->voc_eq       = s_latest.voc_eq;
    xSemaphoreGive(s_data_mutex);
}
