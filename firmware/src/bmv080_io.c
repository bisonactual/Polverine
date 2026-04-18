#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/spi_master.h"
#include "driver/gpio.h"
#include "esp_timer.h"
#include "esp_log.h"
#include "board.h"
#include "bmv080_io.h"

static const char *TAG = "bmv080_io";
static spi_device_handle_t s_spi = NULL;

void bmv080_io_init(void)
{
    spi_bus_config_t bus_cfg = {
        .mosi_io_num   = BMV080_PIN_MOSI,
        .miso_io_num   = BMV080_PIN_MISO,
        .sclk_io_num   = BMV080_PIN_CLK,
        .quadwp_io_num = -1,
        .quadhd_io_num = -1,
        .max_transfer_sz = 4096,
    };
    ESP_ERROR_CHECK(spi_bus_initialize(BMV080_SPI_HOST, &bus_cfg, SPI_DMA_CH_AUTO));

    spi_device_interface_config_t dev_cfg = {
        .address_bits   = 16,
        .clock_speed_hz = BMV080_SPI_FREQ_HZ,
        .mode           = 0,
        .spics_io_num   = BMV080_PIN_CS,
        .queue_size     = 1,
    };
    ESP_ERROR_CHECK(spi_bus_add_device(BMV080_SPI_HOST, &dev_cfg, &s_spi));
    ESP_LOGI(TAG, "SPI init ok");
}

// BMV080 uses 16-bit addressed SPI with big-endian payload
bmv080_status_code_t bmv080_io_read(bmv080_sercom_handle_t handle, uint8_t *data, uint16_t len)
{
    uint16_t header = *(uint16_t *)handle;
    uint16_t *payload = (uint16_t *)data;
    uint16_t payload_length = len / 2;

    spi_transaction_ext_t t = {
        .base = {
            .flags    = SPI_TRANS_VARIABLE_ADDR | SPI_TRANS_VARIABLE_CMD,
            .addr     = header,
            .length   = payload_length * 2 * 8,
            .rxlength = payload_length * 2 * 8,
            .rx_buffer = payload,
            .tx_buffer = NULL,
        },
        .command_bits = 0,
        .address_bits = 16,
        .dummy_bits   = 0,
    };

    esp_err_t err = spi_device_polling_transmit(s_spi, (spi_transaction_t *)&t);

    for (int i = 0; i < payload_length; i++) {
        payload[i] = (payload[i] << 8) | (payload[i] >> 8);
    }

    return (err == ESP_OK) ? E_BMV080_OK : E_BMV080_ERROR_HW_READ;
}

bmv080_status_code_t bmv080_io_write(bmv080_sercom_handle_t handle, const uint8_t *data, uint16_t len)
{
    uint16_t header = *(uint16_t *)handle;
    const uint16_t *payload = (const uint16_t *)data;
    uint16_t payload_length = len / 2;

    uint16_t *swapped = calloc(payload_length, sizeof(uint16_t));
    if (!swapped) return E_BMV080_ERROR_HW_WRITE;

    for (int i = 0; i < payload_length; i++) {
        swapped[i] = (payload[i] << 8) | (payload[i] >> 8);
    }

    spi_transaction_ext_t t = {
        .base = {
            .flags    = SPI_TRANS_VARIABLE_ADDR | SPI_TRANS_VARIABLE_CMD,
            .addr     = header,
            .length   = payload_length * 2 * 8,
            .rx_buffer = NULL,
            .tx_buffer = swapped,
        },
        .command_bits = 0,
        .address_bits = 16,
        .dummy_bits   = 0,
    };

    esp_err_t err = spi_device_transmit(s_spi, (spi_transaction_t *)&t);
    free(swapped);

    return (err == ESP_OK) ? E_BMV080_OK : E_BMV080_ERROR_HW_WRITE;
}

void bmv080_io_delay_ms(uint32_t ms)
{
    vTaskDelay(pdMS_TO_TICKS(ms));
}

uint32_t bmv080_io_tick_ms(void)
{
    return (uint32_t)(esp_timer_get_time() / 1000ULL);
}
