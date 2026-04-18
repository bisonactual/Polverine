#pragma once

#include "bmv080_defs.h"

bmv080_status_code_t bmv080_io_read(bmv080_sercom_handle_t handle, uint8_t *data, uint16_t len);
bmv080_status_code_t bmv080_io_write(bmv080_sercom_handle_t handle, const uint8_t *data, uint16_t len);
void                 bmv080_io_delay_ms(uint32_t ms);
uint32_t             bmv080_io_tick_ms(void);
void                 bmv080_io_init(void);
