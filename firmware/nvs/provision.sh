#!/bin/bash
# Flash WiFi + Worker credentials into the device NVS partition.
# Usage: ./provision.sh [PORT]
#   PORT defaults to /dev/ttyACM0 (Polverine on Linux/WSL) - set to /dev/cu.usbmodem* on macOS

set -euo pipefail

PORT=${1:-/dev/ttyACM0}
NVS_OFFSET=0x9000
NVS_SIZE=0x6000       # must match partitions.csv
CSV=config.csv
BIN=nvs.bin

if [ ! -f "$CSV" ]; then
  echo "ERROR: $CSV not found."
  echo "Copy config.csv.example to config.csv and fill in your values."
  exit 1
fi

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
PIO_IDF_DEFAULT="$HOME/.platformio/packages/framework-espidf"
PIO_ESPTOOL_DEFAULT="$HOME/.platformio/packages/tool-esptoolpy/esptool.py"

if [ -n "${IDF_PATH:-}" ] && [ -f "$IDF_PATH/components/nvs_flash/nvs_partition_generator/nvs_partition_gen.py" ]; then
  NVS_GEN="$IDF_PATH/components/nvs_flash/nvs_partition_generator/nvs_partition_gen.py"
elif [ -f "$PIO_IDF_DEFAULT/components/nvs_flash/nvs_partition_generator/nvs_partition_gen.py" ]; then
  NVS_GEN="$PIO_IDF_DEFAULT/components/nvs_flash/nvs_partition_generator/nvs_partition_gen.py"
else
  echo "ERROR: Could not find nvs_partition_gen.py. Set IDF_PATH or install PlatformIO ESP-IDF packages."
  exit 1
fi

if python3 -m esptool version >/dev/null 2>&1; then
  ESPTOOL=(python3 -m esptool)
elif [ -f "$PIO_ESPTOOL_DEFAULT" ]; then
  ESPTOOL=(python3 "$PIO_ESPTOOL_DEFAULT")
else
  echo "ERROR: Could not find esptool. Install it or use PlatformIO tool-esptoolpy."
  exit 1
fi

cd "$SCRIPT_DIR"

echo "Generating NVS binary from $CSV..."
python3 "$NVS_GEN" generate "$CSV" "$BIN" $NVS_SIZE

echo "Flashing to device on $PORT at offset $NVS_OFFSET..."
"${ESPTOOL[@]}" --port "$PORT" --baud 460800 write_flash $NVS_OFFSET "$BIN"

echo "Done. Power-cycle the device to pick up the new config."
