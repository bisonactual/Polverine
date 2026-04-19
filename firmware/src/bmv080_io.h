#pragma once

#include <stdint.h>
#include "bmv080_defs.h"

int8_t   bmv080_io_read(bmv080_sercom_handle_t sercom_handle, uint16_t header, uint16_t *payload, uint16_t payload_length);
int8_t   bmv080_io_write(bmv080_sercom_handle_t sercom_handle, uint16_t header, const uint16_t *payload, uint16_t payload_length);
int8_t   bmv080_io_delay_ms(uint32_t duration_in_ms);
uint32_t bmv080_io_tick_ms(void);

// Call first; returns the sercom_handle to pass to bmv080_open
bmv080_sercom_handle_t bmv080_io_init(void);
