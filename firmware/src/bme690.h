#pragma once

#include <stdbool.h>

#include "https_post.h"

bool bme690_init(void);
bool bme690_start_task(void);
void bme690_get_latest(sensor_reading_t *out);
