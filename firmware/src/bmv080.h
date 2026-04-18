#pragma once

#include <stdbool.h>
#include "https_post.h"

void bmv080_sensor_init(void);
void bmv080_start_task(void);
void bmv080_get_latest(sensor_reading_t *out);
