#!/bin/bash
# Flash WiFi + Worker credentials into the device NVS partition.
# Usage: ./provision.sh [PORT]
#   PORT defaults to /dev/ttyUSB0 (Linux) — set to /dev/cu.usbmodem* on macOS

set -e

PORT=${1:-/dev/ttyUSB0}
NVS_OFFSET=0x9000
NVS_SIZE=0x6000       # must match partitions.csv
CSV=config.csv
BIN=nvs.bin

if [ ! -f "$CSV" ]; then
  echo "ERROR: $CSV not found."
  echo "Copy config.csv.example to config.csv and fill in your values."
  exit 1
fi

if [ -z "$IDF_PATH" ]; then
  echo "ERROR: IDF_PATH not set. Run: . \$IDF_PATH/export.sh"
  exit 1
fi

echo "Generating NVS binary from $CSV..."
python3 "$IDF_PATH/components/nvs_flash/nvs_partition_generator/nvs_partition_gen.py" \
  generate "$CSV" "$BIN" $NVS_SIZE

echo "Flashing to device on $PORT at offset $NVS_OFFSET..."
python3 -m esptool --port "$PORT" --baud 460800 write_flash $NVS_OFFSET "$BIN"

echo "Done. Power-cycle the device to pick up the new config."
