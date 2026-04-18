#pragma once

// Pin assignments from working demo source (POLVERINE_FULL_MQTT_DEMO)

// BMV080 particulate matter sensor - SPI2
#define BMV080_SPI_HOST     SPI2_HOST
#define BMV080_PIN_MOSI     11
#define BMV080_PIN_MISO     13
#define BMV080_PIN_CLK      12
#define BMV080_PIN_CS       10
#define BMV080_SPI_FREQ_HZ  (1 * 1000 * 1000)

// BME690 gas/temp/humidity sensor - I2C
#define BME690_I2C_PORT     I2C_NUM_0
#define BME690_PIN_SDA      14
#define BME690_PIN_SCL      21
#define BME690_I2C_ADDR     0x76
#define BME690_I2C_FREQ_HZ  100000

// RGB LED
#define LED_PIN_R           47
#define LED_PIN_G           48
#define LED_PIN_B           38
