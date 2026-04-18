#pragma once

#include "https_post.h"

void bme690_init(void);
void bme690_start_task(void);
void bme690_get_latest(sensor_reading_t *out);
