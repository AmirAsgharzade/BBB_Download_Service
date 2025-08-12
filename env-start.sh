#!usr/bin/env bash

#set -e  # Exit immediately on error
#set -u  # Treat unset variables as error

LOG_FILE="/var/log/BBB_Service_log.log"

echo "[$(date)] Starting Puppeteer environment setup..." >> "$LOG_FILE"

# Start Xvfb on display :99
if ! pgrep -f "Xvfb :99" > /dev/null; then
  echo "[$(date)] Starting Xvfb on :99" >> "$LOG_FILE"
  Xvfb :99 -screen 0 1280x720x24 &
  sleep 2
else
  echo "[$(date)] Xvfb already running" >> "$LOG_FILE"
fi

export DISPLAY=:99

# Start PulseAudio
if ! pgrep pulseaudio > /dev/null; then
  echo "[$(date)] Starting PulseAudio" >> "$LOG_FILE"
  pulseaudio --start
  sleep 2
else
  echo "[$(date)] PulseAudio already running" >> "$LOG_FILE"
fi

# Load virtual sink
if ! pactl list short modules | grep -q module-null-sink; then
  echo "[$(date)] Loading virtual sink" >> "$LOG_FILE"
  pactl load-module module-null-sink sink_name=virtual_sink sink_properties=device.description=Virtual_Sink
else
  echo "[$(date)] Virtual sink already loaded" >> "$LOG_FILE"
fi

# Set default sink
pactl set-default-sink virtual_sink
echo "[$(date)] Default sink set to virtual_sink" >> "$LOG_FILE"

# Optional: start your Node.js server here, or run it via another systemd service
# /usr/bin/node /path/to/server.js

echo "[$(date)] Puppeteer environment ready." >> "$LOG_FILE"


# Keep script running so systemd doesn't think it exited
tail -f /dev/null

