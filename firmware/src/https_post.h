#pragma once

#include <stdbool.h>

typedef struct {
    float temperature;
    float humidity;
    float pressure;
    float iaq;
    int   iaq_accuracy;
    float co2_eq;
    float voc_eq;
    float pm1;
    float pm2_5;
    float pm10;
    bool  pm_valid;
    long  timestamp;
} sensor_reading_t;

esp_err_t https_post_reading(const sensor_reading_t *r);
